import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import argon2 from 'argon2';

test('Bootstrap creates a 64-byte Argon2id ADMIN and refuses to overwrite existing staff',async()=>{
  assert.ok(process.env.TEST_DATABASE_URL,'A dedicated test database is required');
  const namespace='codex_review_bootstrap_'+randomBytes(8).toString('hex');
  const url=new URL(process.env.TEST_DATABASE_URL);
  const setup=new pg.Pool({connectionString:url.toString()});
  try {
    const current=(await setup.query('SELECT current_schema() AS schema,current_database() AS db')).rows[0];
    assert.ok(current.schema.startsWith('codex_review_') || /test/i.test(current.db),'Refusing application namespace');
    await setup.query(`CREATE SCHEMA "${namespace}"`);
  } finally {await setup.end();}
  url.searchParams.set('options',`-c search_path=${namespace},pg_catalog`);
  const pool=new pg.Pool({connectionString:url.toString()});
  try {
    await pool.query(await readFile(new URL('../../../../SQL/schema.sql',import.meta.url),'utf8'));
    const password=randomBytes(24).toString('hex');
    const env={...process.env,DATABASE_URL:url.toString(),DORMFLOW_ADMIN_USERNAME:'bootstrap.test',DORMFLOW_ADMIN_NAME:'Admin test',DORMFLOW_ADMIN_PASSWORD:password};
    const run=()=>spawnSync(process.execPath,['tools/bootstrap-admin.mjs'],{
      cwd:fileURLToPath(new URL('../../../',import.meta.url)),env,encoding:'utf8',windowsHide:true,
    });
    assert.equal(run().status,0,'first bootstrap succeeds');
    const rows=(await pool.query('SELECT role,password_hash,is_locked FROM staff_accounts')).rows;
    assert.equal(rows.length,1);
    assert.equal(rows[0].role,'ADMIN');
    assert.equal(rows[0].is_locked,false);
    assert.equal(Buffer.from(rows[0].password_hash.split('$')[5],'base64').length,64);
    assert.ok(await argon2.verify(rows[0].password_hash,password));
    assert.equal(run().status,1,'existing staff must not be overwritten');
    assert.equal((await pool.query('SELECT password_hash FROM staff_accounts')).rows[0].password_hash,rows[0].password_hash);
  } finally {await pool.end();} // Keep the isolated test namespace; never reset/drop data.
});
