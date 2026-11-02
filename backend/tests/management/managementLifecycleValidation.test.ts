import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import {
  parseApplicationApprove,
  parseApplicationQuery,
  parseApplicationReject,
  parseCancelAllocation,
  parseCheckIn,
  parseCheckOut,
  parseEmptyQuery,
  parseReceiptCreate,
  parseReceiptPay,
  parseReceiptQuery,
  parseResidenceQuery,
  parseStudentProfileQuery,
} from '../../src/roles/management/validation.js';

const uuid = '11111111-1111-4111-8111-111111111111';

test('management application, residence, and receipt filters use strict contract allowlists', () => {
  assert.deepEqual(parseApplicationQuery({ status: 'PENDING', studentId: uuid }), {
    page: 1,
    pageSize: 20,
    status: 'PENDING',
    studentId: uuid,
  });
  assert.deepEqual(parseResidenceQuery({ status: 'ENDED', roomId: uuid }), {
    page: 1,
    pageSize: 20,
    status: 'ENDED',
    roomId: uuid,
  });
  assert.deepEqual(parseReceiptQuery({ status: 'UNPAID', residenceId: uuid }), {
    page: 1,
    pageSize: 20,
    status: 'UNPAID',
    residenceId: uuid,
  });
  assert.throws(() => parseApplicationQuery({ status: 'UNKNOWN' }), AppError);
  assert.throws(() => parseResidenceQuery({ accountId: uuid }), AppError);
  assert.throws(() => parseReceiptQuery({ studentId: 'not-a-uuid' }), AppError);
  assert.throws(() => parseApplicationQuery({ status: ['PENDING'] }), AppError);
  assert.throws(() => parseEmptyQuery({ extra: 'not-allowed' }), AppError);
});

test('management lifecycle bodies validate identifiers, trimmed reasons, and nonfuture dates', () => {
  assert.deepEqual(parseApplicationApprove({ roomId: uuid }), { roomId: uuid });
  assert.deepEqual(parseApplicationReject({ reason: '  Thiếu giấy tờ  ' }), { reason: 'Thiếu giấy tờ' });
  assert.deepEqual(parseCancelAllocation({ reason: 'Không đến nhận phòng' }), {
    reason: 'Không đến nhận phòng',
  });
  assert.deepEqual(parseReceiptCreate({ residenceId: uuid }), { residenceId: uuid });
  assert.throws(() => parseApplicationApprove({ roomId: uuid, status: 'APPROVED' }), AppError);
  assert.throws(() => parseApplicationReject({ reason: '   ' }), AppError);
  assert.throws(() => parseCancelAllocation({ reason: 'x'.repeat(501) }), AppError);

  const pastDate = '2000-01-01';
  assert.deepEqual(parseCheckIn({ checkInDate: pastDate }), { checkInDate: pastDate });
  assert.deepEqual(parseCheckOut({ checkOutDate: pastDate }), { checkOutDate: pastDate });
  assert.deepEqual(parseReceiptPay({ paymentDate: pastDate }), { paymentDate: pastDate });
  assert.throws(() => parseCheckIn({ checkInDate: '2999-01-01' }), AppError);
  assert.throws(() => parseCheckOut({ checkOutDate: '2025-02-30' }), AppError);
  assert.throws(() => parseCheckOut({ checkOutDate: '0000-01-01' }), AppError);
  assert.throws(() => parseReceiptPay({ paymentDate: '2999-01-01' }), AppError);
});

test('management profile/building/room search length counts Unicode code points', () => {
  assert.equal(parseStudentProfileQuery({ q: '😀'.repeat(100) }).q, '😀'.repeat(100));
  assert.throws(() => parseStudentProfileQuery({ q: '😀'.repeat(101) }), AppError);
});
