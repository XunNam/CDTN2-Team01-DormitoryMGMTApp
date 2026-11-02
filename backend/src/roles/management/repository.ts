import type { PoolClient } from 'pg';
import type { PageMeta } from '../../shared/http/response.js';

type Queryable = Pick<PoolClient, 'query'>;

export type Gender = 'MALE' | 'FEMALE';
export type RoomStatus = 'ACTIVE' | 'INACTIVE';
export type PeriodStatus = 'OPEN' | 'CLOSED';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ResidenceStatus = 'ALLOCATED' | 'CHECKED_IN' | 'ENDED' | 'CANCELLED';
export type ReceiptStatus = 'UNPAID' | 'PAID';

export interface StudentProfile {
  id: string;
  studentCode: string;
  fullName: string;
  gender: Gender;
  className: string;
  faculty: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  permanentAddress: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  buildingId: string;
  buildingCode: string;
  buildingName: string;
  code: string;
  capacity: number;
  gender: Gender;
  feeVnd: string;
  status: RoomStatus;
  allocatedPlaces: number;
  availablePlaces: number;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationPeriod {
  id: number;
  status: PeriodStatus;
  updatedBy: string | null;
  updatedAt: string;
}

export interface Application {
  id: string;
  studentId: string;
  preferredRoomId: string;
  periodId: number;
  status: ApplicationStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Residence {
  id: string;
  applicationId: string;
  studentId: string;
  roomId: string;
  status: ResidenceStatus;
  allocatedBy: string;
  allocatedAt: string;
  checkInDate: string | null;
  checkedInBy: string | null;
  checkedInAt: string | null;
  checkOutDate: string | null;
  checkedOutBy: string | null;
  checkedOutAt: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
}

export interface Receipt {
  id: string;
  residenceId: string;
  amountVnd: string;
  status: ReceiptStatus;
  createdBy: string;
  createdAt: string;
  paymentDate: string | null;
  paidBy: string | null;
  paidAt: string | null;
}

export interface Statistics {
  totalRooms: number;
  availablePlaces: number;
  currentResidents: number;
  unpaidReceipts: number;
}

export interface ApprovalResult {
  application: Application;
  residence: Residence;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  q?: string;
}

export interface StudentProfileQuery extends PageQuery {
  gender?: Gender;
}

export interface RoomQuery extends PageQuery {
  buildingId?: string;
  gender?: Gender;
  hasAvailability?: boolean;
  status?: RoomStatus;
}

export interface ApplicationQuery extends PageQuery {
  status?: ApplicationStatus;
  studentId?: string;
  preferredRoomId?: string;
}

export interface ResidenceQuery extends PageQuery {
  status?: ResidenceStatus;
  studentId?: string;
  roomId?: string;
}

export interface ReceiptQuery extends PageQuery {
  status?: ReceiptStatus;
  studentId?: string;
  residenceId?: string;
}

export interface ApplicationApproveInput {
  roomId: string;
}

export interface ApplicationRejectInput {
  reason: string;
}

export interface CheckInInput {
  checkInDate: string;
}

export interface CancelAllocationInput {
  reason: string;
}

export interface CheckOutInput {
  checkOutDate: string;
}

export interface ReceiptCreateInput {
  residenceId: string;
}

export interface ReceiptPayInput {
  paymentDate: string;
}

export interface ProfileCreateInput {
  studentCode: string;
  fullName: string;
  gender: Gender;
  className: string;
  faculty: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  permanentAddress?: string | null;
}

export type ProfilePatchInput = Partial<Omit<ProfileCreateInput, 'studentCode'>>;

export interface BuildingCreateInput {
  code: string;
  name: string;
}

export interface BuildingPatchInput {
  name: string;
}

export interface RoomCreateInput {
  buildingId: string;
  code: string;
  capacity: number;
  gender: Gender;
  feeVnd: string;
  status: RoomStatus;
}

export type RoomPatchInput = Partial<Pick<RoomCreateInput, 'capacity' | 'gender' | 'feeVnd' | 'status'>>;

export interface ListResult<T> {
  items: T[];
  meta: PageMeta;
}

interface ProfileRow {
  id: string;
  student_code: string;
  full_name: string;
  gender: Gender;
  class_name: string;
  faculty: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  permanent_address: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface BuildingRow {
  id: string;
  code: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
}

interface RoomRow {
  id: string;
  building_id: string;
  building_code: string;
  building_name: string;
  code: string;
  capacity: number;
  gender: Gender;
  fee_vnd: string;
  status: RoomStatus;
  allocated_places: number;
  available_places: number;
  created_at: Date | string;
  updated_at: Date | string;
}

interface PeriodRow {
  id: number;
  status: PeriodStatus;
  updated_by: string | null;
  updated_at: Date | string;
}

interface ApplicationRow {
  id: string;
  student_id: string;
  preferred_room_id: string;
  period_id: number;
  status: ApplicationStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ResidenceRow {
  id: string;
  application_id: string;
  student_id: string;
  room_id: string;
  status: ResidenceStatus;
  allocated_by: string;
  allocated_at: Date | string;
  check_in_date: string | null;
  checked_in_by: string | null;
  checked_in_at: Date | string | null;
  check_out_date: string | null;
  checked_out_by: string | null;
  checked_out_at: Date | string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: Date | string | null;
}

interface ReceiptRow {
  id: string;
  residence_id: string;
  amount_vnd: string;
  status: ReceiptStatus;
  created_by: string;
  created_at: Date | string;
  payment_date: string | null;
  paid_by: string | null;
  paid_at: Date | string | null;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapProfile(row: ProfileRow): StudentProfile {
  return {
    id: row.id,
    studentCode: row.student_code,
    fullName: row.full_name,
    gender: row.gender,
    className: row.class_name,
    faculty: row.faculty,
    phone: row.phone,
    email: row.email,
    dateOfBirth: row.date_of_birth,
    permanentAddress: row.permanent_address,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapBuilding(row: BuildingRow): Building {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    buildingId: row.building_id,
    buildingCode: row.building_code,
    buildingName: row.building_name,
    code: row.code,
    capacity: row.capacity,
    gender: row.gender,
    feeVnd: row.fee_vnd,
    status: row.status,
    allocatedPlaces: row.allocated_places,
    availablePlaces: row.available_places,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapPeriod(row: PeriodRow): RegistrationPeriod {
  return {
    id: row.id,
    status: row.status,
    updatedBy: row.updated_by,
    updatedAt: toIso(row.updated_at),
  };
}

function mapApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    studentId: row.student_id,
    preferredRoomId: row.preferred_room_id,
    periodId: row.period_id,
    status: row.status,
    rejectionReason: row.rejection_reason,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at === null ? null : toIso(row.reviewed_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapResidence(row: ResidenceRow): Residence {
  return {
    id: row.id,
    applicationId: row.application_id,
    studentId: row.student_id,
    roomId: row.room_id,
    status: row.status,
    allocatedBy: row.allocated_by,
    allocatedAt: toIso(row.allocated_at),
    checkInDate: row.check_in_date,
    checkedInBy: row.checked_in_by,
    checkedInAt: row.checked_in_at === null ? null : toIso(row.checked_in_at),
    checkOutDate: row.check_out_date,
    checkedOutBy: row.checked_out_by,
    checkedOutAt: row.checked_out_at === null ? null : toIso(row.checked_out_at),
    cancellationReason: row.cancellation_reason,
    cancelledBy: row.cancelled_by,
    cancelledAt: row.cancelled_at === null ? null : toIso(row.cancelled_at),
  };
}

function mapReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    residenceId: row.residence_id,
    amountVnd: row.amount_vnd,
    status: row.status,
    createdBy: row.created_by,
    createdAt: toIso(row.created_at),
    paymentDate: row.payment_date,
    paidBy: row.paid_by,
    paidAt: row.paid_at === null ? null : toIso(row.paid_at),
  };
}

function pageMeta(page: number, pageSize: number, totalItems: number): PageMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
  };
}


export async function managementListProfiles(db: Queryable, query: StudentProfileQuery): Promise<ListResult<StudentProfile>> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (query.q) {
    values.push(query.q);
    clauses.push(`(POSITION(LOWER($${values.length}) IN LOWER(student_code)) > 0 OR POSITION(LOWER($${values.length}) IN LOWER(full_name)) > 0)`);
  }
  if (query.gender) {
    values.push(query.gender);
    clauses.push(`gender = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM student_profiles ${where}`, values);
  const totalItems = Number(count.rows[0]?.total ?? 0);
  const listValues = [...values, query.pageSize, ((BigInt(query.page)-1n)*BigInt(query.pageSize)).toString()];
  const result = await db.query<ProfileRow>(
    `SELECT id, student_code, full_name, gender, class_name, faculty, phone, email,
            date_of_birth::text AS date_of_birth, permanent_address, created_at, updated_at
       FROM student_profiles ${where}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );
  return { items: result.rows.map(mapProfile), meta: pageMeta(query.page, query.pageSize, totalItems) };
}

export async function managementCreateProfile(db: Queryable, input: ProfileCreateInput): Promise<StudentProfile> {
  const result = await db.query<ProfileRow>(
    `INSERT INTO student_profiles
       (student_code, full_name, gender, class_name, faculty, phone, email, date_of_birth, permanent_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::date, $9)
     RETURNING id, student_code, full_name, gender, class_name, faculty, phone, email,
               date_of_birth::text AS date_of_birth, permanent_address, created_at, updated_at`,
    [
      input.studentCode,
      input.fullName,
      input.gender,
      input.className,
      input.faculty,
      input.phone ?? null,
      input.email ?? null,
      input.dateOfBirth ?? null,
      input.permanentAddress ?? null,
    ],
  );
  return mapProfile(result.rows[0]!);
}

export async function managementGetProfile(db: Queryable, studentId: string): Promise<StudentProfile | null> {
  const result = await db.query<ProfileRow>(
    `SELECT id, student_code, full_name, gender, class_name, faculty, phone, email,
            date_of_birth::text AS date_of_birth, permanent_address, created_at, updated_at
       FROM student_profiles WHERE id = $1`,
    [studentId],
  );
  return result.rows[0] ? mapProfile(result.rows[0]) : null;
}

const profilePatchColumns: Record<keyof ProfilePatchInput, string> = {
  fullName: 'full_name',
  gender: 'gender',
  className: 'class_name',
  faculty: 'faculty',
  phone: 'phone',
  email: 'email',
  dateOfBirth: 'date_of_birth',
  permanentAddress: 'permanent_address',
};

export async function managementUpdateProfile(db: Queryable, studentId: string, patch: ProfilePatchInput): Promise<StudentProfile | null> {
  const values: unknown[]=[studentId];
  const sets=(Object.keys(patch) as Array<keyof ProfilePatchInput>).map(key=>{
    values.push(patch[key]); return `${profilePatchColumns[key]}=$${values.length}${key==='dateOfBirth'?'::date':''}`;
  });
  const result=await db.query<ProfileRow>(`UPDATE student_profiles SET ${sets.join(',')} WHERE id=$1
    RETURNING id,student_code,full_name,gender,class_name,faculty,phone,email,date_of_birth::text AS date_of_birth,permanent_address,created_at,updated_at`,values);
  return result.rows[0]?mapProfile(result.rows[0]):null;
}

export async function managementListBuildings(db: Queryable, query: PageQuery): Promise<ListResult<Building>> {
  const values: unknown[] = [];
  let where = '';
  if (query.q) {
    values.push(query.q);
    where = `WHERE POSITION(LOWER($1) IN LOWER(code)) > 0 OR POSITION(LOWER($1) IN LOWER(name)) > 0`;
  }
  const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM buildings ${where}`, values);
  const totalItems = Number(count.rows[0]?.total ?? 0);
  const result = await db.query<BuildingRow>(
    `SELECT id, code, name, created_at, updated_at FROM buildings ${where}
      ORDER BY code ASC, id ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.pageSize, ((BigInt(query.page)-1n)*BigInt(query.pageSize)).toString()],
  );
  return { items: result.rows.map(mapBuilding), meta: pageMeta(query.page, query.pageSize, totalItems) };
}

export async function managementCreateBuilding(db: Queryable, input: BuildingCreateInput): Promise<Building> {
  const result = await db.query<BuildingRow>(
    `INSERT INTO buildings (code, name) VALUES ($1, $2)
     RETURNING id, code, name, created_at, updated_at`,
    [input.code, input.name],
  );
  return mapBuilding(result.rows[0]!);
}

export async function managementGetBuilding(db: Queryable, buildingId: string): Promise<Building | null> {
  const result = await db.query<BuildingRow>(
    `SELECT id, code, name, created_at, updated_at FROM buildings WHERE id = $1`,
    [buildingId],
  );
  return result.rows[0] ? mapBuilding(result.rows[0]) : null;
}

export async function managementUpdateBuilding(db: Queryable, buildingId: string, input: BuildingPatchInput): Promise<Building | null> {
  const result=await db.query<BuildingRow>(`UPDATE buildings SET name=$2 WHERE id=$1 RETURNING id,code,name,created_at,updated_at`,[buildingId,input.name]);
  return result.rows[0]?mapBuilding(result.rows[0]):null;
}

export async function managementListRooms(db: Queryable, query: RoomQuery): Promise<ListResult<Room>> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (query.q) {
    values.push(query.q);
    clauses.push(`(POSITION(LOWER($${values.length}) IN LOWER(code)) > 0
      OR POSITION(LOWER($${values.length}) IN LOWER(building_code)) > 0
      OR POSITION(LOWER($${values.length}) IN LOWER(building_name)) > 0)`);
  }
  if (query.buildingId) {
    values.push(query.buildingId);
    clauses.push(`building_id = $${values.length}`);
  }
  if (query.gender) {
    values.push(query.gender);
    clauses.push(`gender = $${values.length}`);
  }
  if (query.hasAvailability !== undefined) clauses.push(query.hasAvailability ? 'available_places > 0' : 'available_places = 0');
  if (query.status) {
    values.push(query.status);
    clauses.push(`status = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM room_availability ${where}`, values);
  const totalItems = Number(count.rows[0]?.total ?? 0);
  const result = await db.query<RoomRow>(
    `SELECT id, building_id, building_code, building_name, code, capacity, gender,
            fee_vnd::text AS fee_vnd, status, allocated_places, available_places, created_at, updated_at
       FROM room_availability ${where}
      ORDER BY building_code ASC, code ASC, id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.pageSize, ((BigInt(query.page)-1n)*BigInt(query.pageSize)).toString()],
  );
  return { items: result.rows.map(mapRoom), meta: pageMeta(query.page, query.pageSize, totalItems) };
}

export async function managementCreateRoom(db: Queryable, input: RoomCreateInput): Promise<Room> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO rooms (building_id, code, capacity, gender, fee_vnd, status)
     VALUES ($1, $2, $3, $4, $5::bigint, $6)
     RETURNING id`,
    [input.buildingId, input.code, input.capacity, input.gender, input.feeVnd, input.status],
  );
  const room = await managementGetRoom(db, result.rows[0]!.id);
  if (!room) throw new Error('Inserted room could not be loaded.');
  return room;
}

export async function managementGetRoom(db: Queryable, roomId: string): Promise<Room | null> {
  const result = await db.query<RoomRow>(
    `SELECT id, building_id, building_code, building_name, code, capacity, gender,
            fee_vnd::text AS fee_vnd, status, allocated_places, available_places, created_at, updated_at
       FROM room_availability WHERE id = $1`,
    [roomId],
  );
  return result.rows[0] ? mapRoom(result.rows[0]) : null;
}

const roomPatchColumns: Record<keyof RoomPatchInput, string> = {
  capacity: 'capacity',
  gender: 'gender',
  feeVnd: 'fee_vnd',
  status: 'status',
};

export async function managementUpdateRoom(db: Queryable, roomId: string, patch: RoomPatchInput): Promise<Room | null> {
  const values: unknown[]=[roomId];
  const sets=(Object.keys(patch) as Array<keyof RoomPatchInput>).map(key=>{
    values.push(patch[key]);return `${roomPatchColumns[key]}=$${values.length}${key==='feeVnd'?'::bigint':''}`;
  });
  await db.query(`UPDATE rooms SET ${sets.join(',')} WHERE id=$1`,values);
  return managementGetRoom(db,roomId);
}

export async function managementGetPeriod(db: Queryable): Promise<RegistrationPeriod> {
  const result = await db.query<PeriodRow>(
    `SELECT id, status, updated_by, updated_at FROM registration_period WHERE id = 1`,
  );
  if (!result.rows[0]) throw new Error('Registration period singleton row is missing.');
  return mapPeriod(result.rows[0]);
}

export async function managementUpdatePeriod(db: Queryable, status: PeriodStatus, actorId: string): Promise<RegistrationPeriod> {
  const result=await db.query<PeriodRow>(`UPDATE registration_period SET status=$1,updated_by=$2 WHERE id=1 RETURNING id,status,updated_by,updated_at`,[status,actorId]);
  return mapPeriod(result.rows[0]!);
}

const applicationColumns = `id, student_id, preferred_room_id, period_id, status, rejection_reason,
  reviewed_by, reviewed_at, created_at, updated_at`;
const residenceColumns = `id, application_id, student_id, room_id, status, allocated_by, allocated_at,
  check_in_date::text AS check_in_date, checked_in_by, checked_in_at,
  check_out_date::text AS check_out_date, checked_out_by, checked_out_at,
  cancellation_reason, cancelled_by, cancelled_at`;
const receiptColumns = `id, residence_id, amount_vnd::text AS amount_vnd, status, created_by, created_at,
  payment_date::text AS payment_date, paid_by, paid_at`;

export async function managementListApplications(
  db: Queryable,
  query: ApplicationQuery,
): Promise<ListResult<Application>> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (query.status) {
    values.push(query.status);
    clauses.push(`status = $${values.length}`);
  }
  if (query.studentId) {
    values.push(query.studentId);
    clauses.push(`student_id = $${values.length}`);
  }
  if (query.preferredRoomId) {
    values.push(query.preferredRoomId);
    clauses.push(`preferred_room_id = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const count = await db.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM applications ${where}`,
    values,
  );
  const result = await db.query<ApplicationRow>(
    `SELECT ${applicationColumns} FROM applications ${where}
      ORDER BY created_at DESC, id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.pageSize, ((BigInt(query.page)-1n)*BigInt(query.pageSize)).toString()],
  );
  const totalItems = Number(count.rows[0]?.total ?? 0);
  return { items: result.rows.map(mapApplication), meta: pageMeta(query.page, query.pageSize, totalItems) };
}

export async function managementGetApplication(db: Queryable, applicationId: string): Promise<Application | null> {
  const result = await db.query<ApplicationRow>(
    `SELECT ${applicationColumns} FROM applications WHERE id = $1`,
    [applicationId],
  );
  return result.rows[0] ? mapApplication(result.rows[0]) : null;
}

export async function managementApproveApplication(db: Queryable, applicationId: string, roomId: string, actorId: string): Promise<ApprovalResult> {
  const approved=await db.query<ApplicationRow>(`UPDATE applications SET status='APPROVED',reviewed_by=$2 WHERE id=$1 RETURNING ${applicationColumns}`,[applicationId,actorId]);
  const residence=await db.query<ResidenceRow>(`INSERT INTO residence_records(application_id,student_id,room_id,allocated_by)
    VALUES($1,$2,$3,$4) RETURNING ${residenceColumns}`,[applicationId,approved.rows[0]!.student_id,roomId,actorId]);
  return {application:mapApplication(approved.rows[0]!),residence:mapResidence(residence.rows[0]!)};
}

export async function managementRejectApplication(db: Queryable, applicationId: string, reason: string, actorId: string): Promise<Application> {
  const result=await db.query<ApplicationRow>(`UPDATE applications SET status='REJECTED',rejection_reason=$2,reviewed_by=$3 WHERE id=$1 RETURNING ${applicationColumns}`,[applicationId,reason,actorId]);
  return mapApplication(result.rows[0]!);
}

export async function managementListResidences(
  db: Queryable,
  query: ResidenceQuery,
): Promise<ListResult<Residence>> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (query.status) {
    values.push(query.status);
    clauses.push(`status = $${values.length}`);
  }
  if (query.studentId) {
    values.push(query.studentId);
    clauses.push(`student_id = $${values.length}`);
  }
  if (query.roomId) {
    values.push(query.roomId);
    clauses.push(`room_id = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const count = await db.query<{ total: string }>(
    `SELECT count(*)::text AS total FROM residence_records ${where}`,
    values,
  );
  const result = await db.query<ResidenceRow>(
    `SELECT ${residenceColumns} FROM residence_records ${where}
      ORDER BY allocated_at DESC, id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.pageSize, ((BigInt(query.page)-1n)*BigInt(query.pageSize)).toString()],
  );
  const totalItems = Number(count.rows[0]?.total ?? 0);
  return { items: result.rows.map(mapResidence), meta: pageMeta(query.page, query.pageSize, totalItems) };
}

