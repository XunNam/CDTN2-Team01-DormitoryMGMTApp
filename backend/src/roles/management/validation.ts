import { z, ZodError } from 'zod';
import { AppError } from '../../shared/http/errors.js';

const businessCode = z.string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9_-]{0,31}$/));

const roomCode = z.string().trim().transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9][A-Z0-9_.-]{0,31}$/));

const nonEmptyTrimmed = (max: number) => z.string()
  .trim()
  .refine((value) => [...value].length > 0, 'Không được để trống.')
  .refine((value) => [...value].length <= max, `Không được vượt quá ${max} ký tự.`);

const nullablePhone = z.union([
  z.literal(null),
  z.string().trim().regex(/^\+?[0-9]{7,20}$/),
]);

const nullableEmail = z.union([
  z.literal(null),
  z.string().trim().email().max(254),
]);

function vietnamToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const isoDate = z.string()
  .regex(/^(?!0000)\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Ngày không hợp lệ.');

const profileDateOfBirth = z.union([z.literal(null), isoDate])
  .refine((value) => value === null || value <= vietnamToday(), 'Ngày sinh không được ở tương lai.');

const uuidString = z.string().uuid({ message: 'UUID không hợp lệ.' });
const genderEnum = z.enum(['MALE', 'FEMALE']);
const roomStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);
const periodStatusEnum = z.enum(['OPEN', 'CLOSED']);
const applicationStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
const residenceStatusEnum = z.enum(['ALLOCATED', 'CHECKED_IN', 'ENDED', 'CANCELLED']);
const receiptStatusEnum = z.enum(['UNPAID', 'PAID']);

const pageNumber = z.preprocess(
  (value) => value === undefined ? '1' : value,
  z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)),
);
const pageSizeNumber = z.preprocess(
  (value) => value === undefined ? '20' : value,
  z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int().min(1).max(100)),
);
const queryText = z.string().trim()
  .refine((value) => [...value].length <= 100, 'Không được vượt quá 100 ký tự.')
  .transform((value) => value || undefined)
  .optional();

function queryObject(input: unknown, schema: z.ZodType): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Query không hợp lệ.');
  }
  const entries = Object.entries(input);
  if (entries.some(([, value]) => typeof value !== 'string')) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Mỗi tham số query chỉ được xuất hiện một lần và phải là scalar.');
  }
  return parse(schema, input);
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) {
    return new AppError(422, 'VALIDATION_ERROR', 'Dữ liệu đầu vào không hợp lệ.', error.issues.map((issue) => ({
      field: issue.path.length ? issue.path.join('.') : 'body',
      message: issue.message,
    })));
  }
  throw error;
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    throw toAppError(error);
  }
}

export const studentProfileQuerySchema = z.object({
  page: pageNumber,
  pageSize: pageSizeNumber,
  q: queryText,
  gender: genderEnum.optional(),
}).strict();

export const profileCreateSchema = z.object({
  studentCode: businessCode,
  fullName: nonEmptyTrimmed(150),
  gender: genderEnum,
  className: nonEmptyTrimmed(100),
  faculty: nonEmptyTrimmed(100),
  phone: nullablePhone.optional(),
  email: nullableEmail.optional(),
  dateOfBirth: profileDateOfBirth.optional(),
  permanentAddress: z.union([z.literal(null), nonEmptyTrimmed(500)]).optional(),
}).strict();

