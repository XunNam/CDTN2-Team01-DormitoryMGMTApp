import assert from 'node:assert/strict';
import test from 'node:test';
import { world,assertDto,locked,PASSWORD } from '../integration/shared/harness.js';
import type { Pool,PoolClient } from 'pg';

// A gate proves transactions really overlap on PostgreSQL, instead of just invoking
// two fast operations sequentially. The fixture owns the same lock as every writer.
async function compete<T>(pool:Pool,requests:Array<()=>Promise<T>>,beforeRelease?:(c:PoolClient)=>Promise<unknown>) {
  const gate=await pool.connect();const pending:Promise<T>[]=[];
  try {
    await gate.query('BEGIN ISOLATION LEVEL READ COMMITTED');await gate.query('SELECT pg_advisory_xact_lock(724006,1)');
    pending.push(...requests.map(work=>work()));
    let waiting=0;
    for(let n=0;n<100;n++) {
      waiting=Number((await gate.query("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=724006 AND objid=1 AND NOT granted")).rows[0].count);
      if(waiting>=requests.length) break;
      await new Promise(r=>setTimeout(r,25));
    }
    assert.ok(waiting>=requests.length,'all competing mutations must wait together on the real database lock');
    if(beforeRelease) await beforeRelease(gate);
    await gate.query('COMMIT');
    return await Promise.all(pending);
  } catch(e) {await gate.query('ROLLBACK');await Promise.allSettled(pending);throw e;} finally {gate.release();}
}

