import type { RequestHandler } from 'express';
import type { Pool, PoolClient } from 'pg';
import type { Actor, Role, SessionIdentity } from './types.js';
import { AppError } from '../http/errors.js';

const IDLE_MS = 30 * 60 * 1000;
type AuthDb = Pick<Pool | PoolClient, 'query'>;
interface AccountRow { id: string; role: string; is_locked: boolean; session_version: number; student_id?: string }

/** Fresh account lookup: never authorize from cached role in a session or request body. */
export async function resolveActor(db: AuthDb, identity: SessionIdentity | undefined, now = Date.now()): Promise<Actor> {
  if (!identity) throw new AppError(401, 'AUTH_REQUIRED', 'Cần đăng nhập.');
  if (!['STUDENT', 'STAFF'].includes(identity.actorKind)
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity.accountId)
      || !Number.isInteger(identity.sessionVersion) || identity.sessionVersion < 1
      || !Number.isFinite(identity.lastSeenAt) || identity.lastSeenAt > now
      || now - identity.lastSeenAt >= IDLE_MS) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }
  const query = identity.actorKind === 'STUDENT'
    ? 'SELECT id, role, is_locked, session_version, student_id FROM student_accounts WHERE id = $1'
    : 'SELECT id, role, is_locked, session_version FROM staff_accounts WHERE id = $1';
  const { rows } = await db.query<AccountRow>(query, [identity.accountId]);
  const row = rows[0];
  const roleValid = identity.actorKind === 'STUDENT' ? row?.role === 'SV' : ['BQL', 'ADMIN'].includes(row?.role ?? '');
  if (row?.is_locked) throw new AppError(401, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa.');
  if (!row || row.session_version !== identity.sessionVersion || !roleValid) {
    throw new AppError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
  }
  return { actorKind: identity.actorKind, accountId: row.id, role: row.role as Role,
    ...(identity.actorKind === 'STUDENT' ? { studentId: row.student_id } : {}), sessionVersion: row.session_version };
}

export function requireActor(db: AuthDb): RequestHandler {
  return async (req, res, next) => {
    try {
      res.locals.actor = await resolveActor(db, req.session.identity);
      req.session.identity!.lastSeenAt = Date.now();
      req.session.touch();
      next();
    } catch (error) { next(error); }
  };
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    if (!res.locals.actor) { next(new AppError(401, 'AUTH_REQUIRED', 'Cần đăng nhập.')); return; }
    if (!roles.includes(res.locals.actor.role)) { next(new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.')); return; }
    next();
  };
}
