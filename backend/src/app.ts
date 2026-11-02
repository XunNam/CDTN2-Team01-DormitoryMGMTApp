import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import type { Pool } from 'pg';
import { createAuthRouter } from './shared/auth/router.js';
import { SafeSessionStore } from './shared/auth/session-store.js';
import { requireActor, requireRole } from './shared/auth/guard.js';
import { enforceOrigin, requireCsrfToken } from './shared/auth/security.js';
import { AppError, errorHandler } from './shared/http/errors.js';
import { sendData } from './shared/http/response.js';
import { studentRouter } from './roles/student/router.js';
import { createManagementRouter } from './roles/management/router.js';
import { adminRouter } from './roles/admin/router.js';

export interface AppOptions {
  pool: Pool;
  sessionSecret: string;
  appOrigin: string;
  secureCookies: boolean;
  trustProxy?: boolean;
  /** Tests only: production defaults to PostgreSQL sessions table. */
  sessionStore?: session.Store;
}

export function createApp(options: AppOptions): express.Express {
  const app = express();
  app.locals.pool = options.pool;
  app.enable('strict routing');
  app.disable('x-powered-by');
  app.set('trust proxy', options.trustProxy ? 1 : false);
  app.get('/health', (_req, res) => sendData(res, 200, { status: 'ok', scope: 'backend-scaffold' }));
  const PgStore = connectPgSimple(session);
  const sessionStore = options.sessionStore ?? new PgStore({ pool: options.pool, tableName: 'sessions', createTableIfMissing: false });
  app.locals.sessionStore = sessionStore;
  app.use(session({
    name: 'dormflow.sid', secret: options.sessionSecret,
    store: new SafeSessionStore(sessionStore),
    resave: false, saveUninitialized: false, rolling: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: options.secureCookies, maxAge: 30 * 60 * 1000 },
  }));
  app.use((req, _res, next) => {
    if (['POST', 'PATCH'].includes(req.method) && req.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      next(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Yêu cầu phải có Content-Type application/json.')); return;
    }
    next();
  });
  app.use(express.json({ limit: '32kb', strict: false }));
  app.use((req, _res, next) => {
    if (['GET', 'HEAD'].includes(req.method)
        && (req.body !== undefined || Number(req.get('Content-Length') ?? 0) > 0)) {
      next(new AppError(422, 'VALIDATION_ERROR', 'Yêu cầu đọc không được có body.')); return;
    }
    if (['POST', 'PATCH'].includes(req.method)
        && (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body))) {
      next(new AppError(422, 'VALIDATION_ERROR', 'Nội dung JSON phải là một object.')); return;
    }
    next();
  });
  app.use(enforceOrigin(options.appOrigin));
  app.use('/api/v1/auth', createAuthRouter(options.pool));
  app.use('/api/v1/student', requireCsrfToken, requireActor(options.pool), requireRole('SV'), studentRouter);
  app.use('/api/v1/management', requireCsrfToken, requireActor(options.pool), requireRole('BQL'), createManagementRouter(options.pool));
  app.use('/api/v1/admin', requireCsrfToken, requireActor(options.pool), requireRole('ADMIN'), adminRouter);
  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên.')));
  app.use(errorHandler);
  return app;
}
