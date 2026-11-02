import assert from 'node:assert/strict';
import test from 'node:test';
import argon2 from 'argon2';
import { world,locked,assertDto,PASSWORD } from './harness.js';

test('Shared auth uses real PostgreSQL sessions for all roles, rotation, CSRF and password revocation',async t=>{
  const w=await world(); t.after(()=>w.close());
  const admin=w.browser(), bql=w.browser(), sv=w.browser();
  for(const [browser,kind,identifier,role] of [[admin,'STAFF',w.admin.username,'ADMIN'],[bql,'STAFF',w.bql.username,'BQL'],[sv,'STUDENT',w.students[0].code,'SV']] as const) {
    const anonymous=await browser.token(); const oldCookie=browser.cookie,oldToken=browser.csrf;
    assert.equal(anonymous.headers.get('cache-control'),'no-store'); assert.match(oldToken,/^[a-f0-9]{64}$/);
    const login=await browser.login(kind,identifier); assertDto('Identity',login.json.data); assert.equal(login.json.data.role,role);
    assert.notEqual(browser.cookie,oldCookie); assert.notEqual(browser.csrf,oldToken);
    assert.equal((await browser.request('POST','/auth/logout',{}, {'X-CSRF-Token':oldToken})).status,403);
    assert.equal((await browser.request('GET','/auth/me?extra=1')).status,422);
    const me=await browser.request('GET','/auth/me'); assert.equal(me.status,200); assertDto('Identity',me.json.data);
  }
  const denied=await admin.request('POST','/auth/login',{accountType:'STAFF',identifier:w.bql.username,password:'wrong-password'});
  assert.equal(denied.json.error.code,'INVALID_CREDENTIALS');
  assert.equal((await admin.request('GET','/auth/me')).json.data.role,'ADMIN','failed login preserves existing identity');
  for(const body of [{accountType:'STAFF',identifier:w.students[0].code,password:PASSWORD},
    {accountType:'STUDENT',identifier:'MISSING',password:PASSWORD}]) assert.equal((await sv.request('POST','/auth/login',body)).status,401);
  assert.equal((await sv.request('POST','/auth/login',{accountType:'STUDENT',identifier:w.students[0].code,password:PASSWORD,role:'ADMIN'})).status,422);
  assert.equal((await sv.request('POST','/auth/logout',{}, {Origin:'http://wrong.test'})).status,403);
  const second=w.browser(); await second.login('STUDENT',w.students[0].code);
  assert.equal((await sv.request('POST','/auth/change-password',{currentPassword:'wrong-password',newPassword:'Changed#2026'})).json.error.code,'PASSWORD_INCORRECT');
  assert.equal((await sv.request('POST','/auth/change-password',{currentPassword:PASSWORD,newPassword:PASSWORD})).json.error.code,'PASSWORD_UNCHANGED');
  const cookie=sv.cookie,csrf=sv.csrf;
  const changed=await sv.request('POST','/auth/change-password',{currentPassword:PASSWORD,newPassword:'Changed#2026'});
  assert.equal(changed.status,204); assert.equal(changed.text,''); assert.notEqual(sv.cookie,cookie);
  assert.equal((await second.request('GET','/auth/me')).json.error.code,'SESSION_EXPIRED');
  assert.equal((await sv.request('POST','/auth/logout',{}, {'X-CSRF-Token':csrf})).status,403);
  await sv.token(); assert.equal((await sv.request('GET','/auth/me')).status,200);
  const fresh=w.browser(); await fresh.token();
  assert.equal((await fresh.request('POST','/auth/login',{accountType:'STUDENT',identifier:w.students[0].code,password:PASSWORD})).status,401);
  await fresh.login('STUDENT',w.students[0].code,'Changed#2026');
  await locked(w.pool,c=>c.query('UPDATE student_accounts SET is_locked=true WHERE id=$1',[w.students[0].accountId]));
  assert.equal((await fresh.request('GET','/auth/me')).json.error.code,'ACCOUNT_LOCKED');
  assert.equal((await fresh.request('POST','/auth/logout',{})).status,204,'locked account may leave session');
  assert.equal((await fresh.request('POST','/auth/logout',{}, {'X-CSRF-Token':''})).status,204);
  assert.equal((await fresh.request('GET','/auth/me')).status,401);
  await fresh.token();
  assert.equal((await fresh.request('POST','/auth/login',{accountType:'STUDENT',identifier:w.students[0].code,password:'Changed#2026'})).json.error.code,'ACCOUNT_LOCKED');
});

test('GET csrf preserves live idle timestamp and replaces expired sessions without reviving login',async t=>{
  const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STAFF',w.bql.username);
  const find=async()=> (await w.pool.query("SELECT sid,sess FROM sessions WHERE sess->'identity'->>'accountId'=$1",[w.bql.id])).rows[0];
  const before=await find();await browser.token();const after=await find();
  assert.equal(after.sess.identity.lastSeenAt,before.sess.identity.lastSeenAt);
  await w.pool.query("UPDATE sessions SET sess=jsonb_set(sess::jsonb,'{identity,lastSeenAt}',to_jsonb($2::bigint))::json WHERE sid=$1",[before.sid,Date.now()-1800001]);
  const oldCookie=browser.cookie;await browser.token();assert.notEqual(browser.cookie,oldCookie);
  assert.equal((await browser.request('GET','/auth/me')).status,401);
});

test('Login rejects a credential changed while waiting for the common database lock',async t=>{
  const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.token();
  const hash=await argon2.hash('ChangedDuringLogin#2026',{type:argon2.argon2id,memoryCost:65536,timeCost:3,parallelism:1});
  const gate=await w.pool.connect();
  await gate.query('BEGIN ISOLATION LEVEL READ COMMITTED');await gate.query('SELECT pg_advisory_xact_lock(724006,1)');
  const request=browser.request('POST','/auth/login',{accountType:'STAFF',identifier:w.bql.username,password:PASSWORD});
  try {
    let waiting=false;
    for(let n=0;n<100;n++) {
      waiting=!!(await gate.query("SELECT 1 FROM pg_locks WHERE locktype='advisory' AND classid=724006 AND objid=1 AND NOT granted")).rowCount;
      if(waiting) break;await new Promise(r=>setTimeout(r,25));
    }
    assert.ok(waiting,'login must have verified then be waiting for its fresh credential re-read');
    await gate.query('UPDATE staff_accounts SET password_hash=$2,session_version=session_version+1 WHERE id=$1',[w.bql.id,hash]);
    await gate.query('COMMIT');
    const r=await request;assert.equal(r.status,401);assert.equal(r.json.error.code,'INVALID_CREDENTIALS');
    assert.equal((await browser.request('GET','/auth/me')).status,401);
  } catch(e) {await gate.query('ROLLBACK');await request;throw e;} finally {gate.release();}
});
