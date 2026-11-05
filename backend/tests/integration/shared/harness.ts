import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import type { Pool, PoolClient } from 'pg';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import argon2 from 'argon2';
import { startFrontend } from './frontend.js';
import { createApp } from '../../../src/app.js';
import { createPool } from '../../../src/shared/db/pool.js';

export const ORIGIN=process.env.TEST_FRONTEND_ORIGIN ?? 'http://localhost:3000';
export const PASSWORD='ReviewOnly#2026';
export async function locked<T>(pool: Pool, work:(c:PoolClient)=>Promise<T>):Promise<T> {
  const c=await pool.connect();
  try { await c.query('BEGIN ISOLATION LEVEL READ COMMITTED'); await c.query('SELECT pg_advisory_xact_lock(724006,1)');
    const result=await work(c); await c.query('COMMIT'); return result;
  } catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}
export async function world() {
  assert.ok(process.env.TEST_DATABASE_URL,'Use the integration runner and a disposable test namespace.');
  const pool=createPool(process.env.TEST_DATABASE_URL);
  const namespace=(await pool.query('SELECT current_schema() AS schema,current_database() AS db')).rows[0];
  assert.ok(namespace.schema.startsWith('codex_review_') || /test/i.test(namespace.db),'Refusing fixtures in application namespace.');
  const tag='rv'+randomBytes(5).toString('hex');
  // Keep legacy 32-byte fixtures to prove existing accounts still authenticate.
  const hash=await argon2.hash(PASSWORD,{type:argon2.argon2id,memoryCost:65536,timeCost:3,parallelism:1,hashLength:32});
  const data=await locked(pool,async c=>{
    const staff=async(role:'BQL'|'ADMIN') => (await c.query(
      'INSERT INTO staff_accounts(username,display_name,role,password_hash) VALUES($1,$2,$3,$4) RETURNING id,username',
      [`${tag}.${role.toLowerCase()}`,`Nhân sự thử ${role}`,role,hash])).rows[0] as {id:string;username:string};
    const admin=await staff('ADMIN'),bql=await staff('BQL');
    const period=(await c.query('SELECT status FROM registration_period WHERE id=1')).rows[0];
    if(period.status!=='OPEN') await c.query("UPDATE registration_period SET status='OPEN',updated_by=$1 WHERE id=1",[bql.id]);
    const building=(await c.query('INSERT INTO buildings(code,name) VALUES($1,$2) RETURNING id,code',[tag.toUpperCase(),'Tòa kiểm thử'])).rows[0];
    const room=(await c.query("INSERT INTO rooms(building_id,code,capacity,gender,fee_vnd,status) VALUES($1,'R1',1,'MALE',1000000,'ACTIVE') RETURNING id",[building.id])).rows[0];
    const students=[] as {id:string;accountId:string;code:string}[];
    for(const suffix of ['A','B']) {
      const profile=(await c.query("INSERT INTO student_profiles(student_code,full_name,gender,class_name,faculty,date_of_birth) VALUES($1,$2,'MALE','TEST','TEST','2005-03-09') RETURNING id,student_code",[tag.toUpperCase()+suffix,'Sinh viên thử '+suffix])).rows[0];
      const account=(await c.query('INSERT INTO student_accounts(student_id,password_hash) VALUES($1,$2) RETURNING id',[profile.id,hash])).rows[0];
      students.push({id:profile.id,accountId:account.id,code:profile.student_code});
    }
    return {admin,bql,building,room,students};
  });
  const PgStore=connectPgSimple(session);
  const store=new PgStore({pool,tableName:'sessions',createTableIfMissing:false,pruneSessionInterval:false});
  const app=createApp({pool,sessionSecret:randomBytes(32).toString('hex'),appOrigin:ORIGIN,secureCookies:false,sessionStore:store});
  assert.equal(app.locals.pool,pool,'Pool must be supplied by createApp, never patched in a fixture');
  const server=app.listen(0,'127.0.0.1');
  await new Promise<void>(r=>server.once('listening',r));
  const backendOrigin=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  let frontend: Awaited<ReturnType<typeof startFrontend>> | undefined;
  try { if (process.env.TEST_FRONTEND_ORIGIN) frontend=await startFrontend(backendOrigin, ORIGIN); }
  catch(error) { server.close(); store.close(); await pool.end(); throw error; }
  const base=(frontend ? ORIGIN : backendOrigin)+'/api/v1';
  const covered=new Set<string>();
  const contract=JSON.parse(readFileSync(new URL('../../../../API Endpoint/openapi.json',import.meta.url),'utf8'));
  const operations=Object.entries(contract.paths).flatMap(([path,methods])=>Object.entries(methods as Record<string,any>)
    .filter(([,op])=>op.operationId).map(([method,op])=>({method:method.toUpperCase(),id:op.operationId,
      pattern:new RegExp('^'+path.replace(/\{[^}]+\}/g,'[^/]+')+'$')})));
  class Browser {
    cookie=''; csrf='';
    async request(method:string,path:string,body?:unknown,headers:Record<string,string>={}) {
      const response=await fetch(base+path,{method,headers:{...(this.cookie?{Cookie:this.cookie}:{}),
        ...(method==='GET'?{}:{Origin:ORIGIN,'Content-Type':'application/json','X-CSRF-Token':this.csrf}),...headers},
        body:body===undefined?undefined:JSON.stringify(body)});
      const cookie=response.headers.get('set-cookie');
      if(cookie) this.cookie=cookie.split(';')[0];
      const text=await response.text();
      if(response.ok) { const pathOnly='/api/v1'+path.split('?')[0];
        const operation=operations.find(op=>op.method===method && op.pattern.test(pathOnly));
        if(operation) covered.add(operation.id);
      }
      return {status:response.status,json:text?JSON.parse(text):null,text,headers:response.headers};
    }
    async token() { const r=await this.request('GET','/auth/csrf'); assert.equal(r.status,200); this.csrf=r.json.data.csrfToken; return r; }
    async login(kind:'STUDENT'|'STAFF',identifier:string,password=PASSWORD) {
      await this.token();
      const r=await this.request('POST','/auth/login',{accountType:kind,identifier,password});
      assert.equal(r.status,200,`login: ${r.text}`); await this.token(); return r;
    }
  }
  return {pool,tag,...data,browser:()=>new Browser(),
    assertApiCoverage:()=>{assert.equal(operations.length,51);assert.deepEqual(operations.filter(op=>!covered.has(op.id)).map(op=>op.id),[],'Every API must succeed through the frontend proxy');},
    close:async()=>{await frontend?.close(); await new Promise<void>((r,j)=>server.close(e=>e?j(e):r())); store.close(); await pool.end();}};
}
const schemas=JSON.parse(readFileSync(new URL('../../../../API Endpoint/Shared/schemas.json',import.meta.url),'utf8')).schemas;
export function assertDto(name:string,data:Record<string,unknown>) {
  const schema=schemas[name];
  assert.deepEqual(Object.keys(data).sort(),Object.keys(schema.properties).sort(),name+' keys');
  for(const [key,value] of Object.entries(data)) {
    const p=schema.properties[key];
    if(value===null) {assert.ok(Array.isArray(p.type)&&p.type.includes('null'),key+' nullable');continue;}
    assert.equal(typeof value,p.type==='integer'?'number':Array.isArray(p.type)?p.type.find((x:string)=>x!=='null'):p.type,key+' type');
    if(p.enum) assert.ok(p.enum.includes(value),key+' enum');
    if(p.format==='date-time') assert.match(value as string,/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    if(p.format==='date') assert.match(value as string,/^\d{4}-\d{2}-\d{2}$/);
  }
}
