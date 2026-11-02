import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import { parseRoomQuery, parseStudentProfileQuery } from '../../src/roles/management/validation.js';

test('managementListRooms parses defaults and only accepts scalar URL booleans', () => {
  assert.deepEqual(parseRoomQuery({}), { page: 1, pageSize: 20 });
  assert.deepEqual(parseRoomQuery({ hasAvailability: 'false' }), {
    page: 1,
    pageSize: 20,
    hasAvailability: false,
  });
  assert.throws(
    () => parseRoomQuery({ hasAvailability: ['true', 'false'] }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});

test('managementListRooms rejects unknown and invalid filters', () => {
  assert.throws(
    () => parseRoomQuery({ sort: 'code' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parseRoomQuery({ buildingId: 'bad-id' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});

test('managementListProfiles rejects repeated query keys instead of coercing arrays', () => {
  assert.throws(
    () => parseStudentProfileQuery({ page: ['1', '2'] }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});
