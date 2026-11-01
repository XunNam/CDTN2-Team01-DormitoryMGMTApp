import type { Pool, PoolClient } from 'pg';
import type { Actor, SessionIdentity } from '../../shared/auth/types.js';
import { withBusinessTransaction } from '../../shared/db/transaction.js';
import { AppError } from '../../shared/http/errors.js';
import {
  managementApproveApplication as repoApproveApplication,
  managementCancelAllocation as repoCancelAllocation,
  managementCheckIn as repoCheckIn,
  managementCheckOut as repoCheckOut,
  managementCreateReceipt as repoCreateReceipt,
  managementCreateBuilding as repoCreateBuilding,
  managementCreateProfile as repoCreateProfile,
  managementCreateRoom as repoCreateRoom,
  managementGetApplication as repoGetApplication,
  managementGetBuilding as repoGetBuilding,
  managementGetPeriod as repoGetPeriod,
  managementGetProfile as repoGetProfile,
  managementGetReceipt as repoGetReceipt,
  managementGetResidence as repoGetResidence,
  managementGetRoom as repoGetRoom,
  managementGetStatistics as repoGetStatistics,
  managementListApplications as repoListApplications,
  managementListBuildings as repoListBuildings,
  managementListProfiles as repoListProfiles,
  managementListReceipts as repoListReceipts,
  managementListResidences as repoListResidences,
  managementListRooms as repoListRooms,
  managementPayReceipt as repoPayReceipt,
  managementRejectApplication as repoRejectApplication,
  managementUpdateBuilding as repoUpdateBuilding,
  managementUpdatePeriod as repoUpdatePeriod,
  managementUpdateProfile as repoUpdateProfile,
  managementUpdateRoom as repoUpdateRoom,
  type BuildingCreateInput,
  type BuildingPatchInput,
  type ApplicationApproveInput,
  type ApplicationQuery,
  type ApplicationRejectInput,
  type CancelAllocationInput,
  type CheckInInput,
  type CheckOutInput,
  type PageQuery,
  type ProfileCreateInput,
  type ProfilePatchInput,
  type ReceiptCreateInput,
  type ReceiptPayInput,
  type ReceiptQuery,
  type ResidenceQuery,
  type RoomCreateInput,
  type RoomPatchInput,
  type RoomQuery,
  type StudentProfileQuery,
} from './repository.js';

type DatabaseError = Error & { code?: string; constraint?: string };

