import type { Pool, PoolClient } from 'pg';

/** Keep every query in a read operation on one stable snapshot, without a business write lock. */
export async function withReadSnapshot<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let transactionStarted = false;
  let destroyClient = false;
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    transactionStarted = true;
    const result = await work(client);
    await client.query('COMMIT');
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try { await client.query('ROLLBACK'); }
      catch { destroyClient = true; }
    } else {
      destroyClient = true;
    }
    throw error;
  } finally {
    client.release(destroyClient);
  }
}
