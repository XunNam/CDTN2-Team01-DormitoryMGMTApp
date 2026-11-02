import type { Pool, PoolClient } from 'pg';
import type { ActorKind, Role } from './types.js';

type Db = Pick<Pool | PoolClient, 'query'>;
export interface Credential {
  id: string; role: Role; identifier: string; display_name: string; student_id: string | null;
  password_hash: string; is_locked: boolean; session_version: number;
}
export async function findCredential(db: Db, kind: ActorKind, key: string, byId = false): Promise<Credential | undefined> {
  const sql = kind === 'STUDENT'
    ? `SELECT a.id, a.role, p.student_code AS identifier, p.full_name AS display_name,
        a.student_id, a.password_hash, a.is_locked, a.session_version
       FROM student_accounts a JOIN student_profiles p ON p.id=a.student_id WHERE ${byId ? 'a.id' : 'p.student_code'}=$1`
    : `SELECT id, role, username AS identifier, display_name, NULL::uuid AS student_id,
        password_hash, is_locked, session_version FROM staff_accounts WHERE ${byId ? 'id' : 'username'}=$1`;
  return (await db.query<Credential>(sql, [key])).rows[0];
}
export async function updatePassword(db: Db, kind: ActorKind, id: string, hash: string): Promise<number> {
  const table = kind === 'STUDENT' ? 'student_accounts' : 'staff_accounts';
  const result = await db.query<{ session_version: number }>(
    `UPDATE ${table} SET password_hash=$2, session_version=session_version+1 WHERE id=$1 RETURNING session_version`, [id, hash]);
  return result.rows[0]!.session_version;
}
