import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,assertDto } from '../shared/harness.js';

test('Student submission, ownership, history and receipts use PostgreSQL and authenticated HTTP',async t=>{
  const w=await world();t.after(()=>w.close());const a=w.browser(),b=w.browser();
  await a.login('STUDENT',w.students[0].code);await b.login('STUDENT',w.students[1].code);
  const create=()=>a.request('POST','/student/applications',{preferredRoomId:w.room.id});
  assert.equal((await a.request('POST','/student/applications',{preferredRoomId:w.room.id,studentId:w.students[1].id})).status,422);
  await locked(w.pool,c=>c.query("UPDATE registration_period SET status='CLOSED',updated_by=$1 WHERE id=1",[w.bql.id]));
  assert.equal((await create()).json.error.code,'PERIOD_CLOSED');
  await locked(w.pool,c=>c.query("UPDATE registration_period SET status='OPEN',updated_by=$1 WHERE id=1",[w.bql.id]));
  const race=await Promise.all([create(),create()]);assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
  assert.equal(race.find(r=>r.status===409)!.json.error.code,'PENDING_APPLICATION_EXISTS');
  const application=race.find(r=>r.status===201)!.json.data;assertDto('Application',application);
  assert.equal(application.studentId,w.students[0].id);
  assert.equal((await w.pool.query('SELECT available_places FROM room_availability WHERE id=$1',[w.room.id])).rows[0].available_places,1);
  assert.equal((await a.request('GET','/student/applications?status=PENDING')).json.meta.totalItems,1);
  assert.equal((await b.request('GET','/student/applications')).json.meta.totalItems,0);
  assert.equal((await a.request('GET','/student/applications/'+application.id)).status,200);
  assert.equal((await b.request('GET','/student/applications/'+application.id)).status,404);
  assert.equal((await a.request('GET','/student/applications?studentId='+w.students[1].id)).status,422);
  assert.equal((await a.request('GET','/student/applications?status=PENDING&status=APPROVED')).status,422);
  const residence=await locked(w.pool,async c=>{
    await c.query("UPDATE applications SET status='APPROVED',reviewed_by=$2 WHERE id=$1",[application.id,w.bql.id]);
    return (await c.query('INSERT INTO residence_records(application_id,student_id,room_id,allocated_by) VALUES($1,$2,$3,$4) RETURNING id',
      [application.id,w.students[0].id,w.room.id,w.bql.id])).rows[0];
  });
  assert.equal((await create()).json.error.code,'ACTIVE_RESIDENCE_EXISTS');
  const r=await a.request('GET','/student/residences/'+residence.id);assert.equal(r.status,200);assertDto('Residence',r.json.data);
  assert.equal((await b.request('GET','/student/residences/'+residence.id)).status,404);
  assert.equal((await a.request('GET','/student/residences?status=ALLOCATED')).json.meta.totalItems,1);
  const receipt=await locked(w.pool,async c=>{
    await c.query('UPDATE rooms SET fee_vnd=$2 WHERE id=$1',[w.room.id,'9223372036854775807']);
    return (await c.query('INSERT INTO room_fee_receipts(residence_id,created_by) VALUES($1,$2) RETURNING id',[residence.id,w.bql.id])).rows[0];
  });
  await locked(w.pool,c=>c.query('UPDATE rooms SET fee_vnd=0 WHERE id=$1',[w.room.id]));
  const fee=await a.request('GET','/student/receipts/'+receipt.id);assert.equal(fee.status,200);assertDto('Receipt',fee.json.data);
  assert.equal(fee.json.data.amountVnd,'9223372036854775807');assert.equal(fee.json.data.paymentDate,null);
  assert.equal((await b.request('GET','/student/receipts/'+receipt.id)).status,404);
  assert.equal((await b.request('GET','/student/receipts')).json.meta.totalItems,0);
  assert.equal((await a.request('GET','/student/receipts?status=UNPAID')).json.meta.totalItems,1);
  await locked(w.pool,c=>c.query("UPDATE residence_records SET status='CANCELLED',cancellation_reason='Không đến nhận',cancelled_by=$2 WHERE id=$1",[residence.id,w.bql.id]));
  assert.equal((await a.request('GET','/student/residences/'+residence.id)).json.data.status,'CANCELLED');
  assert.equal((await a.request('GET','/student/receipts/'+receipt.id)).json.data.status,'UNPAID');
  assert.equal((await a.request('GET','/student/receipts?page=999')).json.data.length,0);
  assert.equal((await w.pool.query('SELECT available_places FROM room_availability WHERE id=$1',[w.room.id])).rows[0].available_places,1);
});
