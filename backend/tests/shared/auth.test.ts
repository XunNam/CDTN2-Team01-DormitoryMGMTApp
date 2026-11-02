import assert from 'node:assert/strict';
import test from 'node:test';
import session from 'express-session';
import type { Pool } from 'pg';
import type { AddressInfo } from 'node:net';
import { createApp } from '../../src/app.js';
import * as validation from '../../src/shared/auth/validation.js';
import { SafeSessionStore } from '../../src/shared/auth/session-store.js';

test('Auth password boundaries use Unicode code points without trimming and reject unknown keys',()=>{
  const password='😀'.repeat(128);
  assert.equal(validation.login({}, {accountType:'STUDENT',identifier:' sv001 ',password}).password,password);
  assert.equal(validation.login({}, {accountType:'STAFF',identifier:' Staff.Name ',password:' 123456 '}).identifier,'staff.name');
  assert.throws(()=>validation.login({}, {accountType:'STAFF',identifier:'staff',password:'😀'.repeat(129)}));
  assert.throws(()=>validation.login({}, {accountType:'STAFF',identifier:'staff',password:'12345678',role:'ADMIN'}));
  assert.throws(()=>validation.changePassword({accountId:'other'}, {currentPassword:'12345678',newPassword:'87654321'}));
});
test('Session store failures are 503 without leaking raw storage errors',async()=>{
  const backend=new session.MemoryStore();
  backend.get=(_sid,cb)=>cb(new Error('sensitive storage query'));
  backend.set=(_sid,_data,cb)=>cb?.(new Error('sensitive storage query'));
  backend.destroy=(_sid,cb)=>cb?.(new Error('sensitive storage query'));
  const safe=new SafeSessionStore(backend);
  for(const invoke of [
    (cb:(e:any)=>void)=>safe.get('id',cb),
    (cb:(e:any)=>void)=>safe.set('id',{} as session.SessionData,cb),
    (cb:(e:any)=>void)=>safe.destroy('id',cb),
  ]) await new Promise<void>(resolve=>invoke(e=>{assert.equal(e.status,503);assert.equal(e.code,'SERVICE_UNAVAILABLE');assert.doesNotMatch(e.message,/sensitive/);resolve();}));
  const app=createApp({pool:{} as Pool,sessionSecret:'x'.repeat(40),appOrigin:'http://localhost:3000',secureCookies:false,sessionStore:backend});
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
  try {
    const r=await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/auth/csrf`);
    assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/sensitive storage query/);
  } finally {await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));}
});
