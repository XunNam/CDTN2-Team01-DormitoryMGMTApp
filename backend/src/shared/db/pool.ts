import pg from 'pg';

// DATE is a business calendar date, not a local-time JavaScript Date.
pg.types.setTypeParser(1082, value => value);

// One factory called once by server.ts. Role modules must not instantiate Pool.
export function createPool(connectionString: string): pg.Pool {
  const pool = new pg.Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000,
    lock_timeout: 5000, statement_timeout: 15000 });
  // pg emits idle-connection failures outside request handlers. Handle them without
  // exposing SQL/credentials or crashing the API on an unhandled EventEmitter error.
  pool.on('error', () => process.stderr.write('PostgreSQL idle connection unavailable.\n'));
  return pool;
}
