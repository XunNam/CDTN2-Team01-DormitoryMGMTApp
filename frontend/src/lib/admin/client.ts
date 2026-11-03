import { ApiError, isCancelled, isUncertain, type SessionClient } from "../api/client.ts";
import { UUID_PATTERN } from "../auth/contracts.ts";
import { readAccount, readCandidate, readPage } from "./contracts.ts";
import { validateCreate } from "./validation.ts";
import type { Account, AccountCreate, AccountQuery, AccountRef, CandidateQuery, CreationLookup } from "./types.ts";

function queryString(query: AccountQuery | CandidateQuery) {
  if (!Number.isInteger(query.page) || query.page < 1 || !Number.isInteger(query.pageSize) || query.pageSize < 1 || query.pageSize > 100
    || (query.q !== undefined && [...query.q].length > 100)) throw new ApiError("VALIDATION_ERROR", 422);
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) });
  if (query.q?.trim()) params.set("q", query.q.trim());
  if ("actorKind" in query && query.actorKind) {
    if (!["STUDENT", "STAFF"].includes(query.actorKind)) throw new ApiError("VALIDATION_ERROR", 422);
    params.set("actorKind", query.actorKind);
  }
  if ("role" in query && query.role) {
    if (!["SV", "BQL", "ADMIN"].includes(query.role)) throw new ApiError("VALIDATION_ERROR", 422);
    params.set("role", query.role);
  }
  if ("isLocked" in query && query.isLocked !== undefined) {
    if (typeof query.isLocked !== "boolean") throw new ApiError("VALIDATION_ERROR", 422);
    params.set("isLocked", String(query.isLocked));
  }
  return params.toString();
}
function pathFor(ref: AccountRef) {
  if (!["STUDENT", "STAFF"].includes(ref.actorKind) || !UUID_PATTERN.test(ref.accountId)) throw new ApiError("NOT_FOUND", 404);
  return "admin/accounts/" + ref.actorKind + "/" + encodeURIComponent(ref.accountId.toLowerCase());
}
export function createAdminClient(api: SessionClient) {
  async function listAccounts(query: AccountQuery, signal?: AbortSignal) {
    return readPage(await api.get("admin/accounts?" + queryString(query), signal), readAccount);
  }
  async function getAccount(ref: AccountRef, signal?: AbortSignal) {
    const account = readAccount((await api.get(pathFor(ref), signal))?.data);
    if (account.actorKind !== ref.actorKind || account.id.toLowerCase() !== ref.accountId.toLowerCase()) throw new ApiError("UNEXPECTED_RESPONSE");
    return account;
  }
  async function listCandidates(query: CandidateQuery, signal?: AbortSignal) {
    const { page, pageSize, q } = query;
    return readPage(await api.get("admin/student-profiles/candidates?" + queryString({ page, pageSize, q }), signal), readCandidate);
  }
  async function createAccount(input: AccountCreate, signal?: AbortSignal) {
    const errors = validateCreate(input);
    if (Object.keys(errors).length) throw new ApiError("VALIDATION_ERROR", 422, Object.entries(errors).map(([field, message]) => ({ field, message: message! })));
    const body = input.accountType === "STUDENT"
      ? { accountType: input.accountType, studentId: input.studentId, role: input.role, password: input.password }
      : { accountType: input.accountType, username: input.username.trim().toLowerCase(), displayName: input.displayName.trim(), role: input.role, password: input.password };
    let responseReceived = false;
    try {
      const result = await api.mutate("admin/accounts", "POST", body, signal);
      responseReceived = true;
      const account = readAccount(result?.data);
      if (account.actorKind !== input.accountType || account.role !== input.role
        || (input.accountType === "STUDENT" ? account.studentId?.toLowerCase() !== input.studentId.toLowerCase() : account.identifier !== input.username.trim().toLowerCase())) throw new ApiError("UNEXPECTED_RESPONSE");
      return account;
    } catch (error) {
      if (isCancelled(error)) throw error;
      if (isUncertain(error) || (responseReceived && error instanceof ApiError && error.code === "UNEXPECTED_RESPONSE")) {
        throw new ApiError("CREATE_OUTCOME_UNKNOWN", 0, [], true);
      }
      throw error;
    }
  }
  async function setAccountLock(ref: AccountRef, isLocked: boolean, signal?: AbortSignal) {
    const path = pathFor(ref);
    if (typeof isLocked !== "boolean") throw new ApiError("VALIDATION_ERROR", 422);
    let responseReceived = false;
    try {
      const result = await api.mutate(path + "/lock", "PATCH", { isLocked }, signal);
      responseReceived = true;
      const account = readAccount(result?.data);
      if (account.actorKind !== ref.actorKind || account.id.toLowerCase() !== ref.accountId.toLowerCase() || account.isLocked !== isLocked) {
        throw new ApiError("UNEXPECTED_RESPONSE");
      }
      return account;
    } catch (error) {
      if (isCancelled(error)) throw error;
      if (isUncertain(error) || (responseReceived && error instanceof ApiError && error.code === "UNEXPECTED_RESPONSE")) {
        throw new ApiError("LOCK_OUTCOME_UNKNOWN", 0, [], true);
      }
      throw error;
    }
  }
  async function findCreatedAccount(lookup: CreationLookup, signal?: AbortSignal): Promise<Account | null> {
    // Exact matching after server search; a search hit is not proof that our POST created it.
    for (let page = 1; page <= 10; page++) {
      const result = await listAccounts({ page, pageSize: 100, q: lookup.identifier, actorKind: lookup.accountType }, signal);
      const found = result.data.find(a => a.actorKind === lookup.accountType && a.identifier.toLowerCase() === lookup.identifier.trim().toLowerCase()
        && (lookup.accountType === "STAFF" || a.studentId?.toLowerCase() === lookup.studentId?.toLowerCase()));
      if (found) return getAccount({ actorKind: found.actorKind, accountId: found.id }, signal);
      if (page >= result.meta.totalPages) break;
    }
    return null; // The UI retains an unknown outcome, never automatically resends the POST.
  }
  return { listAccounts, getAccount, listCandidates, createAccount, setAccountLock, findCreatedAccount };
}
export type AdminClient = ReturnType<typeof createAdminClient>;
