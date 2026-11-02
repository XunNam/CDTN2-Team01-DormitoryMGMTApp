import { Router } from 'express';
import type { Pool } from 'pg';
import { requireActor } from './guard.js';
import { requireCsrfToken } from './security.js';
import * as controller from './controller.js';

export function createAuthRouter(pool: Pool): Router {
  const router = Router({ strict: true });
  router.get('/csrf', (req, res) => controller.getCsrfToken(req, res, pool));
  router.post('/login', requireCsrfToken, (req, res) => controller.login(req, res, pool));
  router.post('/logout', (req, res) => controller.logout(req, res, pool));
  router.post('/change-password', requireCsrfToken, requireActor(pool), (req, res) => controller.changePassword(req, res, pool));
  router.get('/me', requireActor(pool), (req, res) => controller.getCurrentIdentity(req, res, pool));
  return router;
}
