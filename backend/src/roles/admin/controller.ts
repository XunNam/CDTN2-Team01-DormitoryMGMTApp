// ADMIN role transport: parse input, call service, serialize the Shared envelope.
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { AppError } from '../../shared/http/errors.js';
import { sendData, sendList } from '../../shared/http/response.js';
import * as service from './service.js';
import * as validation from './validation.js';

/** The app factory supplies the one shared Pool; role code never creates another. */
function poolOf(req: Request): Pool {
  const pool = req.app.locals.pool as Pool | undefined;
  if (!pool) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ tạm thời không sẵn sàng.');
  return pool;
}

export async function adminListAccounts(req: Request, res: Response): Promise<void> {
  const input = validation.adminListAccounts(req.query);
  const result = await service.adminListAccounts(poolOf(req), input);
  sendList(res, result.data, result.meta);
}

export async function adminGetAccount(req: Request, res: Response): Promise<void> {
  const ref = validation.adminGetAccount(req.params, req.query);
  sendData(res, 200, await service.adminGetAccount(poolOf(req), ref));
}

export async function adminCreateAccount(req: Request, res: Response): Promise<void> {
  const input = validation.adminCreateAccount(req.query, req.body);
  sendData(res, 201, await service.adminCreateAccount(poolOf(req), req.session.identity!, input));
}

export async function adminSetAccountLock(req: Request, res: Response): Promise<void> {
  const input = validation.adminSetAccountLock(req.params, req.query, req.body);
  sendData(res, 200, await service.adminSetAccountLock(poolOf(req), req.session.identity!, input));
}

export async function adminListProfileCandidates(req: Request, res: Response): Promise<void> {
  const input = validation.adminListProfileCandidates(req.query);
  const result = await service.adminListProfileCandidates(poolOf(req), input);
  sendList(res, result.data, result.meta);
}
