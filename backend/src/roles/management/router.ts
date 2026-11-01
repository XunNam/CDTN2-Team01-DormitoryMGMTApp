import { Router } from 'express';
import type { Pool } from 'pg';
import {
  managementApproveApplication,
  managementCancelAllocation,
  managementCheckIn,
  managementCheckOut,
  managementCreateReceipt,
  managementCreateBuilding,
  managementCreateProfile,
  managementCreateRoom,
  managementGetApplication,
  managementGetBuilding,
  managementGetPeriod,
  managementGetProfile,
  managementGetReceipt,
  managementGetResidence,
  managementGetRoom,
  managementGetStatistics,
  managementListApplications,
  managementListBuildings,
  managementListProfiles,
  managementListReceipts,
  managementListResidences,
  managementListRooms,
  managementPayReceipt,
  managementRejectApplication,
  managementUpdateBuilding,
  managementUpdatePeriod,
  managementUpdateProfile,
  managementUpdateRoom,
} from './controller.js';

export function createManagementRouter(pool: Pool): Router {
  const router = Router({ strict: true });

  router.get('/student-profiles', managementListProfiles(pool));
  router.post('/student-profiles', managementCreateProfile(pool));
  router.get('/student-profiles/:studentId', managementGetProfile(pool));
  router.patch('/student-profiles/:studentId', managementUpdateProfile(pool));

  router.get('/buildings', managementListBuildings(pool));
  router.post('/buildings', managementCreateBuilding(pool));
  router.get('/buildings/:buildingId', managementGetBuilding(pool));
  router.patch('/buildings/:buildingId', managementUpdateBuilding(pool));

  router.get('/rooms', managementListRooms(pool));
  router.post('/rooms', managementCreateRoom(pool));
  router.get('/rooms/:roomId', managementGetRoom(pool));
  router.patch('/rooms/:roomId', managementUpdateRoom(pool));

  router.get('/registration-period', managementGetPeriod(pool));
  router.patch('/registration-period', managementUpdatePeriod(pool));

  router.get('/applications', managementListApplications(pool));
  router.get('/applications/:applicationId', managementGetApplication(pool));
  router.post('/applications/:applicationId/approve', managementApproveApplication(pool));
  router.post('/applications/:applicationId/reject', managementRejectApplication(pool));

  router.get('/residences', managementListResidences(pool));
  router.get('/residences/:residenceId', managementGetResidence(pool));
  router.post('/residences/:residenceId/check-in', managementCheckIn(pool));
  router.post('/residences/:residenceId/cancel', managementCancelAllocation(pool));
  router.post('/residences/:residenceId/check-out', managementCheckOut(pool));

  router.get('/receipts', managementListReceipts(pool));
  router.post('/receipts', managementCreateReceipt(pool));
  router.get('/receipts/:receiptId', managementGetReceipt(pool));
  router.post('/receipts/:receiptId/pay', managementPayReceipt(pool));

  router.get('/statistics', managementGetStatistics(pool));

  return router;
}
