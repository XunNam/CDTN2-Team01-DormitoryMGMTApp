// Integration helpers for the Student role (REAL PostgreSQL). NOT part of `npm test`.
// Run on Anh's machine: `npm run test:integration` (runner maps TEST_DATABASE_URL -> DATABASE_URL).
//
// What is real: PostgreSQL schema/triggers/view, the pool, createApp (guard, role, CSRF/Origin, routers),
// every SQL statement of the Student role. What is a test fixture: the session row is written straight into
// an in-memory store with a signed cookie, because Shared login (AUTH-01) is not implemented yet.
// That is NOT evidence that login works.
//
// Fixtures: every business row is written through the same protocol as the app
// (BEGIN READ COMMITTED -> pg_advisory_xact_lock(724006,1) -> writes -> COMMIT). Codes carry a unique per-run
// suffix, so the files can run on one shared test DB and be re-run. History tables reject DELETE by design,
// so there is no cleanup: use a disposable DB (SQL/README.md) and re-create it between full runs.
import { createHmac, randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import session from 'express-session';
import type { Pool, PoolClient } from 'pg';
import { createApp } from '../../../src/app.js';
import { createPool } from '../../../src/shared/db/pool.js';

export const ORIGIN = 'http://localhost:3000';
export const SECRET = 'i'.repeat(40);
export const CSRF = 'd'.repeat(64);
const HASH = '$argon2id$fixture-not-for-login';
export const SFX = (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)).toUpperCase().replace(/[^A-Z0-9]/g, '');

export function openPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is missing. Run through `npm run test:integration` with TEST_DATABASE_URL set.');
  return createPool(url);
}

/** Same protocol as withBusinessTransaction, for fixtures only. */
export async function locked<T>(pool: Pool, work: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    await c.query('SELECT pg_advisory_xact_lock(724006, 1)');
    const result = await work(c);
    await c.query('COMMIT');
    return result;
  } catch (error) { await c.query('ROLLBACK').catch(() => undefined); throw error; } finally { c.release(); }
}

export interface Student { profileId: string; accountId: string | null; code: string }
export interface World {
  pool: Pool;
  bqlId: string;
  buildingMain: { id: string; code: string; name: string };
  buildingFull: { id: string; code: string };
  buildingInactiveOnly: { id: string; code: string };
  /** capacity 6, MALE, 2 ALLOCATED + 3 CHECKED_IN => allocated 5, available 1 (TC-03.1) */
  roomBusy: { id: string; code: string };
  /** capacity 4, FEMALE, empty */
  roomEmptyFemale: { id: string; code: string };
  /** underscore in code, capacity 2 MALE, empty */
  roomUnderscore: { id: string; code: string };
  /** similar code without underscore (proves `_` in q is literal) */
  roomLookalike: { id: string; code: string };
  /** capacity 1 MALE, fully allocated, in buildingFull */
  roomFull: { id: string; code: string };
  /** INACTIVE room, in buildingMain */
  roomInactive: { id: string; code: string };
  studentA: Student;   // MALE, has account, phone+email+dateOfBirth
  studentB: Student;   // FEMALE, has account
  studentLocked: Student; // account locked at creation
}

async function insertStudent(c: PoolClient, code: string, gender: 'MALE' | 'FEMALE', extra: { phone?: string; email?: string; dob?: string; account?: 'ok' | 'locked' | null } = {}): Promise<Student> {
  const profileId = randomUUID();
  await c.query(
    `INSERT INTO student_profiles(id, student_code, full_name, gender, class_name, faculty, phone, email, date_of_birth)
     VALUES ($1,$2,$3,$4,'IT-K29','CNTT',$5,$6,$7)`,
    [profileId, code, `Sinh viên ${code}`, gender, extra.phone ?? null, extra.email ?? null, extra.dob ?? null]);
  let accountId: string | null = null;
  if (extra.account) {
    accountId = randomUUID();
    await c.query('INSERT INTO student_accounts(id, student_id, password_hash, is_locked) VALUES ($1,$2,$3,$4)',
      [accountId, profileId, HASH, extra.account === 'locked']);
  }
  return { profileId, accountId, code };
}

async function allocate(c: PoolClient, bqlId: string, studentId: string, roomId: string, checkIn: boolean): Promise<void> {
  const applicationId = randomUUID();
  await c.query('INSERT INTO applications(id, student_id, preferred_room_id) VALUES ($1,$2,$3)', [applicationId, studentId, roomId]);
  await c.query(`UPDATE applications SET status='APPROVED', reviewed_by=$2 WHERE id=$1`, [applicationId, bqlId]);
  const residenceId = randomUUID();
  await c.query('INSERT INTO residence_records(id, application_id, student_id, room_id, allocated_by) VALUES ($1,$2,$3,$4,$5)',
    [residenceId, applicationId, studentId, roomId, bqlId]);
  if (checkIn) {
    await c.query(
      `UPDATE residence_records SET status='CHECKED_IN', check_in_date=(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
         checked_in_by=$2 WHERE id=$1`, [residenceId, bqlId]);
  }
}

