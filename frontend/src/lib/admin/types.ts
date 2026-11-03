import type { AccountType, Role } from "../auth/types.ts";

export interface Account {
  id: string; actorKind: AccountType; role: Role; identifier: string; displayName: string;
  studentId: string | null; isLocked: boolean; createdAt: string; updatedAt: string;
}
export interface AccountRef { actorKind: AccountType; accountId: string }
export interface PageMeta { page: number; pageSize: number; totalItems: number; totalPages: number }
export interface Page<T> { data: T[]; meta: PageMeta }
export interface AccountQuery {
  page: number; pageSize: number; q?: string; actorKind?: AccountType; role?: Role; isLocked?: boolean;
}
export interface CandidateQuery { page: number; pageSize: number; q?: string }
export interface ProfileCandidate { id: string; studentCode: string; fullName: string; hasAccount: false }
export type AccountCreate =
  | { accountType: "STUDENT"; studentId: string; role: "SV"; password: string }
  | { accountType: "STAFF"; username: string; displayName: string; role: "BQL" | "ADMIN"; password: string };
export interface CreationLookup { accountType: AccountType; identifier: string; studentId?: string }
export type ResultAction = "created" | "locked" | "unlocked" | "verified";
export interface AccountResult { account: Account; action: ResultAction }
export function accountRef(account: Account): AccountRef { return { actorKind: account.actorKind, accountId: account.id }; }
export function accountKey(ref: AccountRef): string { return ref.actorKind + ":" + ref.accountId.toLowerCase(); }
export function accountPath(ref: AccountRef): string {
  return "/admin/accounts/" + encodeURIComponent(ref.actorKind) + "/" + encodeURIComponent(ref.accountId);
}
