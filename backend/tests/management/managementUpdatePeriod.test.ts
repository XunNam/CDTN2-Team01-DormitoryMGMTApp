import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import { parsePeriodPatch } from '../../src/roles/management/validation.js';

test('managementUpdatePeriod accepts only OPEN or CLOSED status', () => {
  assert.deepEqual(parsePeriodPatch({ status: 'OPEN' }), { status: 'OPEN' });
  assert.throws(
    () => parsePeriodPatch({ status: 'open' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parsePeriodPatch({ status: 'OPEN', updatedBy: 'client-controlled' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});