export async function managementGetResidence(db: Queryable, residenceId: string): Promise<Residence | null> {
  const result = await db.query<ResidenceRow>(
    `SELECT ${residenceColumns} FROM residence_records WHERE id = $1`,
    [residenceId],
  );
  return result.rows[0] ? mapResidence(result.rows[0]) : null;
}


export async function managementCheckIn(db: Queryable, residenceId: string, date: string, actorId: string): Promise<Residence> {
  const result=await db.query<ResidenceRow>(`UPDATE residence_records SET status='CHECKED_IN',check_in_date=$2::date,checked_in_by=$3 WHERE id=$1 RETURNING ${residenceColumns}`,[residenceId,date,actorId]);
  return mapResidence(result.rows[0]!);
}

export async function managementCancelAllocation(db: Queryable, residenceId: string, reason: string, actorId: string): Promise<Residence> {
  const result=await db.query<ResidenceRow>(`UPDATE residence_records SET status='CANCELLED',cancellation_reason=$2,cancelled_by=$3 WHERE id=$1 RETURNING ${residenceColumns}`,[residenceId,reason,actorId]);
  return mapResidence(result.rows[0]!);
}

export async function managementCheckOut(db: Queryable, residenceId: string, date: string, actorId: string): Promise<Residence> {
  const result=await db.query<ResidenceRow>(`UPDATE residence_records SET status='ENDED',check_out_date=$2::date,checked_out_by=$3 WHERE id=$1 RETURNING ${residenceColumns}`,[residenceId,date,actorId]);
  return mapResidence(result.rows[0]!);
}

