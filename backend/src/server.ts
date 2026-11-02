import { createApp } from './app.js';
import { createPool } from './shared/db/pool.js';

const { DATABASE_URL, SESSION_SECRET, APP_ORIGIN, NODE_ENV } = process.env;
if (!DATABASE_URL || !SESSION_SECRET || SESSION_SECRET.length < 32 || !APP_ORIGIN) {
  throw new Error('DATABASE_URL, APP_ORIGIN and SESSION_SECRET (at least 32 characters) are required.');
}
const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
if (NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'true') throw new Error('Production requires COOKIE_SECURE=true.');
const pool = createPool(DATABASE_URL);
try { await pool.query('SELECT 1'); }
catch { await pool.end(); throw new Error('Cannot connect to PostgreSQL. Check the local DATABASE_URL and database service.'); }
const app = createApp({ pool, sessionSecret: SESSION_SECRET, appOrigin: APP_ORIGIN,
  secureCookies: process.env.COOKIE_SECURE === 'true', trustProxy: process.env.TRUST_PROXY === 'true' });
const server = app.listen(port, () => { process.stdout.write(`DormFlow API listening on port ${port}\n`); });
async function stop(): Promise<void> { server.close(async () => { app.locals.sessionStore.close?.(); await pool.end(); process.exitCode = 0; }); }
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
