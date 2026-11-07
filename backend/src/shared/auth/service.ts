import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import type { ActorKind, SessionIdentity } from './types.js';
import { AppError } from '../http/errors.js';
import { withBusinessTransaction } from '../db/transaction.js';
import * as repo from './repository.js';

export const passwordOptions = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1, hashLength: 64 } as const;
let dummyHash: Promise<string> | undefined;
const dummy = () => dummyHash ??= argon2.hash(randomBytes(32), passwordOptions);
export function identityDto(kind: ActorKind, account: repo.Credential) {
  return { actorKind: kind, accountId: account.id, role: account.role, identifier: account.identifier,
    displayName: account.display_name, studentId: account.student_id };
}
export async function login(pool: Pool, input: { accountType: ActorKind; identifier: string; password: string }) {
  const fallback = await dummy();
  // Credential verification is the login-specific pre-lock read allowed by SQL/04.
  // Expensive Argon2 work must not serialize every business writer.
  const candidate = await repo.findCredential(pool, input.accountType, input.identifier);
  const valid = await argon2.verify(candidate?.password_hash ?? fallback, input.password);
  if (!candidate || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Thông tin đăng nhập không đúng.');
  const client = await pool.connect();
  let begun = false;
  let destroy = false;
  try {
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED'); begun = true;
    await client.query('SELECT pg_advisory_xact_lock(724006, 1)');
    const account = await repo.findCredential(client, input.accountType, input.identifier);
    if (!account || account.password_hash !== candidate.password_hash) throw new AppError(401, 'INVALID_CREDENTIALS', 'Thông tin đăng nhập không đúng.');
    if (account.is_locked) throw new AppError(401, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa.');
    if (!(input.accountType === 'STUDENT' ? account.role === 'SV' : ['ADMIN', 'BQL'].includes(account.role))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Thông tin đăng nhập không đúng.');
    }
    await client.query('COMMIT'); begun = false;
    return account;
  } catch (error) {
    if (begun) { try { await client.query('ROLLBACK'); } catch { destroy = true; } }
    else destroy = true;
    throw error;
  } finally { client.release(destroy); }
}
export async function getCurrentIdentity(pool: Pool, identity: SessionIdentity) {
  const account = await repo.findCredential(pool, identity.actorKind, identity.accountId, true);
  if (!account) throw new AppError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
  return identityDto(identity.actorKind, account);
}
export async function changePassword(pool: Pool, identity: SessionIdentity, input: { currentPassword: string; newPassword: string }) {
  const hash = await argon2.hash(input.newPassword, passwordOptions);
  return withBusinessTransaction(pool, identity, async (client, actor) => {
    const account = await repo.findCredential(client, actor.actorKind, actor.accountId, true);
    if (!account || !await argon2.verify(account.password_hash, input.currentPassword)) {
      throw new AppError(422, 'PASSWORD_INCORRECT', 'Mật khẩu hiện tại không đúng.');
    }
    if (input.currentPassword === input.newPassword) throw new AppError(422, 'PASSWORD_UNCHANGED', 'Mật khẩu mới phải khác mật khẩu hiện tại.');
    return repo.updatePassword(client, actor.actorKind, actor.accountId, hash);
  });
}
/** Locked accounts can logout; expired/version-stale sessions need no lost token. */
export async function hasCurrentSession(pool: Pool, identity: SessionIdentity | undefined): Promise<boolean> {
  if (!identity || !['STUDENT', 'STAFF'].includes(identity.actorKind)
      || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(identity.accountId)
      || !Number.isInteger(identity.sessionVersion) || !Number.isFinite(identity.lastSeenAt)
      || identity.lastSeenAt > Date.now() || Date.now() - identity.lastSeenAt >= 1800000) return false;
  const account = await repo.findCredential(pool, identity.actorKind, identity.accountId, true);
  return !!account && account.session_version === identity.sessionVersion;
}