function mapDatabaseError(error: unknown): never {
  if (error instanceof AppError) throw error;
  if (error && typeof error === 'object') {
    const databaseError = error as DatabaseError;
    if (databaseError.code === '23505') {
      switch (databaseError.constraint) {
        case 'student_profiles_student_code_key':
          throw new AppError(409, 'DUPLICATE_STUDENT_CODE', 'Mã sinh viên đã tồn tại.');
        case 'buildings_code_key':
          throw new AppError(409, 'DUPLICATE_BUILDING_CODE', 'Mã tòa nhà đã tồn tại.');
        case 'rooms_building_code_unique':
          throw new AppError(409, 'DUPLICATE_ROOM_CODE', 'Mã phòng đã tồn tại trong tòa nhà.');
        case 'residence_one_open_per_student':
          throw new AppError(409, 'ACTIVE_RESIDENCE_EXISTS', 'Sinh viên đã có hồ sơ lưu trú đang mở.');
        case 'room_fee_receipts_residence_id_key':
          throw new AppError(409, 'RECEIPT_ALREADY_EXISTS', 'Hồ sơ lưu trú đã có phiếu thu.');
      }
    }
    if (databaseError.code === '23514') {
      const message = databaseError.message;
      if (message.includes('INVALID_BIRTH_DATE')) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Ngày sinh không được ở tương lai.', [
          { field: 'dateOfBirth', message: 'Ngày sinh không được ở tương lai.' },
        ]);
      }
      if (message.includes('GENDER_CONFLICT')) {
        throw new AppError(409, 'GENDER_MISMATCH', 'Thay đổi không phù hợp với hồ sơ lưu trú đang mở.');
      }
      if (message.includes('CAPACITY_BELOW_ALLOCATION')) {
        throw new AppError(409, 'CAPACITY_BELOW_OCCUPANCY', 'Sức chứa không được thấp hơn số chỗ đã phân bổ.');
      }
      if (message.includes('ROOM_OCCUPIED')) {
        throw new AppError(409, 'ROOM_OCCUPIED', 'Không thể ngừng sử dụng phòng còn hồ sơ lưu trú đang mở.');
      }
      if (message.includes('PERIOD_STATE_UNCHANGED')) {
        throw new AppError(409, 'INVALID_STATE', 'Kỳ đăng ký đang ở trạng thái được yêu cầu.');
      }
      if (message.includes('INVALID_APPLICATION_STATE') || message.includes('INVALID_RESIDENCE_STATE')
          || message.includes('INVALID_RECEIPT_STATE')) {
        throw new AppError(409, 'INVALID_STATE', 'Trạng thái hiện tại không cho phép thao tác.');
      }
      if (message.includes('ACTIVE_RESIDENCE_EXISTS')) {
        throw new AppError(409, 'ACTIVE_RESIDENCE_EXISTS', 'Sinh viên đã có hồ sơ lưu trú đang mở.');
      }
      if (message.includes('ROOM_INACTIVE')) {
        throw new AppError(409, 'ROOM_INACTIVE', 'Phòng không hoạt động.');
      }
      if (message.includes('ROOM_FULL')) {
        throw new AppError(409, 'ROOM_FULL', 'Phòng đã hết chỗ.');
      }
      if (message.includes('PERIOD_CLOSED')) {
        throw new AppError(409, 'PERIOD_CLOSED', 'Kỳ đăng ký đã đóng.');
      }
      if (message.includes('RESIDENCE_NOT_BILLABLE')) {
        throw new AppError(409, 'INVALID_STATE', 'Hồ sơ lưu trú không thể lập phiếu thu.');
      }
      if (message.includes('FUTURE_BUSINESS_DATE')) {
        throw new AppError(422, 'VALIDATION_ERROR', 'Ngày nghiệp vụ không được ở tương lai.', [
          { field: 'date', message: 'Ngày nghiệp vụ không được ở tương lai.' },
        ]);
      }
      if (message.includes('APPLICATION_RESIDENCE_MISMATCH')) {
        throw new AppError(409, 'INVALID_STATE', 'Đơn đăng ký không thể tạo hồ sơ lưu trú tương ứng.');
      }
    }
  }
  throw error;
}

async function withReadSnapshot<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let begun = false;
  let destroyClient = false;
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    begun = true;
    const result = await work(client);
    await client.query('COMMIT');
    begun = false;
    return result;
  } catch (error) {
    if (begun) {
      try { await client.query('ROLLBACK'); }
      catch { destroyClient = true; }
    } else {
      destroyClient = true;
    }
    return mapDatabaseError(error);
  } finally {
    client.release(destroyClient);
  }
}

async function withManagementWrite<T>(
  pool: Pool,
  identity: SessionIdentity,
  work: (client: PoolClient, actor: Actor) => Promise<T>,
): Promise<T> {
  try {
    return await withBusinessTransaction(pool, identity, async (client, actor) => {
      if (actor.role !== 'BQL') {
        throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
      }
      return work(client, actor);
    });
  } catch (error) {
    return mapDatabaseError(error);
  }
}

export async function managementListProfiles(pool: Pool, query: StudentProfileQuery) {
  return withReadSnapshot(pool, (client) => repoListProfiles(client, query));
}

export async function managementCreateProfile(
  pool: Pool,
  identity: SessionIdentity,
  input: ProfileCreateInput,
) {
  return withManagementWrite(pool, identity, (client) => repoCreateProfile(client, input));
}

export async function managementGetProfile(pool: Pool, studentId: string) {
  return repoGetProfile(pool, studentId);
}

export async function managementUpdateProfile(
  pool: Pool,
  identity: SessionIdentity,
  studentId: string,
  patch: ProfilePatchInput,
) {
  return withManagementWrite(pool, identity, (client) => repoUpdateProfile(client, studentId, patch));
}

export async function managementListBuildings(pool: Pool, query: PageQuery) {
  return withReadSnapshot(pool, (client) => repoListBuildings(client, query));
}

