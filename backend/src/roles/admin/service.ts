// ADMIN role business logic. Mutations run inside the shared withBusinessTransaction (global advisory
// lock + fresh actor re-read); list/count reads share one REPEATABLE READ READ ONLY snapshot.
import argon2 from 'argon2';
import type { Pool, PoolClient } from 'pg';
import type { Actor, SessionIdentity } from '../../shared/auth/types.js';
import { withBusinessTransaction } from '../../shared/db/transaction.js';
import { AppError } from '../../shared/http/errors.js';
import type { PageMeta } from '../../shared/http/response.js';
import * as repository from './repository.js';
import type { AccountDto, ProfileCandidateDto } from './repository.js';
import type { AccountCreateInput, AccountListInput, AccountLockInput, AccountRef, CandidateListInput } from './validation.js';

export interface Page<T> { data: T[]; meta: PageMeta }

// Shared/03-data-contracts.md: Argon2id memoryCost 65536 KiB, timeCost 3, parallelism 1, hashLength 32.
const ARGON2_OPTIONS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1, hashLength: 32 } as const;

export interface AdminServiceDeps { hashPassword: (password: string) => Promise<string> }
export const defaultDeps: AdminServiceDeps = { hashPassword: password => argon2.hash(password, ARGON2_OPTIONS) };

const notFound = (): AppError => new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên.');

/**
 * Read-only snapshot for list + count (Shared/00-conventions.md). No global write lock for GET.
 * Role-local because Shared has no helper yet; see handoff (proposal to move into shared/db).
 */
async function withReadSnapshot<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let started = false;
  let destroy = false;
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    started = true;
    const result = await work(client);
    await client.query('COMMIT');
    started = false;
    return result;
  } catch (error) {
    if (started) {
      try { await client.query('ROLLBACK'); } catch { destroy = true; }
    } else destroy = true;
    throw error;
  } finally { client.release(destroy); }
}

function pageMeta(page: number, pageSize: number, totalItems: number): PageMeta {
  return { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) };
}

/** OFFSET as a decimal string: (page-1)*pageSize can exceed Number precision for huge page values. */
const offsetOf = (page: number, pageSize: number): string => ((BigInt(page) - 1n) * BigInt(pageSize)).toString();

/** Mutations re-check the actor after the global lock; role is immutable but is asserted again. */
function assertAdmin(actor: Actor): void {
  if (actor.role !== 'ADMIN') throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
}

function isUniqueViolation(error: unknown, constraint: string): boolean {
  return !!error && typeof error === 'object' && (error as { code?: unknown }).code === '23505'
    && (error as { constraint?: unknown }).constraint === constraint;
}

export async function adminListAccounts(pool: Pool, input: AccountListInput): Promise<Page<AccountDto>> {
  const { page, pageSize, ...filter } = input;
  return withReadSnapshot(pool, async client => {
    const totalItems = await repository.adminCountAccounts(client, filter);
    const data = await repository.adminListAccounts(client, filter, pageSize, offsetOf(page, pageSize));
    return { data, meta: pageMeta(page, pageSize, totalItems) };
  });
}

export async function adminGetAccount(pool: Pool, ref: AccountRef): Promise<AccountDto> {
  const account = await withReadSnapshot(pool, client => repository.adminGetAccount(client, ref.actorKind, ref.accountId));
  if (!account) throw notFound();
  return account;
}

export async function adminListProfileCandidates(pool: Pool, input: CandidateListInput): Promise<Page<ProfileCandidateDto>> {
  return withReadSnapshot(pool, async client => {
    const totalItems = await repository.adminCountProfileCandidates(client, input.q);
    const data = await repository.adminListProfileCandidates(client, input.q, input.pageSize, offsetOf(input.page, input.pageSize));
    return { data, meta: pageMeta(input.page, input.pageSize, totalItems) };
  });
}

export async function adminCreateAccount(
  pool: Pool, identity: SessionIdentity, input: AccountCreateInput, deps: AdminServiceDeps = defaultDeps,
): Promise<AccountDto> {
  // Hash outside the global critical section; the plaintext is never stored, returned or logged.
  const passwordHash = await deps.hashPassword(input.password);
  return withBusinessTransaction(pool, identity, async (client, actor) => {
    assertAdmin(actor);
    if (input.accountType === 'STUDENT') {
      // Re-read under the lock; never trust an earlier candidates listing.
      const profile = await repository.adminFindProfileForAccount(client, input.studentId);
      if (!profile) throw notFound();
      if (profile.hasAccount) throw new AppError(409, 'ACCOUNT_ALREADY_EXISTS', 'Hồ sơ sinh viên đã có tài khoản.');
      try { return await repository.adminInsertStudentAccount(client, input.studentId, passwordHash); }
      catch (error) {
        if (isUniqueViolation(error, 'student_accounts_student_id_key')) throw new AppError(409, 'ACCOUNT_ALREADY_EXISTS', 'Hồ sơ sinh viên đã có tài khoản.');
        throw error;
      }
    }
    if (await repository.adminStaffUsernameExists(client, input.username)) {
      throw new AppError(409, 'DUPLICATE_USERNAME', 'Tên đăng nhập đã được sử dụng.');
    }
    try { return await repository.adminInsertStaffAccount(client, input.username, input.displayName, input.role, passwordHash); }
    catch (error) {
      if (isUniqueViolation(error, 'staff_accounts_username_key')) throw new AppError(409, 'DUPLICATE_USERNAME', 'Tên đăng nhập đã được sử dụng.');
      throw error;
    }
  });
}

export async function adminSetAccountLock(pool: Pool, identity: SessionIdentity, input: AccountRef & AccountLockInput): Promise<AccountDto> {
  return withBusinessTransaction(pool, identity, async (client, actor) => {
    assertAdmin(actor);
    const current = await repository.adminGetAccount(client, input.actorKind, input.accountId);
    if (!current) throw notFound();
    // Repeating the same value is a state conflict, not a silent 200 (contract: 409 INVALID_STATE).
    if (current.isLocked === input.isLocked) throw new AppError(409, 'INVALID_STATE', 'Điều kiện xử lý đã thay đổi. Vui lòng tải lại dữ liệu.');
    // Self-lock is allowed (Q-17/Q-27): no last-admin guard, no realtime logout.
    const updated = await repository.adminSetAccountLock(client, input.actorKind, input.accountId, input.isLocked);
    if (!updated) throw notFound();
    return updated;
  });
}
