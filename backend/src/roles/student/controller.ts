// HTTP layer for the Student role: parse via validation, call service, serialize with shared helpers.
// Authentication, role and CSRF are enforced by shared middleware mounted in app.ts before this router.
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { AppError } from '../../shared/http/errors.js';
import { sendData, sendList } from '../../shared/http/response.js';
import * as service from './service.js';
import * as validation from './validation.js';

/**
 * DEPENDENCY (Shared/app.ts owner): the single Pool is created in server.ts and handed to createApp,
 * but role routers cannot see it. This layer reads it from `app.locals.pool`; createApp must set
 * `app.locals.pool = options.pool`. Until then every Student route answers 500 INTERNAL_ERROR.
 * A second Pool is deliberately NOT created here.
 */
function poolOf(req: Request): Pool {
  const pool = req.app.locals.pool as Pool | undefined;
  if (!pool) throw new AppError(500, 'INTERNAL_ERROR', 'Không thể xử lý yêu cầu.');
  return pool;
}

export async function studentGetProfile(req: Request, res: Response): Promise<void> {
  validation.studentGetProfile(req.query);
  sendData(res, 200, await service.studentGetProfile(poolOf(req), res.locals.actor));
}

export async function studentUpdateContact(req: Request, res: Response): Promise<void> {
  const input = validation.studentUpdateContact(req.query, req.body);
  sendData(res, 200, await service.studentUpdateContact(poolOf(req), req.session.identity!, input));
}

export async function studentListBuildings(req: Request, res: Response): Promise<void> {
  const page = validation.studentListBuildings(req.query);
  const result = await service.studentListBuildings(poolOf(req), res.locals.actor, page);
  sendList(res, result.data, result.meta);
}

export async function studentListRooms(req: Request, res: Response): Promise<void> {
  const query = validation.studentListRooms(req.query);
  const result = await service.studentListRooms(poolOf(req), res.locals.actor, query);
  sendList(res, result.data, result.meta);
}

export async function studentGetRoom(req: Request, res: Response): Promise<void> {
  const { roomId } = validation.studentGetRoom(req.params, req.query);
  sendData(res, 200, await service.studentGetRoom(poolOf(req), res.locals.actor, roomId));
}

export async function studentGetPeriod(req: Request, res: Response): Promise<void> {
  validation.studentGetPeriod(req.query);
  sendData(res, 200, await service.studentGetPeriod(poolOf(req), res.locals.actor));
}
