import assert from 'node:assert/strict';
import test from 'node:test';
import { world,locked,PASSWORD } from '../integration/shared/harness.js';

test('NFR-02: 100 students, 100 rooms, 20 authenticated users and 100 room lookups',async t=>{
  const w=await world();t.after(()=>w.close());
  const identifiers=await locked(w.pool,async c=>{
    const hash=(await c.query('SELECT password_hash FROM student_accounts WHERE id=$1',[w.students[0].accountId])).rows[0].password_hash;
    const codes=[...w.students.map(s=>s.code)];
    for(let i=2;i<100;i++) {
      const code=w.tag.toUpperCase()+'P'+i;
      const p=(await c.query("INSERT INTO student_profiles(student_code,full_name,gender,class_name,faculty) VALUES($1,'Sinh viên hiệu năng','MALE','TEST','TEST') RETURNING id",[code])).rows[0];
      await c.query('INSERT INTO student_accounts(student_id,password_hash) VALUES($1,$2)',[p.id,hash]);codes.push(code);
    }
    for(let i=1;i<100;i++) await c.query("INSERT INTO rooms(building_id,code,capacity,gender,fee_vnd,status) VALUES($1,$2,6,'MALE',1000000,'ACTIVE')",[w.building.id,'PERF'+i]);
    assert.equal(Number((await c.query('SELECT count(*) FROM rooms WHERE building_id=$1',[w.building.id])).rows[0].count),100);
    return codes;
  });
  const browsers=Array.from({length:20},()=>w.browser());
  await Promise.all(browsers.map((b,i)=>b.login('STUDENT',identifiers[i],PASSWORD)));
  const elapsed:number[]=[];
  for(let round=0;round<5;round++) await Promise.all(browsers.map(async b=>{
    const start=performance.now();const r=await b.request('GET','/student/rooms?buildingId='+w.building.id);
    elapsed.push(performance.now()-start);assert.equal(r.status,200);assert.equal(r.json.meta.totalItems,100);
  }));
  const sorted=[...elapsed].sort((a,b)=>a-b),under2s=elapsed.filter(ms=>ms<2000).length;
  assert.equal(elapsed.length,100);assert.ok(under2s>=95,`${under2s}/100 requests completed under 2 seconds`);
  t.diagnostic(`NFR-02 local: ${under2s}/100 under 2000 ms; p95=${Math.round(sorted[94])} ms; max=${Math.round(sorted[99])} ms; 20 distinct logged-in users; fixture=100 students + 100 rooms.`);
});
