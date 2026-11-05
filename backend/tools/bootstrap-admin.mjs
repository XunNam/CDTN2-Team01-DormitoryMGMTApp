import pg from 'pg';
import argon2 from 'argon2';

// Optional, explicit first-account bootstrap. Credentials come only from ignored
// local environment variables. The runtime account APIs remain the provisioning path.
const { DATABASE_URL, DORMFLOW_ADMIN_USERNAME, DORMFLOW_ADMIN_PASSWORD, DORMFLOW_ADMIN_NAME }=process.env;
if (!DATABASE_URL || !DORMFLOW_ADMIN_USERNAME || !DORMFLOW_ADMIN_PASSWORD || !DORMFLOW_ADMIN_NAME) {
  throw new Error('Set DATABASE_URL and DORMFLOW_ADMIN_USERNAME / DORMFLOW_ADMIN_PASSWORD / DORMFLOW_ADMIN_NAME locally.');
}
const username=DORMFLOW_ADMIN_USERNAME.trim().toLowerCase();const displayName=DORMFLOW_ADMIN_NAME.trim();
if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username) || [...displayName].length<1 || [...displayName].length>150
    || [...DORMFLOW_ADMIN_PASSWORD].length<8 || [...DORMFLOW_ADMIN_PASSWORD].length>128) throw new Error('Invalid bootstrap account fields.');
const hash=await argon2.hash(DORMFLOW_ADMIN_PASSWORD,{type:argon2.argon2id,memoryCost:65536,timeCost:3,parallelism:1,hashLength:64});
const pool=new pg.Pool({connectionString:DATABASE_URL,connectionTimeoutMillis:5000});
try {
  const c=await pool.connect();
  try {
    await c.query('BEGIN ISOLATION LEVEL READ COMMITTED');await c.query('SELECT pg_advisory_xact_lock(724006,1)');
    if ((await c.query('SELECT 1 FROM staff_accounts LIMIT 1')).rowCount) throw new Error('Staff already exists. Use the Admin API; bootstrap does not reset existing accounts.');
    await c.query("INSERT INTO staff_accounts(username,display_name,role,password_hash) VALUES($1,$2,'ADMIN',$3)",[username,displayName,hash]);
    await c.query('COMMIT');console.log('Initial Admin created. Remove bootstrap credential variables from the local environment.');
  } catch(e) {await c.query('ROLLBACK');throw e;} finally {c.release();}
} catch(error) {console.error(error.code?'Admin bootstrap failed; database rejected the operation.':error.message);process.exitCode=1;}
finally {await pool.end();}
