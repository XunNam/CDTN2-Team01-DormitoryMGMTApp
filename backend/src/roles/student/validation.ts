// Validation (allowlist) for the Student role. Parses raw path/query/body into typed input.
// No DB access and no authorization here. Unknown / repeated / mis-typed input => 422 VALIDATION_ERROR.
import { z } from 'zod';
import { AppError } from '../../shared/http/errors.js';

type Detail = { field: string; message: string };

export interface PageInput { page: number; pageSize: number }
export interface RoomQueryInput extends PageInput {
  q?: string;
  buildingId?: string;
  gender?: 'MALE' | 'FEMALE';
  hasAvailability?: boolean;
}
export interface RoomPathInput { roomId: string }
export interface ContactPatchInput { phone?: string | null; email?: string | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DECIMAL_INT = /^(0|[1-9][0-9]*)$/;
const PHONE = /^\+?[0-9]{7,20}$/;
// Mirrors the CHECK on student_profiles.email so a valid request never trips the DB constraint.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const codePoints = (value: string): number => [...value].length;

function fail(details: Detail[]): never {
  throw new AppError(422, 'VALIDATION_ERROR', 'Dữ liệu yêu cầu không hợp lệ.', details);
}

function fromZod(error: z.ZodError): never {
  const details: Detail[] = [];
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) details.push({ field: key, message: 'Trường không được phép.' });
    } else {
      const field = issue.path.map(String).join('.') || 'request';
      details.push({ field, message: issue.code === 'custom' ? issue.message : 'Sai kiểu dữ liệu.' });
    }
  }
  fail(details);
}

function parseStrict<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) fromZod(result.error);
  return result.data;
}

/** Query values arrive as strings (or arrays when a key repeats). Copy to a plain object first. */
function plainQuery(query: unknown): Record<string, unknown> {
  return { ...(query as Record<string, unknown>) };
}

const emptyQuery = z.strictObject({});

const pageFields = {
  page: z.string().optional(),
  pageSize: z.string().optional(),
};

function readPage(raw: { page?: string; pageSize?: string }): PageInput {
  const details: Detail[] = [];
  let page = 1;
  let pageSize = DEFAULT_PAGE_SIZE;
  if (raw.page !== undefined) {
    if (!DECIMAL_INT.test(raw.page) || !Number.isSafeInteger(Number(raw.page)) || Number(raw.page) < 1) {
      details.push({ field: 'page', message: 'Phải là số nguyên từ 1 trở lên.' });
    } else page = Number(raw.page);
  }
  if (raw.pageSize !== undefined) {
    const n = Number(raw.pageSize);
    if (!DECIMAL_INT.test(raw.pageSize) || n < 1 || n > MAX_PAGE_SIZE) {
      details.push({ field: 'pageSize', message: 'Phải là số nguyên từ 1 đến 100.' });
    } else pageSize = n;
  }
  if (details.length) fail(details);
  return { page, pageSize };
}

/** GET operations that take no query at all: any key (even page/studentId) is rejected. */
function noQuery(query: unknown): void {
  parseStrict(emptyQuery, plainQuery(query));
}

export function studentGetProfile(query: unknown): void { noQuery(query); }

export function studentGetPeriod(query: unknown): void { noQuery(query); }

export function studentListBuildings(query: unknown): PageInput {
  return readPage(parseStrict(z.strictObject(pageFields), plainQuery(query)));
}

export function studentListRooms(query: unknown): RoomQueryInput {
  const raw = parseStrict(z.strictObject({
    ...pageFields,
    q: z.string().optional(),
    buildingId: z.string().optional(),
    gender: z.string().optional(),
    hasAvailability: z.string().optional(),
  }), plainQuery(query));
  const details: Detail[] = [];
  let paging: PageInput = { page: 1, pageSize: DEFAULT_PAGE_SIZE };
  try { paging = readPage(raw); } catch (error) {
    if (error instanceof AppError && error.details) details.push(...error.details); else throw error;
  }
  const out: RoomQueryInput = { ...paging };
  if (raw.q !== undefined) {
    const q = raw.q.trim();
    if (codePoints(q) > 100) details.push({ field: 'q', message: 'Tối đa 100 ký tự.' });
    else if (q !== '') out.q = q;
  }
  if (raw.buildingId !== undefined) {
    if (!UUID.test(raw.buildingId)) details.push({ field: 'buildingId', message: 'Phải là UUID hợp lệ.' });
    else out.buildingId = raw.buildingId.toLowerCase();
  }
  if (raw.gender !== undefined) {
    if (raw.gender !== 'MALE' && raw.gender !== 'FEMALE') details.push({ field: 'gender', message: 'Chỉ nhận MALE hoặc FEMALE.' });
    else out.gender = raw.gender;
  }
  if (raw.hasAvailability !== undefined) {
    if (raw.hasAvailability !== 'true' && raw.hasAvailability !== 'false') {
      details.push({ field: 'hasAvailability', message: 'Chỉ nhận true hoặc false.' });
    } else out.hasAvailability = raw.hasAvailability === 'true';
  }
  if (details.length) fail(details);
  return out;
}

export function studentGetRoom(params: unknown, query: unknown): RoomPathInput {
  noQuery(query);
  const { roomId } = (params ?? {}) as { roomId?: unknown };
  if (typeof roomId !== 'string' || !UUID.test(roomId)) fail([{ field: 'roomId', message: 'Phải là UUID hợp lệ.' }]);
  return { roomId: roomId.toLowerCase() };
}

const nullableTrimmed = (check: (value: string) => string | null) =>
  z.union([z.string(), z.null()]).superRefine((value, ctx) => {
    if (value === null) return;
    const message = check(value.trim());
    if (message) ctx.addIssue({ code: 'custom', message });
  });

const contactSchema = z.strictObject({
  phone: nullableTrimmed(v => (PHONE.test(v) ? null : 'Điện thoại phải gồm 7–20 chữ số, có thể bắt đầu bằng +.')).optional(),
  email: nullableTrimmed(v => (codePoints(v) <= 254 && EMAIL.test(v) ? null : 'Email không hợp lệ (tối đa 254 ký tự).')).optional(),
});

export function studentUpdateContact(query: unknown, body: unknown): ContactPatchInput {
  noQuery(query);
  const parsed = parseStrict(contactSchema, body);
  const out: ContactPatchInput = {};
  if (parsed.phone !== undefined) out.phone = parsed.phone === null ? null : parsed.phone.trim();
  if (parsed.email !== undefined) out.email = parsed.email === null ? null : parsed.email.trim();
  if (Object.keys(out).length === 0) fail([{ field: 'request', message: 'Cần ít nhất một trường phone hoặc email.' }]);
  return out;
}