export async function managementListReceipts(
  db: Queryable,
  query: ReceiptQuery,
): Promise<ListResult<Receipt>> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (query.status) {
    values.push(query.status);
    clauses.push(`rf.status = $${values.length}`);
  }
  if (query.studentId) {
    values.push(query.studentId);
    clauses.push(`rr.student_id = $${values.length}`);
  }
  if (query.residenceId) {
    values.push(query.residenceId);
    clauses.push(`rf.residence_id = $${values.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const from = `FROM room_fee_receipts rf JOIN residence_records rr ON rr.id = rf.residence_id ${where}`;
  const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total ${from}`, values);
  const result = await db.query<ReceiptRow>(
    `SELECT rf.id, rf.residence_id, rf.amount_vnd::text AS amount_vnd, rf.status, rf.created_by,
            rf.created_at, rf.payment_date::text AS payment_date, rf.paid_by, rf.paid_at
       ${from}
      ORDER BY rf.created_at DESC, rf.id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, query.pageSize, ((BigInt(query.page)-1n)*BigInt(query.pageSize)).toString()],
  );
  const totalItems = Number(count.rows[0]?.total ?? 0);
  return { items: result.rows.map(mapReceipt), meta: pageMeta(query.page, query.pageSize, totalItems) };
}

export async function managementCreateReceipt(db: Queryable, residenceId: string, actorId: string): Promise<Receipt> {
  const result=await db.query<ReceiptRow>(`INSERT INTO room_fee_receipts(residence_id,created_by) VALUES($1,$2) RETURNING ${receiptColumns}`,[residenceId,actorId]);
  return mapReceipt(result.rows[0]!);
}

export async function managementGetReceipt(db: Queryable, receiptId: string): Promise<Receipt | null> {
  const result = await db.query<ReceiptRow>(
    `SELECT ${receiptColumns} FROM room_fee_receipts WHERE id = $1`,
    [receiptId],
  );
  return result.rows[0] ? mapReceipt(result.rows[0]) : null;
}

export async function managementPayReceipt(db: Queryable, receiptId: string, date: string, actorId: string): Promise<Receipt> {
  const result=await db.query<ReceiptRow>(`UPDATE room_fee_receipts SET status='PAID',payment_date=$2::date,paid_by=$3 WHERE id=$1 RETURNING ${receiptColumns}`,[receiptId,date,actorId]);
  return mapReceipt(result.rows[0]!);
}

export async function managementGetStatistics(db: Queryable): Promise<Statistics> {
  const result = await db.query<{
    total_rooms: number;
    available_places: number;
    current_residents: number;
    unpaid_receipts: number;
  }>(
    `SELECT
       (SELECT count(*)::integer FROM rooms WHERE status = 'ACTIVE') AS total_rooms,
       (SELECT COALESCE(sum(available_places), 0)::integer FROM room_availability WHERE status = 'ACTIVE') AS available_places,
       (SELECT count(*)::integer FROM residence_records WHERE status = 'CHECKED_IN') AS current_residents,
       (SELECT count(*)::integer FROM room_fee_receipts WHERE status = 'UNPAID') AS unpaid_receipts`,
  );
  const row = result.rows[0]!;
  return {
    totalRooms: row.total_rooms,
    availablePlaces: row.available_places,
    currentResidents: row.current_residents,
    unpaidReceipts: row.unpaid_receipts,
  };
}

export async function profileGenderMismatch(db:Queryable,id:string,gender:Gender) {
  return !!(await db.query(`SELECT 1 FROM residence_records rr JOIN rooms r ON r.id=rr.room_id
    WHERE rr.student_id=$1 AND rr.status IN ('ALLOCATED','CHECKED_IN') AND r.gender<>$2 LIMIT 1`,[id,gender])).rowCount;
}
export async function roomGenderMismatch(db:Queryable,id:string,gender:Gender) {
  return !!(await db.query(`SELECT 1 FROM residence_records rr JOIN student_profiles s ON s.id=rr.student_id
    WHERE rr.room_id=$1 AND rr.status IN ('ALLOCATED','CHECKED_IN') AND s.gender<>$2 LIMIT 1`,[id,gender])).rowCount;
}
export async function hasOpenResidence(db:Queryable,id:string) {
  return !!(await db.query("SELECT 1 FROM residence_records WHERE student_id=$1 AND status IN ('ALLOCATED','CHECKED_IN') LIMIT 1",[id])).rowCount;
}
export async function hasReceipt(db:Queryable,id:string) {
  return !!(await db.query('SELECT 1 FROM room_fee_receipts WHERE residence_id=$1',[id])).rowCount;
}
