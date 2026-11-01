import { Router } from 'express';
import * as controller from './controller.js';

export const adminRouter = Router({ strict: true });

// Mounted by app.ts at /api/v1/admin behind Origin/CSRF, fresh actor and requireRole('ADMIN').
// Contract: API Endpoint/System Admin/API-Contract.md revision 1.0.0. Do not add app.listen().
adminRouter.get('/accounts', controller.adminListAccounts);
adminRouter.post('/accounts', controller.adminCreateAccount);
adminRouter.get('/accounts/:actorKind/:accountId', controller.adminGetAccount);
adminRouter.patch('/accounts/:actorKind/:accountId/lock', controller.adminSetAccountLock);
adminRouter.get('/student-profiles/candidates', controller.adminListProfileCandidates);
