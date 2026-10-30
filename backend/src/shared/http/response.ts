import type { Response } from 'express';

export interface PageMeta { page: number; pageSize: number; totalItems: number; totalPages: number }

export function sendData<T>(res: Response, status: number, data: T): void {
  res.status(status).json({ data });
}

export function sendList<T>(res: Response, data: T[], meta: PageMeta): void {
  res.status(200).json({ data, meta });
}
