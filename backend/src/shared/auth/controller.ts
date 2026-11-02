import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import type { SessionIdentity } from './types.js';
import { AppError } from '../http/errors.js';
import { sendData } from '../http/response.js';
import { resolveActor } from './guard.js';
import { requireCsrfToken } from './security.js';
import * as validation from './validation.js';
import * as service from './service.js';

const unavailable = () => new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể lưu phiên đăng nhập.');
const save = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(e => e ? reject(unavailable()) : resolve()));
const regenerate = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(e => e ? reject(unavailable()) : resolve()));
const destroy = (req: Request) => new Promise<void>((resolve, reject) => req.session.destroy(e => e ? reject(unavailable()) : resolve()));
function clearCookie(req: Request, res: Response) {
  res.clearCookie('dormflow.sid', { path: '/', httpOnly: true, sameSite: 'lax', secure: req.session?.cookie.secure === true });
}
async function replaceSession(req: Request, res: Response, identity?: SessionIdentity) {
  try {
    await regenerate(req);
    if (identity) req.session.identity = identity;
    req.session.csrfToken = randomBytes(32).toString('hex');
    await save(req);
  } catch (error) {
    // Password may already be committed: clear the unusable session, do not claim rollback.
    clearCookie(req, res);
    if (req.session) await destroy(req).catch(() => undefined);
    throw error;
  }
}
export async function getCsrfToken(req: Request, res: Response, pool: Pool) {
  validation.getCsrfToken(req.query);
  res.set('Cache-Control', 'no-store');
  if (req.session.identity) {
    try { await resolveActor(pool, req.session.identity); }
    catch (error) {
      if (!(error instanceof AppError) || error.status !== 401) throw error;
      await replaceSession(req, res);
    }
  }
  req.session.csrfToken ??= randomBytes(32).toString('hex');
  await save(req);
  sendData(res, 200, { csrfToken: req.session.csrfToken });
}
export async function login(req: Request, res: Response, pool: Pool) {
  const input = validation.login(req.query, req.body);
  const account = await service.login(pool, input);
  await replaceSession(req, res, { actorKind: input.accountType, accountId: account.id,
    sessionVersion: account.session_version, lastSeenAt: Date.now() });
  res.set('Cache-Control', 'no-store');
  sendData(res, 200, service.identityDto(input.accountType, account));
}
export async function logout(req: Request, res: Response, pool: Pool) {
  if (await service.hasCurrentSession(pool, req.session.identity)) {
    await new Promise<void>((resolve, reject) => requireCsrfToken(req, res, e => e ? reject(e) : resolve()));
  }
  validation.logout(req.query, req.body);
  clearCookie(req, res);
  await destroy(req);
  res.status(204).end();
}
export async function changePassword(req: Request, res: Response, pool: Pool) {
  const input = validation.changePassword(req.query, req.body);
  const identity = req.session.identity!;
  const version = await service.changePassword(pool, identity, input);
  await replaceSession(req, res, { ...identity, sessionVersion: version, lastSeenAt: Date.now() });
  res.status(204).end();
}
export async function getCurrentIdentity(req: Request, res: Response, pool: Pool) {
  validation.getCurrentIdentity(req.query);
  res.set('Cache-Control', 'no-store');
  sendData(res, 200, await service.getCurrentIdentity(pool, req.session.identity!));
}
