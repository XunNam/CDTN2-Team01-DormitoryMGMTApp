import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { AppError } from '../http/errors.js';

export function enforceOrigin(appOrigin: string): RequestHandler {
  const expected = new URL(appOrigin).origin;
  return (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
    if (req.get('Origin') !== expected) { next(new AppError(403, 'ORIGIN_FORBIDDEN', 'Nguồn yêu cầu không hợp lệ.')); return; }
    next();
  };
}

/** Synchronizer token from GET /auth/csrf (auth task must implement issuing/rotation). */
export const requireCsrfToken: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return; }
  const actual = req.get('X-CSRF-Token');
  const expected = req.session.csrfToken;
  if (!actual || !expected || actual.length > 256
      || Buffer.byteLength(actual) !== Buffer.byteLength(expected)
      || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
    next(new AppError(403, 'CSRF_INVALID', 'Mã bảo vệ yêu cầu không hợp lệ.'));
    return;
  }
  next();
};
