import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';
test('studentGetPeriod: real PostgreSQL and real login',async t=>{
const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STUDENT',w.students[0].code);
const r=await browser.request('GET','/student/registration-period');assert.equal(r.status,200);assertDto('RegistrationPeriod',r.json.data);assert.equal(r.json.data.status,'OPEN');
assert.equal((await browser.request('GET','/student/registration-period?status=OPEN')).status,422);
const anonymous=w.browser();assert.equal((await anonymous.request('GET','/student/profile')).status,401);
const bql=w.browser();await bql.login('STAFF',w.bql.username);assert.equal((await bql.request('GET','/student/profile')).status,403);
});
