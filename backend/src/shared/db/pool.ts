import pg from 'pg';

// DATE is a business calendar date, not a local-time JavaScript Date.
pg.types.setTypeParser(1082, value => value);

// One factory called once by server.ts. Role modules must not instantiate Pool.
export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000 });
}
