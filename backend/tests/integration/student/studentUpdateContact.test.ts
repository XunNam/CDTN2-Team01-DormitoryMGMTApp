import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';
test('studentUpdateContact: real PostgreSQL and real login',async t=>{
const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STUDENT',w.students[0].code);
const r=await browser.request('PATCH','/student/profile',{phone:' 0900000000 ',email:null});assert.equal(r.status,200);assertDto('StudentProfile',r.json.data);
assert.equal((await w.pool.query('SELECT phone,email FROM student_profiles WHERE id=$1',[w.students[0].id])).rows[0].phone,'0900000000');
assert.equal((await browser.request('PATCH','/student/profile',{fullName:'Override'})).status,422);
assert.equal((await browser.request('PATCH','/student/profile',{phone:'123'})).status,422);
const anonymous=w.browser();assert.equal((await anonymous.request('GET','/student/profile')).status,401);
const bql=w.browser();await bql.login('STAFF',w.bql.username);assert.equal((await bql.request('GET','/student/profile')).status,403);
});
