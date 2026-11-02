// Business flow and transactions for the Student role. No Request/Response objects here.
// Reads run in one READ ONLY REPEATABLE READ snapshot and take no business lock.
// Contact updates and application submission use the shared withBusinessTransaction.
import type { Pool } from 'pg';
import type { Actor, SessionIdentity } from '../../shared/auth/types.js';
import { AppError } from '../../shared/http/errors.js';
import type { PageMeta } from '../../shared/http/response.js';
import { withBusinessTransaction } from '../../shared/db/transaction.js';
import { withReadSnapshot } from '../../shared/db/read-snapshot.js';
import * as repo from './repository.js';
import type { PageInput, RoomQueryInput, ContactPatchInput, StatusQueryInput } from './validation.js';

export interface ListResult<T> { data: T[]; meta: PageMeta }

const forbidden = (): AppError => new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
const notFound = (): AppError => new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên.');

/** Role is re-checked from the freshly resolved actor; the owner is always the session's student. */
function studentIdOf(actor: Actor): string {
  if (actor.role !== 'SV') throw forbidden();
  if (!actor.studentId) throw notFound();
  return actor.studentId;
}

function pageMeta(p: PageInput, totalItems: number): PageMeta {
  return { page: p.page, pageSize: p.pageSize, totalItems, totalPages: Math.ceil(totalItems / p.pageSize) };
}

export async function studentGetProfile(pool: Pool, actor: Actor): Promise<repo.StudentProfileDto> {
  const studentId = studentIdOf(actor);
  const profile = await withReadSnapshot(pool, client => repo.studentGetProfile(client, studentId));
  if (!profile) throw notFound();
  return profile;
}

const CONTACT_CONSTRAINTS: Record<string, 'phone' | 'email'> = {
  student_profiles_phone_check: 'phone',
  student_profiles_email_check: 'email',
};

export async function studentUpdateContact(
  pool: Pool, identity: SessionIdentity, input: ContactPatchInput,
): Promise<repo.StudentProfileDto> {
  return withBusinessTransaction(pool, identity, async (client, actor) => {
    const studentId = studentIdOf(actor); // role + owner re-checked after the global lock
    const current = await repo.studentGetProfile(client, studentId);
    if (!current) throw notFound();
    const changes: ContactPatchInput = {};
    if (input.phone !== undefined && input.phone !== current.phone) changes.phone = input.phone;
    if (input.email !== undefined && input.email !== current.email) changes.email = input.email;
    // Same values: 200 with no write, so updatedAt (set by trigger on any UPDATE) does not move.
    if (changes.phone === undefined && changes.email === undefined) return current;
    try {
      const updated = await repo.studentUpdateContact(client, studentId, changes);
      if (!updated) throw notFound();
      return updated;
    } catch (error) {
      const constraint = (error as { code?: string; constraint?: string } | null)?.constraint;
      if ((error as { code?: string } | null)?.code === '23514' && constraint && CONTACT_CONSTRAINTS[constraint]) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu không hợp lệ.',
          [{ field: CONTACT_CONSTRAINTS[constraint], message: 'Giá trị không hợp lệ.' }]);
      }
      throw error;
    }
  });
}

export async function studentListBuildings(pool: Pool, actor: Actor, p: PageInput): Promise<ListResult<repo.BuildingDto>> {
  studentIdOf(actor);
  const { items, total } = await withReadSnapshot(pool, client => repo.studentListBuildings(client, p));
  return { data: items, meta: pageMeta(p, total) };
}

export async function studentListRooms(pool: Pool, actor: Actor, q: RoomQueryInput): Promise<ListResult<repo.RoomDto>> {
  studentIdOf(actor);
  const { items, total } = await withReadSnapshot(pool, client => repo.studentListRooms(client, q));
  return { data: items, meta: pageMeta(q, total) };
}

export async function studentGetRoom(pool: Pool, actor: Actor, roomId: string): Promise<repo.RoomDto> {
  studentIdOf(actor);
  const room = await withReadSnapshot(pool, client => repo.studentGetRoom(client, roomId));
  if (!room) throw notFound(); // missing or INACTIVE
  return room;
}

