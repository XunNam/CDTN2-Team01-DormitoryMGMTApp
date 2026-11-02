import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';
test('studentListBuildings: real PostgreSQL and real login',async t=>{
const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STUDENT',w.students[0].code);
const r=await browser.request('GET','/student/buildings');assert.equal(r.status,200);r.json.data.forEach((x:any)=>assertDto('Building',x));assert.ok(r.json.data.some((x:any)=>x.id===w.building.id));
assert.equal((await browser.request('GET','/student/buildings?page=1&page=2')).status,422);
const anonymous=w.browser();assert.equal((await anonymous.request('GET','/student/profile')).status,401);
const bql=w.browser();await bql.login('STAFF',w.bql.username);assert.equal((await bql.request('GET','/student/profile')).status,403);
});
