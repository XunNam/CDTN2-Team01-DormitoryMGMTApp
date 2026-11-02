import type { ErrorRequestHandler } from 'express';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (res.headersSent) { _next(err); return; }
  if (err instanceof AppError) {
    res.status(err.status).json({ error: {
      code: err.code, message: err.message,
      ...(err.details ? { details: err.details } : {}),
    } });
    return;
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Nội dung yêu cầu vượt giới hạn.' } });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Nội dung JSON không hợp lệ.' } });
    return;
  }
  if (err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
      && /^(08\w{3}|57P0[123]|57014|53300|55P03|40001|40P01|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND)$/.test(err.code)) {
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Dịch vụ tạm thời không sẵn sàng.' } });
    return;
  }
  // Do not serialize arbitrary errors: PostgreSQL errors can contain SQL and personal data.
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Không thể xử lý yêu cầu.' } });
};
