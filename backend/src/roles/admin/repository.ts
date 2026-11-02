// ADMIN role SQL. Parameterized queries only; every function receives the client owned by the service
// (transaction or read snapshot). Rows are mapped to Shared DTOs here; hashes never leave this file.
import type { PoolClient } from 'pg';
import type { ActorKind, Role } from '../../shared/auth/types.js';

type Db = Pick<PoolClient, 'query'>;

export interface AccountDto {
  id: string;
  actorKind: ActorKind;
  role: Role;
  identifier: string;
  displayName: string;
  studentId: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ProfileCandidateDto { id: string; studentCode: string; fullName: string; hasAccount: false }
export interface AccountFilter {
  q: string | null;
  actorKind: ActorKind | null;
  role: Role | null;
  isLocked: boolean | null;
}

interface AccountRow {
  id: string; actor_kind: ActorKind; role: Role; identifier: string; display_name: string;
  student_id: string | null; is_locked: boolean; created_at: Date; updated_at: Date;
}
interface CandidateRow { id: string; student_code: string; full_name: string }

const iso = (value: Date | string): string => new Date(value).toISOString();

function toAccount(row: AccountRow): AccountDto {
  return {
    id: row.id, actorKind: row.actor_kind, role: row.role, identifier: row.identifier,
    displayName: row.display_name, studentId: row.student_id, isLocked: row.is_locked,
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  };
}

/** `%` and `_` are literal in q (Shared conventions); `\` is the ESCAPE character. */
export function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, ch => `\\${ch}`)}%`;
}

// Both credential stores projected to the Account DTO shape. No password_hash / session_version.
const STUDENT_ACCOUNT_SELECT = `
  SELECT a.id, 'STUDENT'::text AS actor_kind, a.role, p.student_code AS identifier, p.full_name AS display_name,
         a.student_id, a.is_locked, a.created_at, a.updated_at
  FROM student_accounts a JOIN student_profiles p ON p.id = a.student_id`;
const STAFF_ACCOUNT_SELECT = `
  SELECT s.id, 'STAFF'::text AS actor_kind, s.role, s.username AS identifier, s.display_name,
         NULL::uuid AS student_id, s.is_locked, s.created_at, s.updated_at
  FROM staff_accounts s`;
const ACCOUNT_FILTER = `
  WITH accounts AS (${STUDENT_ACCOUNT_SELECT} UNION ALL ${STAFF_ACCOUNT_SELECT})
  SELECT %COLUMNS% FROM accounts
  WHERE ($1::text IS NULL OR actor_kind = $1)
    AND ($2::text IS NULL OR role = $2)
    AND ($3::boolean IS NULL OR is_locked = $3)
    AND ($4::text IS NULL OR identifier ILIKE $4 ESCAPE '\\' OR display_name ILIKE $4 ESCAPE '\\')`;

function accountFilterParams(filter: AccountFilter): unknown[] {
  return [filter.actorKind, filter.role, filter.isLocked, filter.q === null ? null : likePattern(filter.q)];
}

export async function adminCountAccounts(db: Db, filter: AccountFilter): Promise<number> {
  const { rows } = await db.query<{ total: string }>(ACCOUNT_FILTER.replace('%COLUMNS%', 'count(*) AS total'), accountFilterParams(filter));
  return Number(rows[0]?.total ?? 0);
}

export async function adminListAccounts(db: Db, filter: AccountFilter, limit: number, offset: string): Promise<AccountDto[]> {
  const sql = `${ACCOUNT_FILTER.replace('%COLUMNS%', '*')}
  ORDER BY created_at DESC, id ASC, actor_kind ASC
  LIMIT $5 OFFSET $6`;
  const { rows } = await db.query<AccountRow>(sql, [...accountFilterParams(filter), limit, offset]);
  return rows.map(toAccount);
}

export async function adminGetAccount(db: Db, actorKind: ActorKind, accountId: string): Promise<AccountDto | null> {
  // Read only the requested namespace; never fall back to the other store.
  const sql = actorKind === 'STUDENT' ? `${STUDENT_ACCOUNT_SELECT} WHERE a.id = $1` : `${STAFF_ACCOUNT_SELECT} WHERE s.id = $1`;
  const { rows } = await db.query<AccountRow>(sql, [accountId]);
  return rows[0] ? toAccount(rows[0]) : null;
}

export async function adminFindProfileForAccount(db: Db, studentId: string): Promise<{ id: string; hasAccount: boolean } | null> {
  const { rows } = await db.query<{ id: string; has_account: boolean }>(
    `SELECT p.id, EXISTS (SELECT 1 FROM student_accounts a WHERE a.student_id = p.id) AS has_account
     FROM student_profiles p WHERE p.id = $1`, [studentId]);
  return rows[0] ? { id: rows[0].id, hasAccount: rows[0].has_account } : null;
}

export async function adminStaffUsernameExists(db: Db, username: string): Promise<boolean> {
  const { rows } = await db.query('SELECT 1 FROM staff_accounts WHERE username = $1', [username]);
  return rows.length > 0;
}

export async function adminInsertStudentAccount(db: Db, studentId: string, passwordHash: string): Promise<AccountDto> {
  const { rows } = await db.query<AccountRow>(
    `WITH inserted AS (
       INSERT INTO student_accounts (student_id, role, password_hash) VALUES ($1, 'SV', $2)
       RETURNING id, role, student_id, is_locked, created_at, updated_at)
     SELECT i.id, 'STUDENT'::text AS actor_kind, i.role, p.student_code AS identifier, p.full_name AS display_name,
            i.student_id, i.is_locked, i.created_at, i.updated_at
     FROM inserted i JOIN student_profiles p ON p.id = i.student_id`, [studentId, passwordHash]);
  return toAccount(rows[0]);
}

export async function adminInsertStaffAccount(db: Db, username: string, displayName: string, role: 'BQL' | 'ADMIN', passwordHash: string): Promise<AccountDto> {
  const { rows } = await db.query<AccountRow>(
    `INSERT INTO staff_accounts (username, display_name, role, password_hash) VALUES ($1, $2, $3, $4)
     RETURNING id, 'STAFF'::text AS actor_kind, role, username AS identifier, display_name,
               NULL::uuid AS student_id, is_locked, created_at, updated_at`, [username, displayName, role, passwordHash]);
  return toAccount(rows[0]);
}

/** Only is_locked changes; updated_at is set by the preserve_identity trigger. */
export async function adminSetAccountLock(db: Db, actorKind: ActorKind, accountId: string, isLocked: boolean): Promise<AccountDto | null> {
  const table = actorKind === 'STUDENT' ? 'student_accounts' : 'staff_accounts';
  const { rowCount } = await db.query(`UPDATE ${table} SET is_locked = $2 WHERE id = $1`, [accountId, isLocked]);
  if (!rowCount) return null;
  return adminGetAccount(db, actorKind, accountId);
}

const CANDIDATE_FILTER = `
  FROM student_profiles p
  WHERE NOT EXISTS (SELECT 1 FROM student_accounts a WHERE a.student_id = p.id)
    AND ($1::text IS NULL OR p.student_code ILIKE $1 ESCAPE '\\' OR p.full_name ILIKE $1 ESCAPE '\\')`;

export async function adminCountProfileCandidates(db: Db, q: string | null): Promise<number> {
  const { rows } = await db.query<{ total: string }>(`SELECT count(*) AS total ${CANDIDATE_FILTER}`, [q === null ? null : likePattern(q)]);
  return Number(rows[0]?.total ?? 0);
}

export async function adminListProfileCandidates(db: Db, q: string | null, limit: number, offset: string): Promise<ProfileCandidateDto[]> {
  const { rows } = await db.query<CandidateRow>(
    `SELECT p.id, p.student_code, p.full_name ${CANDIDATE_FILTER}
     ORDER BY p.created_at DESC, p.id ASC LIMIT $2 OFFSET $3`, [q === null ? null : likePattern(q), limit, offset]);
  return rows.map(row => ({ id: row.id, studentCode: row.student_code, fullName: row.full_name, hasAccount: false as const }));
}