test('All three roles: complete business HTTP flow, ownership, retries and gated PostgreSQL races',async t=>{
  const w=await world();t.after(()=>w.close());
  const admin=w.browser(),manager=w.browser(),student=w.browser(),other=w.browser();
  await admin.login('STAFF',w.admin.username);await manager.login('STAFF',w.bql.username);
  type Browser=ReturnType<typeof w.browser>;
  const call=async(browser:Browser,method:string,path:string,body:unknown=undefined,status=200,schema?:string)=>{
    const r=await browser.request(method,path,body);assert.equal(r.status,status,`${method} ${path}: ${r.text}`);
    if(schema) assertDto(schema,r.json.data);return r.json?.data;
  };
  const error=async(browser:Browser,method:string,path:string,body:unknown,status:number,code:string)=>{
    const r=await browser.request(method,path,body);assert.equal(r.status,status,`${method} ${path}: ${r.text}`);assert.equal(r.json.error.code,code);
  };
  const profile=await call(manager,'POST','/management/student-profiles',{
    studentCode:w.tag.toUpperCase()+'NEW',fullName:'Sinh viên qua HTTP',gender:'MALE',className:'TEST',faculty:'TEST'},201,'StudentProfile');
  await call(manager,'GET','/management/student-profiles/'+profile.id,undefined,200,'StudentProfile');
  await call(manager,'PATCH','/management/student-profiles/'+profile.id,{phone:'0900000000'},200,'StudentProfile');
  await call(manager,'GET','/management/student-profiles?q='+profile.studentCode);
  const candidates=await call(admin,'GET','/admin/student-profiles/candidates?q='+profile.studentCode);
  assert.ok(candidates.some((x:any)=>x.id===profile.id));candidates.forEach((x:any)=>assertDto('ProfileCandidate',x));
  const account=await call(admin,'POST','/admin/accounts',{accountType:'STUDENT',studentId:profile.id,role:'SV',password:PASSWORD},201,'Account');
  await error(admin,'POST','/admin/accounts',{accountType:'STUDENT',studentId:profile.id,role:'SV',password:PASSWORD},409,'ACCOUNT_ALREADY_EXISTS');
  await student.login('STUDENT',profile.studentCode);await other.login('STUDENT',w.students[0].code);
  await call(admin,'GET','/admin/accounts/STUDENT/'+account.id,undefined,200,'Account');
  await call(admin,'GET','/admin/accounts?role=SV');
  const staff=await call(admin,'POST','/admin/accounts',{accountType:'STAFF',username:w.tag+'.created',displayName:'BQL được cấp',role:'BQL',password:PASSWORD},201,'Account');
  const createdManager=w.browser();await createdManager.login('STAFF',staff.identifier);
  await call(admin,'PATCH','/admin/accounts/STAFF/'+staff.id+'/lock',{isLocked:true},200,'Account');
  await error(createdManager,'GET','/auth/me',undefined,401,'ACCOUNT_LOCKED');
  await call(admin,'PATCH','/admin/accounts/STAFF/'+staff.id+'/lock',{isLocked:false},200,'Account');
  await call(createdManager,'GET','/auth/me',undefined,200,'Identity');
  await error(admin,'GET','/management/rooms',undefined,403,'FORBIDDEN');
  await error(manager,'POST','/admin/accounts',{accountType:'STAFF',username:'forbidden',displayName:'Forbidden',role:'ADMIN',password:PASSWORD},403,'FORBIDDEN');
  await error(student,'GET','/admin/accounts',undefined,403,'FORBIDDEN');

  const building=await call(manager,'POST','/management/buildings',{code:w.tag+'z',name:'Tòa liên phần'},201,'Building');
  await call(manager,'GET','/management/buildings/'+building.id,undefined,200,'Building');
  await call(manager,'PATCH','/management/buildings/'+building.id,{name:'Tòa liên phần cập nhật'},200,'Building');
  await call(manager,'GET','/management/buildings?q='+building.code);
  const room=await call(manager,'POST','/management/rooms',{buildingId:building.id,code:'r1',capacity:1,gender:'MALE',feeVnd:'9007199254740993',status:'ACTIVE'},201,'Room');
  await call(manager,'GET','/management/rooms/'+room.id,undefined,200,'Room');
  await call(manager,'GET','/management/rooms?buildingId='+building.id+'&hasAvailability=true');
  await call(manager,'PATCH','/management/rooms/'+room.id,{feeVnd:'9223372036854775807'},200,'Room');
  await call(manager,'GET','/management/registration-period',undefined,200,'RegistrationPeriod');
  for(const path of ['/student/profile','/student/rooms/'+room.id,'/student/registration-period']) await call(student,'GET',path);
  await call(student,'PATCH','/student/profile',{email:'review@example.test'},200,'StudentProfile');
  await call(student,'GET','/student/buildings');await call(student,'GET','/student/rooms?buildingId='+building.id);
  const submissions=await compete(w.pool,[()=>student.request('POST','/student/applications',{preferredRoomId:room.id}),()=>student.request('POST','/student/applications',{preferredRoomId:room.id})]);
  assert.deepEqual(submissions.map(r=>r.status).sort(),[201,409]);
  assert.equal(submissions.find(r=>r.status===409)!.json.error.code,'PENDING_APPLICATION_EXISTS');
  const application=submissions.find(r=>r.status===201)!.json.data;assertDto('Application',application);
  const otherApplication=await call(other,'POST','/student/applications',{preferredRoomId:room.id},201,'Application');
  assert.equal((await call(student,'GET','/student/rooms/'+room.id)).availablePlaces,1,'submission does not reserve a place');
  await call(student,'GET','/student/applications');await call(student,'GET','/student/applications/'+application.id,undefined,200,'Application');
  await error(other,'GET','/student/applications/'+application.id,undefined,404,'NOT_FOUND');
  await call(manager,'GET','/management/applications?preferredRoomId='+room.id);
  await call(manager,'GET','/management/applications/'+application.id,undefined,200,'Application');
  await call(manager,'PATCH','/management/registration-period',{status:'CLOSED'},200,'RegistrationPeriod');
  const approvals=await compete(w.pool,[application,otherApplication].map(x=>()=>manager.request('POST','/management/applications/'+x.id+'/approve',{roomId:room.id})));
  assert.deepEqual(approvals.map(r=>r.status).sort(),[200,409]);
  assert.equal(approvals.find(r=>r.status===409)!.json.error.code,'ROOM_FULL');
  const winner=approvals.find(r=>r.status===200)!.json.data;
  assertDto('Application',winner.application);assertDto('Residence',winner.residence);
  const owner=winner.application.studentId===profile.id?student:other;
  const outsider=owner===student?other:student;
  const loser=winner.application.id===application.id?otherApplication:application;
  const residenceId=winner.residence.id;
  await call(manager,'GET','/management/residences?roomId='+room.id);await call(manager,'GET','/management/residences/'+residenceId,undefined,200,'Residence');
  await call(owner,'GET','/student/residences');await call(owner,'GET','/student/residences/'+residenceId,undefined,200,'Residence');
  await error(outsider,'GET','/student/residences/'+residenceId,undefined,404,'NOT_FOUND');
  await error(manager,'PATCH','/management/rooms/'+room.id,{status:'INACTIVE'},409,'ROOM_OCCUPIED');
  await error(manager,'PATCH','/management/rooms/'+room.id,{gender:'FEMALE'},409,'GENDER_MISMATCH');
  const fees=await compete(w.pool,[()=>manager.request('POST','/management/receipts',{residenceId}),()=>manager.request('POST','/management/receipts',{residenceId})]);
  assert.deepEqual(fees.map(r=>r.status).sort(),[201,409]);assert.equal(fees.find(r=>r.status===409)!.json.error.code,'RECEIPT_ALREADY_EXISTS');
  const receipt=fees.find(r=>r.status===201)!.json.data;assertDto('Receipt',receipt);
  await call(manager,'PATCH','/management/rooms/'+room.id,{feeVnd:'0'});
  assert.equal((await call(manager,'GET','/management/receipts/'+receipt.id)).amountVnd,'9223372036854775807');
  await call(manager,'GET','/management/receipts?residenceId='+residenceId);
  await call(owner,'GET','/student/receipts');await call(owner,'GET','/student/receipts/'+receipt.id,undefined,200,'Receipt');
  await error(outsider,'GET','/student/receipts/'+receipt.id,undefined,404,'NOT_FOUND');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const checkins=await compete(w.pool,[()=>manager.request('POST',`/management/residences/${residenceId}/check-in`,{checkInDate:today}),()=>manager.request('POST',`/management/residences/${residenceId}/check-in`,{checkInDate:today})]);
  assert.deepEqual(checkins.map(r=>r.status).sort(),[200,409]);
  assert.equal((await call(manager,'GET','/management/rooms/'+room.id)).availablePlaces,0,'check-in does not deduct a second place');
  await error(manager,'POST',`/management/residences/${residenceId}/cancel`,{reason:'Không hợp lệ'},409,'INVALID_STATE');
  const past=new Date(new Date(today+'T00:00:00Z').getTime()-86400000).toISOString().slice(0,10);
  await error(manager,'POST',`/management/residences/${residenceId}/check-out`,{checkOutDate:past},422,'VALIDATION_ERROR');
  await call(manager,'POST',`/management/residences/${residenceId}/check-out`,{checkOutDate:today},200,'Residence');
  assert.equal((await call(owner,'GET','/student/receipts/'+receipt.id)).status,'UNPAID','debt does not block checkout or disappear');
  assert.equal((await call(owner,'GET','/student/residences/'+residenceId)).status,'ENDED');
  assert.equal((await call(manager,'GET','/management/rooms/'+room.id)).availablePlaces,1);
  await error(manager,'POST',`/management/residences/${residenceId}/check-out`,{checkOutDate:today},409,'INVALID_STATE');
  const payments=await compete(w.pool,[()=>manager.request('POST',`/management/receipts/${receipt.id}/pay`,{paymentDate:today}),()=>manager.request('POST',`/management/receipts/${receipt.id}/pay`,{paymentDate:today})]);
  assert.deepEqual(payments.map(r=>r.status).sort(),[200,409]);
  await call(manager,'POST','/management/applications/'+loser.id+'/reject',{reason:'Từ chối có lý do'},200,'Application');
  await call(manager,'PATCH','/management/registration-period',{status:'OPEN'},200,'RegistrationPeriod');
  const resubmitted=await call(outsider,'POST','/student/applications',{preferredRoomId:room.id},201,'Application');
  const allocated=await call(manager,'POST','/management/applications/'+resubmitted.id+'/approve',{roomId:room.id});
  const zero=await call(manager,'POST','/management/receipts',{residenceId:allocated.residence.id},201,'Receipt');
  assert.equal(zero.amountVnd,'0');assert.equal(zero.status,'UNPAID');
  await call(manager,'POST',`/management/residences/${allocated.residence.id}/cancel`,{reason:'Không đến nhận phòng'},200,'Residence');
  await error(manager,'POST',`/management/residences/${allocated.residence.id}/cancel`,{reason:'Lặp'},409,'INVALID_STATE');
  assert.equal((await call(outsider,'GET','/student/receipts/'+zero.id)).status,'UNPAID');
  const statistics=await call(manager,'GET','/management/statistics',undefined,200,'Statistics');
  const expected=(await w.pool.query(`SELECT (SELECT count(*)::int FROM rooms WHERE status='ACTIVE') AS "totalRooms",
    (SELECT coalesce(sum(available_places),0)::int FROM room_availability WHERE status='ACTIVE') AS "availablePlaces",
    (SELECT count(*)::int FROM residence_records WHERE status='CHECKED_IN') AS "currentResidents",
    (SELECT count(*)::int FROM room_fee_receipts WHERE status='UNPAID') AS "unpaidReceipts"`)).rows[0];
  assert.deepEqual(statistics,expected);
  const blocked=await compete(w.pool,[()=>createdManager.request('PATCH','/management/rooms/'+room.id,{feeVnd:'777'})],
    c=>c.query('UPDATE staff_accounts SET is_locked=true WHERE id=$1',[staff.id]));
  assert.equal(blocked[0].status,401);assert.equal(blocked[0].json.error.code,'ACCOUNT_LOCKED');
  assert.equal((await call(manager,'GET','/management/rooms/'+room.id)).feeVnd,'0','actor is rechecked after waiting for write lock');

  // Twenty authenticated readers can run while no user is mutating data. Record the
  // observed latency as API evidence, not a claim about frontend rendering or Docker.
  const start=performance.now();
  const readers=await Promise.all(Array.from({length:20},()=>manager.request('GET','/management/rooms')));
  assert.ok(readers.every(r=>r.status===200));
  t.diagnostic(`20 parallel authenticated GETs completed in ${Math.round(performance.now()-start)} ms on local PostgreSQL.`);
});
