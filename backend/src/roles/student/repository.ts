// SQL (parameterized) and row -> DTO mapping for the Student role.
// Every function receives the DB client of the transaction/snapshot owned by the service.
// Rows are never returned as-is: only DTO keys, BIGINT money as string, DATE as YYYY-MM-DD,
// timestamps as UTC ISO-8601 (Z).
import type { PoolClient } from 'pg';
import type { PageInput, RoomQueryInput, ContactPatchInput } from './validation.js';

export type Db = Pick<PoolClient, 'query'>;

export interface StudentProfileDto {
  id: string; studentCode: string; fullName: string; gender: 'MALE' | 'FEMALE'; className: string; faculty: string;
  phone: string | null; email: string | null; dateOfBirth: string | null; permanentAddress: string | null;
  createdAt: string; updatedAt: string;
}
export interface BuildingDto { id: string; code: string; name: string; createdAt: string; updatedAt: string }
export interface RoomDto {
  id: string; buildingId: string; buildingCode: string; buildingName: string; code: string; capacity: number;
  gender: 'MALE' | 'FEMALE'; feeVnd: string; status: 'ACTIVE' | 'INACTIVE';
  allocatedPlaces: number; availablePlaces: number; createdAt: string; updatedAt: string;
}
export interface RegistrationPeriodDto { id: 1; status: 'OPEN' | 'CLOSED'; updatedBy: string | null; updatedAt: string }

type Timestamp = Date | string;
const iso = (value: Timestamp): string => new Date(value).toISOString().replace(/\.\d{3}Z$/, 'Z');

const PROFILE_COLUMNS = `id, student_code, full_name, gender, class_name, faculty, phone, email,
  to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, permanent_address, created_at, updated_at`;

interface ProfileRow {
  id: string; student_code: string; full_name: string; gender: 'MALE' | 'FEMALE'; class_name: string; faculty: string;
  phone: string | null; email: string | null; date_of_birth: string | null; permanent_address: string | null;
  created_at: Timestamp; updated_at: Timestamp;
}
const toProfile = (r: ProfileRow): StudentProfileDto => ({
  id: r.id, studentCode: r.student_code, fullName: r.full_name, gender: r.gender, className: r.class_name,
  faculty: r.faculty, phone: r.phone, email: r.email, dateOfBirth: r.date_of_birth,
  permanentAddress: r.permanent_address, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
});

interface BuildingRow { id: string; code: string; name: string; created_at: Timestamp; updated_at: Timestamp }
const toBuilding = (r: BuildingRow): BuildingDto => ({
  id: r.id, code: r.code, name: r.name, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
});

const ROOM_COLUMNS = `ra.id, ra.building_id, ra.building_code, ra.building_name, ra.code, ra.capacity, ra.gender,
  ra.fee_vnd::text AS fee_vnd, ra.status, ra.allocated_places, ra.available_places, ra.created_at, ra.updated_at`;
interface RoomRow {
  id: string; building_id: string; building_code: string; building_name: string; code: string; capacity: number;
  gender: 'MALE' | 'FEMALE'; fee_vnd: string; status: 'ACTIVE' | 'INACTIVE';
  allocated_places: number; available_places: number; created_at: Timestamp; updated_at: Timestamp;
}
const toRoom = (r: RoomRow): RoomDto => ({
  id: r.id, buildingId: r.building_id, buildingCode: r.building_code, buildingName: r.building_name, code: r.code,
  capacity: r.capacity, gender: r.gender, feeVnd: r.fee_vnd, status: r.status,
  allocatedPlaces: r.allocated_places, availablePlaces: r.available_places,
  createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
});

const offsetOf = (p: PageInput): string => (BigInt(p.page - 1) * BigInt(p.pageSize)).toString();

/** LIKE pattern with %, _ and \ treated literally (paired with ESCAPE '\'). */
export const likeContains = (q: string): string => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

// ---- studentGetProfile / studentUpdateContact -------------------------------------------------

export async function studentGetProfile(db: Db, studentId: string): Promise<StudentProfileDto | null> {
  const { rows } = await db.query<ProfileRow>(
    `SELECT ${PROFILE_COLUMNS} FROM student_profiles WHERE id = $1`, [studentId]);
  return rows[0] ? toProfile(rows[0]) : null;
}