export async function managementCreateBuilding(
  pool: Pool,
  identity: SessionIdentity,
  input: BuildingCreateInput,
) {
  return withManagementWrite(pool, identity, (client) => repoCreateBuilding(client, input));
}

export async function managementGetBuilding(pool: Pool, buildingId: string) {
  return repoGetBuilding(pool, buildingId);
}

export async function managementUpdateBuilding(
  pool: Pool,
  identity: SessionIdentity,
  buildingId: string,
  patch: BuildingPatchInput,
) {
  return withManagementWrite(pool, identity, (client) => repoUpdateBuilding(client, buildingId, patch));
}

export async function managementListRooms(pool: Pool, query: RoomQuery) {
  return withReadSnapshot(pool, (client) => repoListRooms(client, query));
}

export async function managementCreateRoom(
  pool: Pool,
  identity: SessionIdentity,
  input: RoomCreateInput,
) {
  return withManagementWrite(pool, identity, (client) => repoCreateRoom(client, input));
}

export async function managementGetRoom(pool: Pool, roomId: string) {
  return repoGetRoom(pool, roomId);
}

export async function managementUpdateRoom(
  pool: Pool,
  identity: SessionIdentity,
  roomId: string,
  patch: RoomPatchInput,
) {
  return withManagementWrite(pool, identity, (client) => repoUpdateRoom(client, roomId, patch));
}

export async function managementGetPeriod(pool: Pool) {
  return repoGetPeriod(pool);
}

export async function managementUpdatePeriod(
  pool: Pool,
  identity: SessionIdentity,
  status: 'OPEN' | 'CLOSED',
) {
  return withManagementWrite(pool, identity, (client, actor) => repoUpdatePeriod(client, status, actor.accountId));
}

export async function managementListApplications(pool: Pool, query: ApplicationQuery) {
  return withReadSnapshot(pool, (client) => repoListApplications(client, query));
}

export async function managementGetApplication(pool: Pool, applicationId: string) {
  return repoGetApplication(pool, applicationId);
}

export async function managementApproveApplication(
  pool: Pool,
  identity: SessionIdentity,
  applicationId: string,
  input: ApplicationApproveInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoApproveApplication(client, applicationId, input.roomId, actor.accountId));
}

export async function managementRejectApplication(
  pool: Pool,
  identity: SessionIdentity,
  applicationId: string,
  input: ApplicationRejectInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoRejectApplication(client, applicationId, input.reason, actor.accountId));
}

export async function managementListResidences(pool: Pool, query: ResidenceQuery) {
  return withReadSnapshot(pool, (client) => repoListResidences(client, query));
}

export async function managementGetResidence(pool: Pool, residenceId: string) {
  return repoGetResidence(pool, residenceId);
}

export async function managementCheckIn(
  pool: Pool,
  identity: SessionIdentity,
  residenceId: string,
  input: CheckInInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoCheckIn(client, residenceId, input.checkInDate, actor.accountId));
}

export async function managementCancelAllocation(
  pool: Pool,
  identity: SessionIdentity,
  residenceId: string,
  input: CancelAllocationInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoCancelAllocation(client, residenceId, input.reason, actor.accountId));
}

export async function managementCheckOut(
  pool: Pool,
  identity: SessionIdentity,
  residenceId: string,
  input: CheckOutInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoCheckOut(client, residenceId, input.checkOutDate, actor.accountId));
}

export async function managementListReceipts(pool: Pool, query: ReceiptQuery) {
  return withReadSnapshot(pool, (client) => repoListReceipts(client, query));
}

export async function managementCreateReceipt(
  pool: Pool,
  identity: SessionIdentity,
  input: ReceiptCreateInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoCreateReceipt(client, input.residenceId, actor.accountId));
}

export async function managementGetReceipt(pool: Pool, receiptId: string) {
  return repoGetReceipt(pool, receiptId);
}

export async function managementPayReceipt(
  pool: Pool,
  identity: SessionIdentity,
  receiptId: string,
  input: ReceiptPayInput,
) {
  return withManagementWrite(pool, identity, (client, actor) =>
    repoPayReceipt(client, receiptId, input.paymentDate, actor.accountId));
}

export async function managementGetStatistics(pool: Pool) {
  return withReadSnapshot(pool, (client) => repoGetStatistics(client));
}
