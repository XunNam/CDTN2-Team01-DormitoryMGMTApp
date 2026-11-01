import type { Request, RequestHandler, Response } from 'express';
import type { Pool } from 'pg';
import type { SessionIdentity } from '../../shared/auth/types.js';
import { AppError } from '../../shared/http/errors.js';
import { sendData, sendList } from '../../shared/http/response.js';
import {
  managementApproveApplication as serviceApproveApplication,
  managementCancelAllocation as serviceCancelAllocation,
  managementCheckIn as serviceCheckIn,
  managementCheckOut as serviceCheckOut,
  managementCreateReceipt as serviceCreateReceipt,
  managementCreateBuilding as serviceCreateBuilding,
  managementCreateProfile as serviceCreateProfile,
  managementCreateRoom as serviceCreateRoom,
  managementGetApplication as serviceGetApplication,
  managementGetBuilding as serviceGetBuilding,
  managementGetPeriod as serviceGetPeriod,
  managementGetProfile as serviceGetProfile,
  managementGetReceipt as serviceGetReceipt,
  managementGetResidence as serviceGetResidence,
  managementGetRoom as serviceGetRoom,
  managementGetStatistics as serviceGetStatistics,
  managementListApplications as serviceListApplications,
  managementListBuildings as serviceListBuildings,
  managementListProfiles as serviceListProfiles,
  managementListReceipts as serviceListReceipts,
  managementListResidences as serviceListResidences,
  managementListRooms as serviceListRooms,
  managementPayReceipt as servicePayReceipt,
  managementRejectApplication as serviceRejectApplication,
  managementUpdateBuilding as serviceUpdateBuilding,
  managementUpdatePeriod as serviceUpdatePeriod,
  managementUpdateProfile as serviceUpdateProfile,
  managementUpdateRoom as serviceUpdateRoom,
} from './service.js';
import {
  parseApplicationApprove,
  parseApplicationQuery,
  parseApplicationReject,
  parseBuildingCreate,
  parseBuildingPatch,
  parseBuildingQuery,
  parseCancelAllocation,
  parseCheckIn,
  parseCheckOut,
  parseEmptyQuery,
  parsePeriodPatch,
  parseProfileCreate,
  parseProfilePatch,
  parseReceiptCreate,
  parseReceiptPay,
  parseReceiptQuery,
  parseResidenceQuery,
  parseRoomCreate,
  parseRoomPatch,
  parseRoomQuery,
  parseStudentProfileQuery,
  requireUuidParam,
} from './validation.js';

type EndpointResult = unknown;

interface ListResponse {
  items: unknown[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

function isListResponse(value: unknown): value is ListResponse {
  return value !== null && typeof value === 'object'
    && 'items' in value && Array.isArray(value.items)
    && 'meta' in value && value.meta !== null && typeof value.meta === 'object';
}

function getIdentity(req: Request): SessionIdentity {
  const identity = req.session.identity;
  if (!identity) throw new AppError(401, 'AUTH_REQUIRED', 'Cần đăng nhập.');
  return identity;
}

function requireFound<T>(value: T | null, message: string): T {
  if (value === null) throw new AppError(404, 'NOT_FOUND', message);
  return value;
}

function endpoint(
  status: number,
  action: (req: Request, pool: Pool) => Promise<EndpointResult>,
): (pool: Pool) => RequestHandler {
  return (pool) => async (req, res, next) => {
    try {
      const result = await action(req, pool);
      if (isListResponse(result)) {
        sendList(res, result.items, result.meta);
      } else {
        sendData(res, status, result);
      }
    } catch (error) {
      next(error);
    }
  };
}

function pathParam(req: Request, key: string): string {
  const value = req.params[key];
  return requireUuidParam(Array.isArray(value) ? value[0] : value, key);
}

export const managementListProfiles = endpoint(200, async (req, pool) =>
  serviceListProfiles(pool, parseStudentProfileQuery(req.query)));

export const managementCreateProfile = endpoint(201, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCreateProfile(pool, identity, parseProfileCreate(req.body));
});

export const managementGetProfile = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return requireFound(await serviceGetProfile(pool, pathParam(req, 'studentId')), 'Hồ sơ sinh viên không tồn tại.');
});

