import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('Load the ignored local .env first.');
const schema='codex_review_sql_'+randomBytes(6).toString('hex');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
const normalize=value=>JSON.stringify(value).replaceAll('\\r\\n','\\n').replaceAll(schema+'.','').replaceAll('public.','').replace(/\s+/g,' ');
async function signature(c,name) {
  const columns=(await c.query(`SELECT table_name,column_name,ordinal_position,data_type,is_nullable,column_default,character_maximum_length
    FROM information_schema.columns WHERE table_schema=$1 ORDER BY table_name,ordinal_position`,[name])).rows;
  const constraints=(await c.query(`SELECT r.relname,c.conname,c.contype,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c
    JOIN pg_class r ON r.oid=c.conrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=$1 ORDER BY r.relname,c.conname`,[name])).rows;
  const triggers=(await c.query(`SELECT r.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t
    JOIN pg_class r ON r.oid=t.tgrelid JOIN pg_namespace n ON n.oid=r.relnamespace WHERE n.nspname=$1 AND NOT t.tgisinternal ORDER BY r.relname,t.tgname`,[name])).rows;
  const functions=(await c.query(`SELECT p.proname,p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1 ORDER BY p.proname`,[name])).rows;
  const indexes=(await c.query('SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname=$1 ORDER BY tablename,indexname',[name])).rows;
  const views=(await c.query('SELECT viewname,definition FROM pg_views WHERE schemaname=$1 ORDER BY viewname',[name])).rows;
  return {columns,constraints,triggers,functions,indexes,views};
}
try {
  const c=await pool.connect();
  try {
    await c.query(`CREATE SCHEMA "${schema}"`);
    await c.query(`SET search_path TO "${schema}",pg_catalog`);
    await c.query(await readFile(new URL('../../SQL/schema.sql',import.meta.url),'utf8'));
    await c.query(await readFile(new URL('../../SQL/tests/invariants.sql',import.meta.url),'utf8'));
    const expected=await signature(c,schema),actual=await signature(c,'public');
    const differences=Object.keys(expected).filter(key=>normalize(expected[key])!==normalize(actual[key]));
    console.log(JSON.stringify({schemaIntegrity:'PASS',applicationSchemaMatchesSnapshot:!differences.length,differences,
      isolatedTestSchema:schema,publicWrites:0}));
    if(differences.length) process.exitCode=1;
  } finally {c.release();}
} catch(error) {console.error('Schema verification failed:',error.code??'VERIFICATION_ERROR');process.exitCode=1;}
finally {await pool.end();}
