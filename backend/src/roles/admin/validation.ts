// ADMIN role input parsing. Contract: API Endpoint/System Admin/API-Contract.md (revision 1.0.0)
// and Shared/00-conventions.md. Allowlist only; every failure is 422 VALIDATION_ERROR.
import { z } from 'zod';
import type { ActorKind, Role } from '../../shared/auth/types.js';
import { AppError } from '../../shared/http/errors.js';

export interface PageInput { page: number; pageSize: number }
export interface AccountListInput extends PageInput {
  q: string | null;
  actorKind: ActorKind | null;
  role: Role | null;
  isLocked: boolean | null;
}
export interface CandidateListInput extends PageInput { q: string | null }
export interface AccountRef { actorKind: ActorKind; accountId: string }
export type AccountCreateInput =
  | { accountType: 'STUDENT'; studentId: string; role: 'SV'; password: string }
  | { accountType: 'STAFF'; username: string; displayName: string; role: 'BQL' | 'ADMIN'; password: string };
export interface AccountLockInput { isLocked: boolean }

type Detail = { field: string; message: string };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,49}$/;
const POSITIVE_INT_RE = /^[1-9][0-9]*$/;
const codePoints = (value: string): number => [...value].length;

function invalid(details: Detail[]): AppError {
  return new AppError(422, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu không hợp lệ.', details);
}

/** Query values must be single scalar strings: repeated keys or bracket syntax are rejected. */
function scalarQuery(query: unknown, allowed: readonly string[]): Record<string, string> {
  const source = (query ?? {}) as Record<string, unknown>;
  const details: Detail[] = [];
  const out: Record<string, string> = {};
  for (const key of Object.keys(source)) {
    if (!allowed.includes(key)) { details.push({ field: key, message: 'Tham số không được hỗ trợ.' }); continue; }
    const value = source[key];
    if (typeof value !== 'string') { details.push({ field: key, message: 'Tham số chỉ được truyền một giá trị.' }); continue; }
    out[key] = value;
  }
  if (details.length) throw invalid(details);
  return out;
}

function parsePage(raw: Record<string, string>, details: Detail[]): PageInput {
  const read = (key: 'page' | 'pageSize', fallback: number, max?: number): number => {
    const value = raw[key];
    if (value === undefined) return fallback;
    const parsed = POSITIVE_INT_RE.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(parsed) || (max !== undefined && parsed > max)) {
      details.push({ field: key, message: max ? `Phải là số nguyên từ 1 đến ${max}.` : 'Phải là số nguyên dương.' });
      return fallback;
    }
    return parsed;
  };
  return { page: read('page', 1), pageSize: read('pageSize', 20, 100) };
}

