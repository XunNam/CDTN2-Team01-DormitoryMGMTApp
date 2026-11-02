import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required; copy .env.example to .env and configure locally.');
const pool = new pg.Pool({ connectionString:process.env.DATABASE_URL, connectionTimeoutMillis:5000 });
try {
  const { rows } = await pool.query(`SELECT current_database() AS database, current_schema() AS schema,
    current_setting('server_version') AS version`);
  const expected = ['student_profiles','student_accounts','staff_accounts','buildings','rooms','registration_period',
    'applications','residence_records','room_fee_receipts','sessions','room_availability'];
  for (const name of expected) {
    if (!(await pool.query('SELECT to_regclass($1) AS name',[name])).rows[0].name) throw new Error(`Missing database object: ${name}`);
  }
  if ((await pool.query('SELECT count(*) AS n FROM registration_period WHERE id=1')).rows[0].n !== '1') throw new Error('Registration-period singleton missing.');
  console.log(JSON.stringify({ status:'ok', ...rows[0], requiredObjects:expected.length }));
} catch (error) {
  console.error('Database check failed:', error.code ?? 'SCHEMA_CHECK_FAILED');
  process.exitCode=1;
} finally { await pool.end(); }
