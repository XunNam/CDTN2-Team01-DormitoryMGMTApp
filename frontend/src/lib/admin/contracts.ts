import { ApiError, isRecord, type Envelope } from "../api/client.ts";
import { readIdentity, UUID_PATTERN } from "../auth/contracts.ts";
import type { Account, Page, PageMeta, ProfileCandidate } from "./types.ts";

function bad(): never { throw new ApiError("UNEXPECTED_RESPONSE"); }
export function readAccount(data: unknown): Account {
  if (!isRecord(data) || typeof data.id !== "string" || typeof data.isLocked !== "boolean"
    || typeof data.createdAt !== "string" || !Number.isFinite(Date.parse(data.createdAt))
    || typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt))) return bad();
  const identity = readIdentity({ ...data, accountId: data.id });
  return { id: identity.accountId, actorKind: identity.actorKind, role: identity.role,
    identifier: identity.identifier, displayName: identity.displayName, studentId: identity.studentId,
    isLocked: data.isLocked, createdAt: data.createdAt, updatedAt: data.updatedAt };
}
export function readCandidate(data: unknown): ProfileCandidate {
  if (!isRecord(data) || typeof data.id !== "string" || !UUID_PATTERN.test(data.id)
    || typeof data.studentCode !== "string" || !data.studentCode || typeof data.fullName !== "string" || !data.fullName
    || data.hasAccount !== false) return bad();
  return { id: data.id, studentCode: data.studentCode, fullName: data.fullName, hasAccount: false };
}
function readMeta(data: unknown): PageMeta {
  if (!isRecord(data)) return bad();
  const { page, pageSize, totalItems, totalPages } = data;
  if (typeof page !== "number" || !Number.isSafeInteger(page) || page < 1
    || typeof pageSize !== "number" || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100
    || typeof totalItems !== "number" || !Number.isSafeInteger(totalItems) || totalItems < 0
    || typeof totalPages !== "number" || !Number.isSafeInteger(totalPages) || totalPages !== Math.ceil(totalItems / pageSize)) return bad();
  return { page, pageSize, totalItems, totalPages };
}
export function readPage<T>(value: Envelope | null, read: (item: unknown) => T): Page<T> {
  if (!value || !Array.isArray(value.data)) return bad();
  return { data: value.data.map(read), meta: readMeta(value.meta) };
}
