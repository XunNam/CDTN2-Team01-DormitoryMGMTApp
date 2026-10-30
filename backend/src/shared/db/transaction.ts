import type { Pool, PoolClient } from 'pg';
import { resolveActor } from '../auth/guard.js';
import type { Actor, SessionIdentity } from '../auth/types.js';

/** All business mutations use this one transaction and the same client. */
export async function withBusinessTransaction<T>(
  pool: Pool,
  identity: SessionIdentity,
  work: (client: PoolClient, actor: Actor) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let transactionStarted = false;
  let destroyClient = false;
  try {
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
    transactionStarted = true;
    // First statement after BEGIN: no domain or account read before this lock.
    await client.query('SELECT pg_advisory_xact_lock(724006, 1)');
    const actor = await resolveActor(client, identity);
    const result = await work(client, actor);
    await client.query('COMMIT');
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try { await client.query('ROLLBACK'); }
      catch { destroyClient = true; /* Preserve the original error; discard broken connection. */ }
    } else {
      // A failed BEGIN must not return a potentially broken connection to the pool.
      destroyClient = true;
    }
    throw error;
  } finally { client.release(destroyClient); }
}
