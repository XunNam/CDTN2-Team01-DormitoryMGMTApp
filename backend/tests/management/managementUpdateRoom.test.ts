import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import { parseRoomPatch } from '../../src/roles/management/validation.js';

test('managementUpdateRoom rejects empty patches and immutable room fields', () => {
  assert.throws(
    () => parseRoomPatch({}),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parseRoomPatch({ code: 'A102' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});

test('managementUpdateRoom accepts only contract fields and exact JSON types', () => {
  assert.deepEqual(parseRoomPatch({ capacity: 8, feeVnd: '2500000' }), {
    capacity: 8,
    feeVnd: '2500000',
  });
  assert.throws(
    () => parseRoomPatch({ capacity: '8' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});
