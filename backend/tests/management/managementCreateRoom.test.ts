import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import { parseRoomCreate } from '../../src/roles/management/validation.js';

test('managementCreateRoom normalizes code and requires numeric capacity and status', () => {
  assert.deepEqual(parseRoomCreate({
    buildingId: '00000000-0000-4000-8000-000000000001',
    code: ' a101 ',
    capacity: 6,
    gender: 'MALE',
    feeVnd: '0',
    status: 'ACTIVE',
  }), {
    buildingId: '00000000-0000-4000-8000-000000000001',
    code: 'A101',
    capacity: 6,
    gender: 'MALE',
    feeVnd: '0',
    status: 'ACTIVE',
  });
  assert.throws(
    () => parseRoomCreate({
      buildingId: '00000000-0000-4000-8000-000000000001',
      code: 'A102',
      capacity: '6',
      gender: 'MALE',
      feeVnd: '100',
      status: 'ACTIVE',
    }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});

test('managementCreateRoom rejects noncanonical or out-of-range BIGINT prices', () => {
  const valid = {
    buildingId: '00000000-0000-4000-8000-000000000001',
    code: 'A101',
    capacity: 6,
    gender: 'MALE',
    status: 'ACTIVE',
  };
  assert.throws(
    () => parseRoomCreate({ ...valid, feeVnd: '01' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parseRoomCreate({ ...valid, feeVnd: '9223372036854775808' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});
