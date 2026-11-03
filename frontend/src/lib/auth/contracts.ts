import { ApiError, isRecord } from "../api/client.ts";
import type { Identity } from "./types.ts";

export const UUID_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export function readIdentity(data: unknown): Identity {
  if (!isRecord(data)) throw new ApiError("UNEXPECTED_RESPONSE");
  const validKind = data.actorKind === "STUDENT" || data.actorKind === "STAFF";
  const validRole = data.actorKind === "STUDENT" ? data.role === "SV" : data.role === "BQL" || data.role === "ADMIN";
  if (!validKind || !validRole || typeof data.accountId !== "string" || !UUID_PATTERN.test(data.accountId)
    || typeof data.identifier !== "string" || !data.identifier
    || typeof data.displayName !== "string" || !data.displayName
    || (data.actorKind === "STUDENT" ? typeof data.studentId !== "string" || !UUID_PATTERN.test(data.studentId) : data.studentId !== null)) {
    throw new ApiError("UNEXPECTED_RESPONSE");
  }
  return {
    actorKind: data.actorKind as Identity["actorKind"], accountId: data.accountId,
    role: data.role as Identity["role"], identifier: data.identifier, displayName: data.displayName,
    studentId: data.studentId as string | null,
  };
}