export const managementUpdateProfile = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return requireFound(
    await serviceUpdateProfile(pool, identity, pathParam(req, 'studentId'), parseProfilePatch(req.body)),
    'Hồ sơ sinh viên không tồn tại.',
  );
});

export const managementListBuildings = endpoint(200, async (req, pool) =>
  serviceListBuildings(pool, parseBuildingQuery(req.query)));

export const managementCreateBuilding = endpoint(201, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCreateBuilding(pool, identity, parseBuildingCreate(req.body));
});

export const managementGetBuilding = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return requireFound(await serviceGetBuilding(pool, pathParam(req, 'buildingId')), 'Tòa nhà không tồn tại.');
});

export const managementUpdateBuilding = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return requireFound(
    await serviceUpdateBuilding(pool, identity, pathParam(req, 'buildingId'), parseBuildingPatch(req.body)),
    'Tòa nhà không tồn tại.',
  );
});

export const managementListRooms = endpoint(200, async (req, pool) =>
  serviceListRooms(pool, parseRoomQuery(req.query)));

export const managementCreateRoom = endpoint(201, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCreateRoom(pool, identity, parseRoomCreate(req.body));
});

export const managementGetRoom = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return requireFound(await serviceGetRoom(pool, pathParam(req, 'roomId')), 'Phòng không tồn tại.');
});

export const managementUpdateRoom = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return requireFound(
    await serviceUpdateRoom(pool, identity, pathParam(req, 'roomId'), parseRoomPatch(req.body)),
    'Phòng không tồn tại.',
  );
});

export const managementGetPeriod = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return serviceGetPeriod(pool);
});

export const managementUpdatePeriod = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceUpdatePeriod(pool, identity, parsePeriodPatch(req.body).status);
});

export const managementListApplications = endpoint(200, async (req, pool) =>
  serviceListApplications(pool, parseApplicationQuery(req.query)));

export const managementGetApplication = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return requireFound(
    await serviceGetApplication(pool, pathParam(req, 'applicationId')),
    'Đơn đăng ký không tồn tại.',
  );
});

export const managementApproveApplication = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceApproveApplication(
    pool,
    identity,
    pathParam(req, 'applicationId'),
    parseApplicationApprove(req.body),
  );
});

export const managementRejectApplication = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceRejectApplication(
    pool,
    identity,
    pathParam(req, 'applicationId'),
    parseApplicationReject(req.body),
  );
});

export const managementListResidences = endpoint(200, async (req, pool) =>
  serviceListResidences(pool, parseResidenceQuery(req.query)));

export const managementGetResidence = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return requireFound(
    await serviceGetResidence(pool, pathParam(req, 'residenceId')),
    'Hồ sơ lưu trú không tồn tại.',
  );
});

export const managementCheckIn = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCheckIn(pool, identity, pathParam(req, 'residenceId'), parseCheckIn(req.body));
});

export const managementCancelAllocation = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCancelAllocation(
    pool,
    identity,
    pathParam(req, 'residenceId'),
    parseCancelAllocation(req.body),
  );
});

export const managementCheckOut = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCheckOut(pool, identity, pathParam(req, 'residenceId'), parseCheckOut(req.body));
});

export const managementListReceipts = endpoint(200, async (req, pool) =>
  serviceListReceipts(pool, parseReceiptQuery(req.query)));

export const managementCreateReceipt = endpoint(201, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return serviceCreateReceipt(pool, identity, parseReceiptCreate(req.body));
});

export const managementGetReceipt = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return requireFound(
    await serviceGetReceipt(pool, pathParam(req, 'receiptId')),
    'Phiếu thu không tồn tại.',
  );
});

export const managementPayReceipt = endpoint(200, async (req, pool) => {
  const identity = getIdentity(req);
  parseEmptyQuery(req.query);
  return servicePayReceipt(pool, identity, pathParam(req, 'receiptId'), parseReceiptPay(req.body));
});

export const managementGetStatistics = endpoint(200, async (req, pool) => {
  parseEmptyQuery(req.query);
  return serviceGetStatistics(pool);
});
