import { z } from 'zod';
import { AppError } from '../http/errors.js';

const password = z.string().refine(v => [...v].length >= 8 && [...v].length <= 128);
const loginSchema = z.strictObject({ accountType: z.enum(['STUDENT', 'STAFF']),
  identifier: z.string().trim().refine(v => [...v].length >= 1 && [...v].length <= 50), password });
const changeSchema = z.strictObject({ currentPassword: password, newPassword: password });
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(422, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu không hợp lệ.');
  return result.data;
}
export function noQuery(query: unknown): void { parse(z.strictObject({}), query); }
export function getCsrfToken(query: unknown): void { noQuery(query); }
export function getCurrentIdentity(query: unknown): void { noQuery(query); }
export function logout(query: unknown, body: unknown): void { noQuery(query); parse(z.strictObject({}), body); }
export function login(query: unknown, body: unknown) {
  noQuery(query);
  const input = parse(loginSchema, body);
  return { ...input, identifier: input.accountType === 'STUDENT' ? input.identifier.toUpperCase() : input.identifier.toLowerCase() };
}
export function changePassword(query: unknown, body: unknown) { noQuery(query); return parse(changeSchema, body); }
