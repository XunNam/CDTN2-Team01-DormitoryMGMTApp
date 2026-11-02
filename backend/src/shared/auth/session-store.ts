import session from 'express-session';
import { AppError } from '../http/errors.js';

const storageError = (error: unknown) => error ? new AppError(503, 'SERVICE_UNAVAILABLE', 'Kho lưu phiên tạm thời không sẵn sàng.') : null;
/** Store callbacks run outside controllers too. Normalize failures without leaking driver errors. */
export class SafeSessionStore extends session.Store {
  constructor(private readonly backend: session.Store) {
    super();
    backend.on('connect', () => this.emit('connect'));
    backend.on('disconnect', () => this.emit('disconnect'));
  }
  get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void {
    this.backend.get(sid, (error, data) => callback(storageError(error), error ? undefined : data));
  }
  set(sid: string, data: session.SessionData, callback?: (err?: any) => void): void {
    this.backend.set(sid, data, error => callback?.(storageError(error)));
  }
  destroy(sid: string, callback?: (err?: any) => void): void {
    this.backend.destroy(sid, error => callback?.(storageError(error)));
  }
  touch(sid: string, data: session.SessionData, callback?: (err?: any) => void): void {
    if (this.backend.touch) this.backend.touch(sid, data, (error?: unknown) => callback?.(storageError(error)));
    else callback?.();
  }
}
