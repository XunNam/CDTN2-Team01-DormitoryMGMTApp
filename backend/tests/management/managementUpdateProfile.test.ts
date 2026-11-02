import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import { parseProfilePatch, requireUuidParam } from '../../src/roles/management/validation.js';

test('managementUpdateProfile rejects empty patches and immutable fields', () => {
  assert.throws(
    () => parseProfilePatch({}),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parseProfilePatch({ studentCode: 'SV002' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});

test('managementUpdateProfile accepts nullable fields but rejects impossible and future dates', () => {
  assert.deepEqual(parseProfilePatch({ phone: null, email: null, dateOfBirth: null }), {
    phone: null,
    email: null,
    dateOfBirth: null,
  });
  assert.throws(
    () => parseProfilePatch({ dateOfBirth: '2025-02-29' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parseProfilePatch({ dateOfBirth: '2999-01-01' }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});

test('managementUpdateProfile validates UUID path values', () => {
  assert.throws(
    () => requireUuidParam('not-a-uuid', 'studentId'),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});