export async function buildWorld(pool: Pool): Promise<World> {
  return locked(pool, async c => {
    const bqlId = randomUUID();
    await c.query(`INSERT INTO staff_accounts(id, username, display_name, role, password_hash) VALUES ($1,$2,'IT BQL','BQL',$3)`,
      [bqlId, `it.bql.${SFX.toLowerCase()}`, HASH]);
    // Applications can only be created while the period is OPEN (guard_application).
    const period = await c.query<{ status: string }>('SELECT status FROM registration_period WHERE id = 1');
    if (period.rows[0].status !== 'OPEN') await c.query(`UPDATE registration_period SET status='OPEN', updated_by=$1 WHERE id=1`, [bqlId]);

    const mkBuilding = async (suffix: string, name: string) => {
      const id = randomUUID(); const code = `IT${SFX}${suffix}`;
      await c.query('INSERT INTO buildings(id, code, name) VALUES ($1,$2,$3)', [id, code, name]);
      return { id, code, name };
    };
    const mkRoom = async (buildingId: string, code: string, capacity: number, gender: 'MALE' | 'FEMALE', fee: string, status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE') => {
      const id = randomUUID();
      await c.query('INSERT INTO rooms(id, building_id, code, capacity, gender, fee_vnd, status) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [id, buildingId, code, capacity, gender, fee, status]);
      return { id, code };
    };
    const buildingMain = await mkBuilding('M', `Tòa chính ${SFX}`);
    const buildingFull = await mkBuilding('F', `Tòa đầy ${SFX}`);
    const buildingInactiveOnly = await mkBuilding('X', `Tòa ngừng ${SFX}`);

    const roomBusy = await mkRoom(buildingMain.id, `B${SFX}101`, 6, 'MALE', '1000000');
    const roomEmptyFemale = await mkRoom(buildingMain.id, `B${SFX}201`, 4, 'FEMALE', '9223372036854775807');
    const roomUnderscore = await mkRoom(buildingMain.id, `U${SFX}_301`, 2, 'MALE', '0');
    const roomLookalike = await mkRoom(buildingMain.id, `U${SFX}X301`, 2, 'MALE', '500000');
    const roomInactive = await mkRoom(buildingMain.id, `Z${SFX}999`, 2, 'MALE', '700000', 'INACTIVE');
    const roomFull = await mkRoom(buildingFull.id, `F${SFX}001`, 1, 'MALE', '800000');
    await mkRoom(buildingInactiveOnly.id, `I${SFX}001`, 3, 'MALE', '600000', 'INACTIVE');

    for (let i = 1; i <= 5; i += 1) {
      const occupant = await insertStudent(c, `ITO${SFX}${i}`, 'MALE');
      await allocate(c, bqlId, occupant.profileId, roomBusy.id, i > 2); // 2 ALLOCATED, 3 CHECKED_IN
    }
    const fullOccupant = await insertStudent(c, `ITF${SFX}`, 'MALE');
    await allocate(c, bqlId, fullOccupant.profileId, roomFull.id, false);

    const studentA = await insertStudent(c, `ITA${SFX}`, 'MALE', { phone: '0900000001', email: 'a.demo@example.test', dob: '2005-03-09', account: 'ok' });
    const studentB = await insertStudent(c, `ITB${SFX}`, 'FEMALE', { phone: '0900000002', account: 'ok' });
    const studentLocked = await insertStudent(c, `ITL${SFX}`, 'MALE', { account: 'locked' });
    return { pool, bqlId, buildingMain, buildingFull, buildingInactiveOnly, roomBusy, roomEmptyFemale, roomUnderscore,
      roomLookalike, roomFull, roomInactive, studentA, studentB, studentLocked };
  });
}

export interface Harness { base: string; cookieFor: (s: Student) => Promise<string>; close: () => Promise<void> }

export async function startServer(pool: Pool): Promise<Harness> {
  const store = new session.MemoryStore();
  const app = createApp({ pool, sessionSecret: SECRET, appOrigin: ORIGIN, secureCookies: false, sessionStore: store });
  app.locals.pool = pool; // same one-line wiring requested from the Shared owner
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    base: `http://127.0.0.1:${port}`,
    cookieFor: async (s: Student) => {
      if (!s.accountId) throw new Error('student has no account');
      const sid = `it-${randomUUID()}`;
      await new Promise<void>((resolve, reject) => store.set(sid, {
        cookie: { originalMaxAge: 1800000, expires: new Date(Date.now() + 1800000), httpOnly: true, secure: false, sameSite: 'lax' },
        identity: { actorKind: 'STUDENT', accountId: s.accountId!, sessionVersion: 1, lastSeenAt: Date.now() },
        csrfToken: CSRF,
      } as session.SessionData, e => e ? reject(e) : resolve()));
      const sig = createHmac('sha256', SECRET).update(sid).digest('base64').replace(/=+$/, '');
      return `dormflow.sid=${encodeURIComponent(`s:${sid}.${sig}`)}`;
    },
    close: () => new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve())),
  };
}

export interface Reply { status: number; body: any }
export async function api(h: Harness, cookie: string | null, path: string, init: { method?: string; body?: unknown } = {}): Promise<Reply> {
  const headers: Record<string, string> = {};
  if (cookie) headers.Cookie = cookie;
  if (init.method && init.method !== 'GET') { headers['Content-Type'] = 'application/json'; headers.Origin = ORIGIN; headers['X-CSRF-Token'] = CSRF; }
  const res = await fetch(`${h.base}/api/v1/student${path}`, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  return { status: res.status, body: await res.json() };
}

/** Collect every page of a list endpoint (pageSize small) for stable-sort / no-dup / no-gap checks. */
export async function allPages(h: Harness, cookie: string, path: string, pageSize: number): Promise<{ items: any[]; totalItems: number }> {
  const items: any[] = [];
  let totalItems = 0;
  for (let page = 1; page < 500; page += 1) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await api(h, cookie, `${path}${sep}page=${page}&pageSize=${pageSize}`);
    if (res.status !== 200) throw new Error(`page ${page} => ${res.status}`);
    totalItems = res.body.meta.totalItems;
    items.push(...res.body.data);
    if (page >= res.body.meta.totalPages) break;
  }
  return { items, totalItems };
}
