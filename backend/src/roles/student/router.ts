import { Router } from 'express';
import * as controller from './controller.js';

export const studentRouter = Router({ strict: true });

// Student routes (SV-01 / P1). app.ts already mounts this router at /api/v1/student behind
// CSRF -> fresh actor -> requireRole('SV'), so only relative paths are declared here.
studentRouter.get('/profile', controller.studentGetProfile);                    // studentGetProfile
studentRouter.patch('/profile', controller.studentUpdateContact);               // studentUpdateContact
studentRouter.get('/buildings', controller.studentListBuildings);               // studentListBuildings
studentRouter.get('/rooms', controller.studentListRooms);                       // studentListRooms
studentRouter.get('/rooms/:roomId', controller.studentGetRoom);                 // studentGetRoom
studentRouter.get('/registration-period', controller.studentGetPeriod);         // studentGetPeriod

studentRouter.post('/applications',controller.studentCreateApplication);
studentRouter.get('/applications',controller.studentListApplications);
studentRouter.get('/applications/:applicationId',controller.studentGetApplication);
studentRouter.get('/residences',controller.studentListResidences);
studentRouter.get('/residences/:residenceId',controller.studentGetResidence);
studentRouter.get('/receipts',controller.studentListReceipts);
studentRouter.get('/receipts/:receiptId',controller.studentGetReceipt);
