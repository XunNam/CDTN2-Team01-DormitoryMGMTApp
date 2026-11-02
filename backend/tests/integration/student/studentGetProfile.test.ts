import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';
test('studentGetProfile: real PostgreSQL and real login',async t=>{
const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STUDENT',w.students[0].code);
const r=await browser.request('GET','/student/profile'); assert.equal(r.status,200);assertDto('StudentProfile',r.json.data);assert.equal(r.json.data.id,w.students[0].id);assert.equal(r.json.data.dateOfBirth,'2005-03-09');
const stored=(await w.pool.query<{created_at:Date;updated_at:Date}>('SELECT created_at,updated_at FROM student_profiles WHERE id=$1',[w.students[0].id])).rows[0];
assert.equal(r.json.data.createdAt,stored.created_at.toISOString());
assert.equal(r.json.data.updatedAt,stored.updated_at.toISOString());
assert.equal((await browser.request('GET','/student/profile?studentId='+w.students[1].id)).status,422);
const anonymous=w.browser();assert.equal((await anonymous.request('GET','/student/profile')).status,401);
const bql=w.browser();await bql.login('STAFF',w.bql.username);assert.equal((await bql.request('GET','/student/profile')).status,403);
});
