import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../../src/shared/db/pool.js';
import { withBusinessTransaction } from '../../../src/shared/db/transaction.js';
import { AppError } from '../../../src/shared/http/errors.js';
import type { SessionIdentity } from '../../../src/shared/auth/types.js';
import {
  managementApproveApplication,
  managementCancelAllocation,
  managementCheckIn,
  managementCheckOut,
  managementCreateReceipt,
  managementCreateBuilding,
  managementCreateProfile,
  managementCreateRoom,
  managementGetApplication,
  managementGetBuilding,
  managementGetPeriod,
  managementGetProfile,
  managementGetReceipt,
  managementGetResidence,
  managementGetRoom,
  managementGetStatistics,
  managementListApplications,
  managementListBuildings,
  managementListProfiles,
  managementListReceipts,
  managementListResidences,
  managementListRooms,
  managementPayReceipt,
  managementRejectApplication,
  managementUpdateBuilding,
  managementUpdatePeriod,
  managementUpdateProfile,
  managementUpdateRoom,
} from '../../../src/roles/management/service.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const accountId = process.env.MANAGEMENT_TEST_ACCOUNT_ID;

if (!databaseUrl) throw new Error('TEST_DATABASE_URL is required for Management DB integration tests.');
if (!accountId) throw new Error('MANAGEMENT_TEST_ACCOUNT_ID must identify an unlocked BQL test account.');

const pool = createPool(databaseUrl);

function businessToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