/** Writes only the allowlisted contact columns present in `changes`. Caller holds the business lock. */
export async function studentUpdateContact(
  db: Db, studentId: string, changes: ContactPatchInput,
): Promise<StudentProfileDto | null> {
  const params: unknown[] = [studentId];
  const sets: string[] = [];
  if (changes.phone !== undefined) { params.push(changes.phone); sets.push(`phone = $${params.length}`); }
  if (changes.email !== undefined) { params.push(changes.email); sets.push(`email = $${params.length}`); }
  if (sets.length === 0) throw new Error('studentUpdateContact requires at least one changed column');
  const { rows } = await db.query<ProfileRow>(
    `UPDATE student_profiles SET ${sets.join(', ')} WHERE id = $1 RETURNING ${PROFILE_COLUMNS}`, params);
  return rows[0] ? toProfile(rows[0]) : null;
}

// ---- studentListBuildings ---------------------------------------------------------------------

const ACTIVE_BUILDINGS = `FROM buildings b
  WHERE EXISTS (SELECT 1 FROM rooms r WHERE r.building_id = b.id AND r.status = 'ACTIVE')`;

export async function studentListBuildings(db: Db, p: PageInput): Promise<{ items: BuildingDto[]; total: number }> {
  const list = await db.query<BuildingRow>(
    `SELECT b.id, b.code, b.name, b.created_at, b.updated_at ${ACTIVE_BUILDINGS}
     ORDER BY b.code ASC, b.id ASC LIMIT $1 OFFSET $2::bigint`, [p.pageSize, offsetOf(p)]);
  const count = await db.query<{ total: number }>(`SELECT count(*)::integer AS total ${ACTIVE_BUILDINGS}`);
  return { items: list.rows.map(toBuilding), total: count.rows[0]?.total ?? 0 };
}

// ---- studentListRooms / studentGetRoom --------------------------------------------------------

function roomFilter(q: RoomQueryInput): { where: string; params: unknown[] } {
  const params: unknown[] = [];
  const add = (value: unknown): string => { params.push(value); return `$${params.length}`; };
  const where = [`ra.status = 'ACTIVE'`]; // always enforced on the server; SV cannot choose status
  if (q.buildingId !== undefined) where.push(`ra.building_id = ${add(q.buildingId)}`);
  if (q.gender !== undefined) where.push(`ra.gender = ${add(q.gender)}`);
  if (q.hasAvailability === true) where.push('ra.available_places > 0');
  if (q.hasAvailability === false) where.push('ra.available_places = 0');
  if (q.q !== undefined) {
    const p = add(likeContains(q.q));
    where.push(`(ra.code ILIKE ${p} ESCAPE '\\' OR ra.building_code ILIKE ${p} ESCAPE '\\' OR ra.building_name ILIKE ${p} ESCAPE '\\')`);
  }
  return { where: where.join(' AND '), params };
}

export async function studentListRooms(db: Db, q: RoomQueryInput): Promise<{ items: RoomDto[]; total: number }> {
  const { where, params } = roomFilter(q);
  const limit = `$${params.length + 1}`;
  const offset = `$${params.length + 2}::bigint`;
  const list = await db.query<RoomRow>(
    `SELECT ${ROOM_COLUMNS} FROM room_availability ra WHERE ${where}
     ORDER BY ra.building_code ASC, ra.code ASC, ra.id ASC LIMIT ${limit} OFFSET ${offset}`,
    [...params, q.pageSize, offsetOf(q)]);
  const count = await db.query<{ total: number }>(
    `SELECT count(*)::integer AS total FROM room_availability ra WHERE ${where}`, params);
  return { items: list.rows.map(toRoom), total: count.rows[0]?.total ?? 0 };
}

export async function studentGetRoom(db: Db, roomId: string): Promise<RoomDto | null> {
  const { rows } = await db.query<RoomRow>(
    `SELECT ${ROOM_COLUMNS} FROM room_availability ra WHERE ra.id = $1 AND ra.status = 'ACTIVE'`, [roomId]);
  return rows[0] ? toRoom(rows[0]) : null;
}

// ---- studentGetPeriod -------------------------------------------------------------------------

export async function studentGetPeriod(db: Db): Promise<RegistrationPeriodDto | null> {
  const { rows } = await db.query<{ id: number; status: 'OPEN' | 'CLOSED'; updated_by: string | null; updated_at: Timestamp }>(
    'SELECT id, status, updated_by, updated_at FROM registration_period WHERE id = 1');
  const r = rows[0];
  return r ? { id: 1, status: r.status, updatedBy: r.updated_by, updatedAt: iso(r.updated_at) } : null;
}
