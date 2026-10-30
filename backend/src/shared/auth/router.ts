import { Router } from 'express';

export const authRouter = Router({ strict: true });

// IMPLEMENTATION SLOT: Shared auth owner implements contract operations here.
// No login/logout/password/CSRF endpoint is implemented yet. Do not fake a session.
