import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../../src/shared/http/errors.js';
import { parseProfileCreate } from '../../src/roles/management/validation.js';

test('managementCreateProfile normalizes business code and preserves absent nullable fields', () => {
  const result = parseProfileCreate({
    studentCode: ' sv_001 ',
    fullName: '  Sinh viên mẫu  ',
    gender: 'FEMALE',
    className: ' K29 ',
    faculty: ' CNTT ',
  });

  assert.deepEqual(result, {
    studentCode: 'SV_001',
    fullName: 'Sinh viên mẫu',
    gender: 'FEMALE',
    className: 'K29',
    faculty: 'CNTT',
  });
});

test('managementCreateProfile rejects unsupported fields and invalid contact values', () => {
  assert.throws(
    () => parseProfileCreate({
      studentCode: 'SV001',
      fullName: 'Sinh viên mẫu',
      gender: 'MALE',
      className: 'K29',
      faculty: 'CNTT',
      accountId: '00000000-0000-4000-8000-000000000001',
    }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
  assert.throws(
    () => parseProfileCreate({
      studentCode: 'SV001',
      fullName: 'Sinh viên mẫu',
      gender: 'MALE',
      className: 'K29',
      faculty: 'CNTT',
      phone: 'not-a-phone',
    }),
    (error: unknown) => error instanceof AppError && error.status === 422,
  );
});