export async function studentGetPeriod(pool: Pool, actor: Actor): Promise<repo.RegistrationPeriodDto> {
  studentIdOf(actor);
  const period = await withReadSnapshot(pool, client => repo.studentGetPeriod(client));
  // The singleton row is created by schema.sql; its absence is a data-integrity fault, not a client error.
  if (!period) throw new Error('registration_period singleton row is missing');
  return period;
}

const conflict = (code: string) => new AppError(409, code, 'Điều kiện xử lý không còn phù hợp. Vui lòng tải lại dữ liệu.');
export async function studentCreateApplication(pool: Pool, identity: SessionIdentity, input: { preferredRoomId: string }) {
  try {
    return await withBusinessTransaction(pool, identity, async (client, actor) => {
      const id = studentIdOf(actor);
      const period = await repo.studentGetPeriod(client);
      if (!period) throw new Error('registration_period singleton missing');
      if (period.status !== 'OPEN') throw conflict('PERIOD_CLOSED');
      if (await repo.studentHasPendingApplication(client,id)) throw conflict('PENDING_APPLICATION_EXISTS');
      if (await repo.studentHasOpenResidence(client,id)) throw conflict('ACTIVE_RESIDENCE_EXISTS');
      const room = await repo.studentFindPreferredRoom(client,input.preferredRoomId);
      if (!room) throw notFound();
      if (room.status !== 'ACTIVE') throw conflict('ROOM_INACTIVE');
      const profile = await repo.studentGetProfile(client,id);
      if (!profile) throw notFound();
      if (profile.gender !== room.gender) throw conflict('GENDER_MISMATCH');
      if (room.availablePlaces <= 0) throw conflict('ROOM_FULL');
      // Submission never reserves a place; only BQL approval inserts a residence.
      return repo.studentCreateApplication(client,id,room.id);
    });
  } catch(error) {
    const e = error as { code?:string; constraint?:string; message?:string };
    if (e.code==='23505' && e.constraint==='applications_one_pending_per_student') throw conflict('PENDING_APPLICATION_EXISTS');
    if (e.code==='23514' && ['PERIOD_CLOSED','PENDING_APPLICATION_EXISTS','ACTIVE_RESIDENCE_EXISTS','ROOM_INACTIVE','GENDER_MISMATCH','ROOM_FULL'].includes(e.message??'')) throw conflict(e.message!);
    throw error;
  }
}
export async function studentListApplications(pool: Pool, actor: Actor, q: StatusQueryInput) {
  const id=studentIdOf(actor);
  const result=await withReadSnapshot(pool,c=>repo.studentListApplications(c,id,q));
  return {data:result.items,meta:pageMeta(q,result.total)};
}
export async function studentGetApplication(pool: Pool, actor: Actor, applicationId: string) {
  const id=studentIdOf(actor);
  const value=await withReadSnapshot(pool,c=>repo.studentGetApplication(c,id,applicationId));
  if(!value) throw notFound(); return value;
}
export async function studentListResidences(pool: Pool, actor: Actor, q: StatusQueryInput) {
  const id=studentIdOf(actor);
  const result=await withReadSnapshot(pool,c=>repo.studentListResidences(c,id,q));
  return {data:result.items,meta:pageMeta(q,result.total)};
}
export async function studentGetResidence(pool: Pool, actor: Actor, residenceId: string) {
  const id=studentIdOf(actor);
  const value=await withReadSnapshot(pool,c=>repo.studentGetResidence(c,id,residenceId));
  if(!value) throw notFound(); return value;
}
export async function studentListReceipts(pool: Pool, actor: Actor, q: StatusQueryInput) {
  const id=studentIdOf(actor);
  const result=await withReadSnapshot(pool,c=>repo.studentListReceipts(c,id,q));
  return {data:result.items,meta:pageMeta(q,result.total)};
}
export async function studentGetReceipt(pool: Pool, actor: Actor, receiptId: string) {
  const id=studentIdOf(actor);
  const value=await withReadSnapshot(pool,c=>repo.studentGetReceipt(c,id,receiptId));
  if(!value) throw notFound(); return value;
}
