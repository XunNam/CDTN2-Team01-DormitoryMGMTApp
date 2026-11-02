import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';
test('studentGetRoom: real PostgreSQL and real login',async t=>{
const w=await world();t.after(()=>w.close());const browser=w.browser();await browser.login('STUDENT',w.students[0].code);
const r=await browser.request('GET','/student/rooms/'+w.room.id);assert.equal(r.status,200);assertDto('Room',r.json.data);
await locked(w.pool,c=>c.query("UPDATE rooms SET status='INACTIVE' WHERE id=$1",[w.room.id]));
assert.equal((await browser.request('GET','/student/rooms/'+w.room.id)).status,404);
const anonymous=w.browser();assert.equal((await anonymous.request('GET','/student/profile')).status,401);
const bql=w.browser();await bql.login('STAFF',w.bql.username);assert.equal((await bql.request('GET','/student/profile')).status,403);
});
