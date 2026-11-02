import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';
test('studentListRooms: real PostgreSQL and real login',async t=>{
const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STUDENT',w.students[0].code);
const r=await browser.request('GET','/student/rooms?buildingId='+w.building.id+'&gender=MALE&hasAvailability=true');assert.equal(r.status,200);assert.equal(r.json.meta.totalItems,1);assertDto('Room',r.json.data[0]);assert.equal(r.json.data[0].availablePlaces,1);assert.equal(r.json.data[0].feeVnd,'1000000');
assert.equal((await browser.request('GET','/student/rooms?hasAvailability=false&buildingId='+w.building.id)).json.data.length,0);
assert.equal((await browser.request('GET','/student/rooms?status=INACTIVE')).status,422);
const anonymous=w.browser();assert.equal((await anonymous.request('GET','/student/profile')).status,401);
const bql=w.browser();await bql.login('STAFF',w.bql.username);assert.equal((await bql.request('GET','/student/profile')).status,403);
});