export const profilePatchSchema = z.object({
  fullName: nonEmptyTrimmed(150).optional(),
  gender: genderEnum.optional(),
  className: nonEmptyTrimmed(100).optional(),
  faculty: nonEmptyTrimmed(100).optional(),
  phone: nullablePhone.optional(),
  email: nullableEmail.optional(),
  dateOfBirth: profileDateOfBirth.optional(),
  permanentAddress: z.union([z.literal(null), nonEmptyTrimmed(500)]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'PATCH phải có ít nhất một trường.');

export const buildingQuerySchema = z.object({
  page: pageNumber,
  pageSize: pageSizeNumber,
  q: queryText,
}).strict();

export const buildingCreateSchema = z.object({
  code: businessCode,
  name: nonEmptyTrimmed(150),
}).strict();

export const buildingPatchSchema = z.object({
  name: nonEmptyTrimmed(150),
}).strict();

export const roomQuerySchema = z.object({
  page: pageNumber,
  pageSize: pageSizeNumber,
  q: queryText,
  buildingId: uuidString.optional(),
  gender: genderEnum.optional(),
  hasAvailability: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  status: roomStatusEnum.optional(),
}).strict();

const feeVnd = z.string()
  .regex(/^(0|[1-9][0-9]{0,18})$/, 'Phải là số tiền VND nguyên không âm.')
  .refine((value) => BigInt(value) <= 9223372036854775807n, 'Số tiền vượt giới hạn BIGINT.');

export const roomCreateSchema = z.object({
  buildingId: uuidString,
  code: roomCode,
  capacity: z.number().int().min(1).max(10000),
  gender: genderEnum,
  feeVnd,
  status: roomStatusEnum,
}).strict();

export const roomPatchSchema = z.object({
  capacity: z.number().int().min(1).max(10000).optional(),
  gender: genderEnum.optional(),
  feeVnd: feeVnd.optional(),
  status: roomStatusEnum.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'PATCH phải có ít nhất một trường.');

export const periodPatchSchema = z.object({
  status: periodStatusEnum,
}).strict();

export const applicationQuerySchema = z.object({
  page: pageNumber,
  pageSize: pageSizeNumber,
  status: applicationStatusEnum.optional(),
  studentId: uuidString.optional(),
  preferredRoomId: uuidString.optional(),
}).strict();

export const residenceQuerySchema = z.object({
  page: pageNumber,
  pageSize: pageSizeNumber,
  status: residenceStatusEnum.optional(),
  studentId: uuidString.optional(),
  roomId: uuidString.optional(),
}).strict();

export const receiptQuerySchema = z.object({
  page: pageNumber,
  pageSize: pageSizeNumber,
  status: receiptStatusEnum.optional(),
  studentId: uuidString.optional(),
  residenceId: uuidString.optional(),
}).strict();

const businessDate = isoDate.refine((value) => value <= vietnamToday(), 'Ngày không được ở tương lai.');
const rejectionReason = nonEmptyTrimmed(500);

export const applicationApproveSchema = z.object({
  roomId: uuidString,
}).strict();

export const applicationRejectSchema = z.object({
  reason: rejectionReason,
}).strict();

export const checkInSchema = z.object({
  checkInDate: businessDate,
}).strict();

export const cancelAllocationSchema = z.object({
  reason: rejectionReason,
}).strict();

export const checkOutSchema = z.object({
  checkOutDate: businessDate,
}).strict();

export const receiptCreateSchema = z.object({
  residenceId: uuidString,
}).strict();

export const receiptPaySchema = z.object({
  paymentDate: businessDate,
}).strict();

const emptyQuerySchema = z.object({}).strict();

export function parseStudentProfileQuery(input: unknown) {
  return queryObject(input, studentProfileQuerySchema) as z.infer<typeof studentProfileQuerySchema>;
}
export function parseProfileCreate(input: unknown) { return parse(profileCreateSchema, input); }
export function parseProfilePatch(input: unknown) { return parse(profilePatchSchema, input); }
export function parseBuildingQuery(input: unknown) { return queryObject(input, buildingQuerySchema) as z.infer<typeof buildingQuerySchema>; }
export function parseBuildingCreate(input: unknown) { return parse(buildingCreateSchema, input); }
export function parseBuildingPatch(input: unknown) { return parse(buildingPatchSchema, input); }
export function parseRoomQuery(input: unknown) { return queryObject(input, roomQuerySchema) as z.infer<typeof roomQuerySchema>; }
export function parseRoomCreate(input: unknown) { return parse(roomCreateSchema, input); }
export function parseRoomPatch(input: unknown) { return parse(roomPatchSchema, input); }
export function parsePeriodPatch(input: unknown) { return parse(periodPatchSchema, input); }
export function parseApplicationQuery(input: unknown) {
  return queryObject(input, applicationQuerySchema) as z.infer<typeof applicationQuerySchema>;
}
export function parseResidenceQuery(input: unknown) {
  return queryObject(input, residenceQuerySchema) as z.infer<typeof residenceQuerySchema>;
}
export function parseReceiptQuery(input: unknown) {
  return queryObject(input, receiptQuerySchema) as z.infer<typeof receiptQuerySchema>;
}
export function parseApplicationApprove(input: unknown) { return parse(applicationApproveSchema, input); }
export function parseApplicationReject(input: unknown) { return parse(applicationRejectSchema, input); }
export function parseCheckIn(input: unknown) { return parse(checkInSchema, input); }
export function parseCancelAllocation(input: unknown) { return parse(cancelAllocationSchema, input); }
export function parseCheckOut(input: unknown) { return parse(checkOutSchema, input); }
export function parseReceiptCreate(input: unknown) { return parse(receiptCreateSchema, input); }
export function parseReceiptPay(input: unknown) { return parse(receiptPaySchema, input); }
export function parseEmptyQuery(input: unknown): void { queryObject(input, emptyQuerySchema); }

export function requireUuidParam(value: string | undefined, field: string): string {
  if (value === undefined) {
    throw new AppError(422, 'VALIDATION_ERROR', `Thiếu tham số ${field}.`, [{ field, message: 'Trường bắt buộc.' }]);
  }
  const result = uuidString.safeParse(value);
  if (!result.success) {
    throw new AppError(422, 'VALIDATION_ERROR', `${field} không hợp lệ.`, [{ field, message: 'UUID không hợp lệ.' }]);
  }
  return result.data;
}

// Operation exports match the contract manifest; small parsers remain available
// for focused validation tests. Path UUID validation is shared by detail/actions.
export const managementListProfiles=parseStudentProfileQuery;
export const managementCreateProfile=parseProfileCreate;
export const managementGetProfile=parseEmptyQuery;
export const managementUpdateProfile=parseProfilePatch;
export const managementListBuildings=parseBuildingQuery;
export const managementCreateBuilding=parseBuildingCreate;
export const managementGetBuilding=parseEmptyQuery;
export const managementUpdateBuilding=parseBuildingPatch;
export const managementListRooms=parseRoomQuery;
export const managementCreateRoom=parseRoomCreate;
export const managementGetRoom=parseEmptyQuery;
export const managementUpdateRoom=parseRoomPatch;
export const managementGetPeriod=parseEmptyQuery;
export const managementUpdatePeriod=parsePeriodPatch;
export const managementListApplications=parseApplicationQuery;
export const managementGetApplication=parseEmptyQuery;
export const managementApproveApplication=parseApplicationApprove;
export const managementRejectApplication=parseApplicationReject;
export const managementListResidences=parseResidenceQuery;
export const managementGetResidence=parseEmptyQuery;
export const managementCheckIn=parseCheckIn;
export const managementCancelAllocation=parseCancelAllocation;
export const managementCheckOut=parseCheckOut;
export const managementListReceipts=parseReceiptQuery;
export const managementCreateReceipt=parseReceiptCreate;
export const managementGetReceipt=parseEmptyQuery;
export const managementPayReceipt=parseReceiptPay;
export const managementGetStatistics=parseEmptyQuery;