test('Management foundation operations preserve PostgreSQL contract invariants', async (t) => {
  const createdProfileIds: string[] = [];
  const createdBuildingIds: string[] = [];
  const createdRoomIds: string[] = [];
  const retainedProfileIds = new Set<string>();
  const retainedBuildingIds = new Set<string>();
  const retainedRoomIds = new Set<string>();
  let identity: SessionIdentity | undefined;
  let bqlAccountId: string | undefined;
  let originalPeriodStatus: 'OPEN' | 'CLOSED' | undefined;

  t.after(async () => {
    try {
      if (identity && bqlAccountId) {
        await withBusinessTransaction(pool, identity, async (client) => {
          const period = await client.query<{ status: 'OPEN' | 'CLOSED' }>(
            `SELECT status FROM registration_period WHERE id = 1 FOR UPDATE`,
          );
          if (originalPeriodStatus && period.rows[0]?.status !== originalPeriodStatus) {
            await client.query(`UPDATE registration_period SET status = $1, updated_by = $2 WHERE id = 1`, [
              originalPeriodStatus,
              bqlAccountId,
            ]);
          }
          for (const id of createdRoomIds) {
            if (!retainedRoomIds.has(id)) await client.query(`DELETE FROM rooms WHERE id = $1`, [id]);
          }
          for (const id of createdProfileIds) {
            if (!retainedProfileIds.has(id)) await client.query(`DELETE FROM student_profiles WHERE id = $1`, [id]);
          }
          for (const id of createdBuildingIds) {
            if (!retainedBuildingIds.has(id)) await client.query(`DELETE FROM buildings WHERE id = $1`, [id]);
          }
        });
      }
    } finally {
      await pool.end();
    }
  });

  const { rows } = await pool.query<{ id: string; role: string; is_locked: boolean; session_version: number }>(
    `SELECT id, role, is_locked, session_version FROM staff_accounts WHERE id = $1`,
    [accountId],
  );
  const account = rows[0];
  assert.ok(account, 'Configured Management test account must exist.');
  assert.equal(account.role, 'BQL');
  assert.equal(account.is_locked, false);
  bqlAccountId = account.id;

  identity = {
    actorKind: 'STAFF',
    accountId: account.id,
    sessionVersion: account.session_version,
    lastSeenAt: Date.now(),
  };
  const suffix = randomUUID().replaceAll('-', '').slice(0, 24).toUpperCase();
  const studentCode = `T${suffix}`;
  const buildingCode = `B${suffix}`;
  const roomCode = `R${suffix}`;
  const profile = await managementCreateProfile(pool, identity, {
    studentCode,
    fullName: 'Hồ sơ kiểm thử BQL',
    gender: 'FEMALE',
    className: 'TEST',
    faculty: 'TEST',
  });
  createdProfileIds.push(profile.id);
  assert.equal(profile.studentCode, studentCode);
  assert.equal(profile.phone, null);
  assert.equal((await managementGetProfile(pool, profile.id))?.id, profile.id);
  assert.equal((await managementListProfiles(pool, {
    page: 1,
    pageSize: 10,
    q: studentCode,
    gender: 'FEMALE',
  })).meta.totalItems, 1);
  await assert.rejects(
    managementCreateProfile(pool, identity, {
      studentCode: studentCode,
      fullName: 'Duplicate test profile',
      gender: 'FEMALE',
      className: 'TEST',
      faculty: 'TEST',
    }),
    (error: unknown) => error instanceof AppError && error.code === 'DUPLICATE_STUDENT_CODE',
  );
  const updatedProfile = await managementUpdateProfile(pool, identity, profile.id, {
    gender: 'MALE',
    phone: '+84900123456',
  });
  assert.equal(updatedProfile?.gender, 'MALE');
  assert.equal(updatedProfile?.phone, '+84900123456');

  const building = await managementCreateBuilding(pool, identity, { code: buildingCode, name: 'Tòa kiểm thử' });
  createdBuildingIds.push(building.id);
  assert.equal((await managementGetBuilding(pool, building.id))?.id, building.id);
  assert.equal((await managementListBuildings(pool, {
    page: 1,
    pageSize: 10,
    q: buildingCode,
  })).meta.totalItems, 1);
  assert.equal((await managementUpdateBuilding(pool, identity, building.id, { name: 'Tòa kiểm thử đã sửa' }))?.name, 'Tòa kiểm thử đã sửa');
  await assert.rejects(
    managementCreateBuilding(pool, identity, { code: buildingCode, name: 'Tòa trùng' }),
    (error: unknown) => error instanceof AppError && error.code === 'DUPLICATE_BUILDING_CODE',
  );

  const room = await managementCreateRoom(pool, identity, {
    buildingId: building.id,
    code: roomCode,
    capacity: 6,
    gender: 'MALE',
    feeVnd: '2500000',
    status: 'ACTIVE',
  });
  createdRoomIds.push(room.id);
  assert.equal(room.allocatedPlaces, 0);
  assert.equal(room.availablePlaces, 6);
  assert.equal((await managementGetRoom(pool, room.id))?.feeVnd, '2500000');
  assert.equal((await managementListRooms(pool, {
    page: 1,
    pageSize: 10,
    q: roomCode,
    buildingId: building.id,
    hasAvailability: true,
    status: 'ACTIVE',
  })).meta.totalItems, 1);
  const updatedRoom = await managementUpdateRoom(pool, identity, room.id, { capacity: 8, feeVnd: '0' });
  assert.equal(updatedRoom?.availablePlaces, 8);
  assert.equal(updatedRoom?.feeVnd, '0');
  assert.equal((await managementUpdateRoom(pool, identity, room.id, { status: 'INACTIVE' }))?.status, 'INACTIVE');
  await assert.rejects(
    managementCreateRoom(pool, identity, {
      buildingId: building.id,
      code: roomCode,
      capacity: 2,
      gender: 'MALE',
      feeVnd: '0',
      status: 'ACTIVE',
    }),
    (error: unknown) => error instanceof AppError && error.code === 'DUPLICATE_ROOM_CODE',
  );

  const initialPeriod = await managementGetPeriod(pool);
  originalPeriodStatus = initialPeriod.status;
  if (initialPeriod.status !== 'OPEN') {
    await managementUpdatePeriod(pool, identity, 'OPEN');
  }

  const lifecycleRoom = await managementUpdateRoom(pool, identity, room.id, {
    capacity: 2,
    feeVnd: '2500000',
    status: 'ACTIVE',
  });
  assert.equal(lifecycleRoom?.availablePlaces, 2);
  const statisticsBeforeLifecycle = await managementGetStatistics(pool);
  const testIdentity = identity;
  assert.ok(testIdentity);
  const applicationId = await withBusinessTransaction(pool, testIdentity, async (client) => {
    const application = await client.query<{ id: string }>(
      `INSERT INTO applications (student_id, preferred_room_id, period_id)
       VALUES ($1, $2, 1) RETURNING id`,
      [profile.id, room.id],
    );
    return application.rows[0]!.id;
  });
  retainedProfileIds.add(profile.id);
  retainedRoomIds.add(room.id);
  retainedBuildingIds.add(building.id);

  assert.equal((await managementGetApplication(pool, applicationId))?.status, 'PENDING');
  assert.equal((await managementListApplications(pool, {
    page: 1,
    pageSize: 10,
    status: 'PENDING',
    studentId: profile.id,
    preferredRoomId: room.id,
  })).meta.totalItems, 1);
  const approval = await managementApproveApplication(pool, identity, applicationId, { roomId: room.id });
  assert.equal(approval.application.status, 'APPROVED');
  assert.equal(approval.residence.status, 'ALLOCATED');
  assert.equal(approval.residence.studentId, profile.id);
  assert.equal((await managementGetStatistics(pool)).availablePlaces, statisticsBeforeLifecycle.availablePlaces - 1);
  assert.equal((await managementListResidences(pool, {
    page: 1,
    pageSize: 10,
    status: 'ALLOCATED',
    studentId: profile.id,
    roomId: room.id,
  })).meta.totalItems, 1);

  const receipt = await managementCreateReceipt(pool, identity, { residenceId: approval.residence.id });
  assert.equal(receipt.status, 'UNPAID');
  assert.equal(receipt.amountVnd, '2500000');
  assert.equal((await managementUpdateRoom(pool, identity, room.id, { feeVnd: '3500000' }))?.feeVnd, '3500000');
  assert.equal((await managementGetReceipt(pool, receipt.id))?.amountVnd, '2500000');
  assert.equal((await managementListReceipts(pool, {
    page: 1,
    pageSize: 10,
    status: 'UNPAID',
    studentId: profile.id,
    residenceId: approval.residence.id,
  })).meta.totalItems, 1);
  await assert.rejects(
    managementCreateReceipt(pool, identity, { residenceId: approval.residence.id }),
    (error: unknown) => error instanceof AppError && error.code === 'RECEIPT_ALREADY_EXISTS',
  );

  const today = businessToday();
  const checkedIn = await managementCheckIn(pool, identity, approval.residence.id, { checkInDate: today });
  assert.equal(checkedIn.status, 'CHECKED_IN');
  assert.equal(checkedIn.checkInDate, today);
  assert.equal((await managementGetStatistics(pool)).currentResidents, statisticsBeforeLifecycle.currentResidents + 1);
  const checkedOut = await managementCheckOut(pool, identity, approval.residence.id, { checkOutDate: today });
  assert.equal(checkedOut.status, 'ENDED');
  assert.equal((await managementGetResidence(pool, approval.residence.id))?.status, 'ENDED');
  assert.equal((await managementGetReceipt(pool, receipt.id))?.status, 'UNPAID');
  assert.equal((await managementGetStatistics(pool)).unpaidReceipts, statisticsBeforeLifecycle.unpaidReceipts + 1);

  const paidReceipt = await managementPayReceipt(pool, identity, receipt.id, { paymentDate: today });
  assert.equal(paidReceipt.status, 'PAID');
  assert.equal(paidReceipt.amountVnd, '2500000');
  await assert.rejects(
    managementPayReceipt(pool, identity, receipt.id, { paymentDate: today }),
    (error: unknown) => error instanceof AppError && error.code === 'INVALID_STATE',
  );
  assert.equal((await managementGetStatistics(pool)).unpaidReceipts, statisticsBeforeLifecycle.unpaidReceipts);

  const cancellationApplicationId = await withBusinessTransaction(pool, testIdentity, async (client) => {
    const application = await client.query<{ id: string }>(
      `INSERT INTO applications (student_id, preferred_room_id, period_id)
       VALUES ($1, $2, 1) RETURNING id`,
      [profile.id, room.id],
    );
    return application.rows[0]!.id;
  });
  const cancellationApproval = await managementApproveApplication(
    pool,
    identity,
    cancellationApplicationId,
    { roomId: room.id },
  );
  const cancelled = await managementCancelAllocation(
    pool,
    identity,
    cancellationApproval.residence.id,
    { reason: 'Sinh viên không đến nhận phòng.' },
  );
  assert.equal(cancelled.status, 'CANCELLED');
  await assert.rejects(
    managementCancelAllocation(pool, identity, cancellationApproval.residence.id, { reason: 'Lặp lại' }),
    (error: unknown) => error instanceof AppError && error.code === 'INVALID_STATE',
  );

  const rejectionApplicationId = await withBusinessTransaction(pool, testIdentity, async (client) => {
    const application = await client.query<{ id: string }>(
      `INSERT INTO applications (student_id, preferred_room_id, period_id)
       VALUES ($1, $2, 1) RETURNING id`,
      [profile.id, room.id],
    );
    return application.rows[0]!.id;
  });
  const rejectedApplication = await managementRejectApplication(
    pool,
    identity,
    rejectionApplicationId,
    { reason: 'Thiếu giấy tờ cần thiết.' },
  );
  assert.equal(rejectedApplication.status, 'REJECTED');
  assert.equal(rejectedApplication.rejectionReason, 'Thiếu giấy tờ cần thiết.');
  assert.equal(rejectedApplication.reviewedBy, account.id);

  const reviewRaceRoom = await managementCreateRoom(pool, identity, {
    buildingId: building.id,
    code: `${roomCode}X`,
    capacity: 2,
    gender: 'MALE',
    feeVnd: '0',
    status: 'ACTIVE',
  });
  createdRoomIds.push(reviewRaceRoom.id);
  const reviewRaceApplicationId = await withBusinessTransaction(pool, testIdentity, async (client) => {
    const application = await client.query<{ id: string }>(
      `INSERT INTO applications (student_id, preferred_room_id, period_id)
       VALUES ($1, $2, 1) RETURNING id`,
      [profile.id, reviewRaceRoom.id],
    );
    return application.rows[0]!.id;
  });
  retainedRoomIds.add(reviewRaceRoom.id);
  const competingReviews = await Promise.allSettled([
    managementApproveApplication(pool, identity, reviewRaceApplicationId, { roomId: reviewRaceRoom.id }),
    managementRejectApplication(pool, identity, reviewRaceApplicationId, { reason: 'Yêu cầu chưa hợp lệ.' }),
  ]);
  assert.equal(competingReviews.filter((result) => result.status === 'fulfilled').length, 1);
  const losingReview = competingReviews.find((result) => result.status === 'rejected');
  assert.ok(losingReview && losingReview.status === 'rejected');
  assert.ok(losingReview.reason instanceof AppError);
  assert.equal(losingReview.reason.code, 'INVALID_STATE');

  await managementUpdateRoom(pool, identity, room.id, { capacity: 1 });
  const raceProfiles = await Promise.all(['A', 'B'].map((suffix) => managementCreateProfile(pool, identity, {
    studentCode: `${studentCode}${suffix}`,
    fullName: `Sinh viên tranh chỗ ${suffix}`,
    gender: 'MALE',
    className: 'TEST',
    faculty: 'TEST',
  })));
  const raceApplicationIds: string[] = [];
  for (const raceProfile of raceProfiles) {
    createdProfileIds.push(raceProfile.id);
    const raceApplicationId = await withBusinessTransaction(pool, testIdentity, async (client) => {
      const application = await client.query<{ id: string }>(
        `INSERT INTO applications (student_id, preferred_room_id, period_id)
         VALUES ($1, $2, 1) RETURNING id`,
        [raceProfile.id, room.id],
      );
      return application.rows[0]!.id;
    });
    retainedProfileIds.add(raceProfile.id);
    raceApplicationIds.push(raceApplicationId);
  }
  const competingApprovals = await Promise.allSettled(raceApplicationIds.map((id) =>
    managementApproveApplication(pool, identity, id, { roomId: room.id })));
  assert.equal(competingApprovals.filter((result) => result.status === 'fulfilled').length, 1);
  const losingApproval = competingApprovals.find((result) => result.status === 'rejected');
  assert.ok(losingApproval && losingApproval.status === 'rejected');
  assert.ok(losingApproval.reason instanceof AppError);
  assert.equal(losingApproval.reason.code, 'ROOM_FULL');

  const changedPeriod = await managementUpdatePeriod(pool, identity, 'CLOSED');
  assert.equal(changedPeriod.status, 'CLOSED');
  const reopenedPeriod = await managementUpdatePeriod(pool, identity, 'OPEN');
  assert.equal(reopenedPeriod.status, 'OPEN');
  await assert.rejects(
    managementUpdatePeriod(pool, identity, reopenedPeriod.status),
    (error: unknown) => error instanceof AppError && error.code === 'INVALID_STATE',
  );
  assert.equal(changedPeriod.updatedBy, account.id);
});