/** q: maxLength 100 code points (schema), then trimmed; empty after trim means no filter. */
function parseSearch(raw: Record<string, string>, details: Detail[]): string | null {
  const value = raw.q;
  if (value === undefined) return null;
  if (codePoints(value) > 100) { details.push({ field: 'q', message: 'Tối đa 100 ký tự.' }); return null; }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function parseEnum<T extends string>(raw: Record<string, string>, key: string, values: readonly T[], details: Detail[]): T | null {
  const value = raw[key];
  if (value === undefined) return null;
  if (!(values as readonly string[]).includes(value)) { details.push({ field: key, message: `Chỉ nhận ${values.join(', ')}.` }); return null; }
  return value as T;
}

function rejectAnyQuery(query: unknown): void {
  scalarQuery(query, []);
}

function parseAccountRef(params: unknown): AccountRef {
  const { actorKind, accountId } = (params ?? {}) as Record<string, unknown>;
  const details: Detail[] = [];
  if (actorKind !== 'STUDENT' && actorKind !== 'STAFF') details.push({ field: 'actorKind', message: 'Chỉ nhận STUDENT hoặc STAFF.' });
  if (typeof accountId !== 'string' || !UUID_RE.test(accountId)) details.push({ field: 'accountId', message: 'Phải là UUID hợp lệ.' });
  if (details.length) throw invalid(details);
  return { actorKind: actorKind as ActorKind, accountId: (accountId as string).toLowerCase() };
}

function zodDetails(error: z.ZodError): Detail[] {
  const seen = new Set<string>();
  const details: Detail[] = [];
  for (const issue of error.issues) {
    const keys = issue.code === 'unrecognized_keys' ? issue.keys : [issue.path.map(String).join('.') || 'body'];
    for (const field of keys) {
      if (seen.has(field)) continue;
      seen.add(field);
      details.push({ field, message: issue.code === 'unrecognized_keys' ? 'Trường không được hỗ trợ.' : 'Giá trị không hợp lệ.' });
    }
  }
  return details;
}

// Password: not trimmed or normalized; 8..128 Unicode code points (Shared/03-data-contracts.md).
const password = z.string().refine(value => codePoints(value) >= 8 && codePoints(value) <= 128);
const studentCreate = z.strictObject({
  accountType: z.literal('STUDENT'),
  studentId: z.string().regex(UUID_RE).transform(value => value.toLowerCase()),
  role: z.literal('SV'),
  password,
});
const staffCreate = z.strictObject({
  accountType: z.literal('STAFF'),
  // Username: trim + lowercase, then pattern (Shared conventions).
  username: z.string().transform(value => value.trim().toLowerCase()).pipe(z.string().regex(USERNAME_RE)),
  displayName: z.string().transform(value => value.trim())
    .pipe(z.string().refine(value => codePoints(value) >= 1 && codePoints(value) <= 150)),
  role: z.enum(['BQL', 'ADMIN']),
  password,
});
const accountLock = z.strictObject({ isLocked: z.boolean() });

export function adminListAccounts(query: unknown): AccountListInput {
  const raw = scalarQuery(query, ['page', 'pageSize', 'q', 'actorKind', 'role', 'isLocked']);
  const details: Detail[] = [];
  const page = parsePage(raw, details);
  const q = parseSearch(raw, details);
  const actorKind = parseEnum(raw, 'actorKind', ['STUDENT', 'STAFF'] as const, details);
  const role = parseEnum(raw, 'role', ['SV', 'BQL', 'ADMIN'] as const, details);
  const locked = parseEnum(raw, 'isLocked', ['true', 'false'] as const, details);
  if (details.length) throw invalid(details);
  return { ...page, q, actorKind, role, isLocked: locked === null ? null : locked === 'true' };
}

export function adminGetAccount(params: unknown, query: unknown): AccountRef {
  const ref = parseAccountRef(params);
  rejectAnyQuery(query);
  return ref;
}

export function adminCreateAccount(query: unknown, body: unknown): AccountCreateInput {
  rejectAnyQuery(query);
  const source = (body ?? {}) as Record<string, unknown>;
  // Pick the variant from accountType so errors name fields of that variant only.
  const schema = source.accountType === 'STUDENT' ? studentCreate : source.accountType === 'STAFF' ? staffCreate : null;
  if (!schema) throw invalid([{ field: 'accountType', message: 'Chỉ nhận STUDENT hoặc STAFF.' }]);
  const result = schema.safeParse(body);
  if (!result.success) throw invalid(zodDetails(result.error));
  return result.data as AccountCreateInput;
}

export function adminSetAccountLock(params: unknown, query: unknown, body: unknown): AccountRef & AccountLockInput {
  const ref = parseAccountRef(params);
  rejectAnyQuery(query);
  const result = accountLock.safeParse(body);
  if (!result.success) throw invalid(zodDetails(result.error));
  return { ...ref, isLocked: result.data.isLocked };
}

export function adminListProfileCandidates(query: unknown): CandidateListInput {
  const raw = scalarQuery(query, ['page', 'pageSize', 'q']);
  const details: Detail[] = [];
  const page = parsePage(raw, details);
  const q = parseSearch(raw, details);
  if (details.length) throw invalid(details);
  return { ...page, q };
}
