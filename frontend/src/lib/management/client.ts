import { ApiError, type SessionClient } from '../api/client.ts';
import { UUID_PATTERN } from '../auth/contracts.ts';
import { readPage } from '../admin/contracts.ts';
import { decode, inputErrors, type SchemaName } from './contracts.ts';
import type * as S from './schema.ts';
export interface Entities {
    'student-profiles': S.StudentProfile;
    buildings: S.Building;
    rooms: S.Room;
    applications: S.Application;
    residences: S.Residence;
    receipts: S.Receipt;
}
export type Collection = keyof Entities;
export type Entity = Entities[Collection];
export type Query = Record<string, string | number | boolean | undefined>;
const entities: Record<Collection, SchemaName> = { 'student-profiles': 'StudentProfile', buildings: 'Building', rooms: 'Room', applications: 'Application', residences: 'Residence', receipts: 'Receipt' };
const queries: Record<Collection, SchemaName> = { 'student-profiles': 'StudentProfileQuery', buildings: 'BuildingQuery', rooms: 'RoomQuery', applications: 'ApplicationQuery', residences: 'ResidenceQuery', receipts: 'ReceiptQuery' };
export const operations = {
    profileCreate: ['student-profiles', 'POST', 'ProfileCreate', 'StudentProfile'], profileUpdate: ['student-profiles', 'PATCH', 'ProfilePatch', 'StudentProfile'],
    buildingCreate: ['buildings', 'POST', 'BuildingCreate', 'Building'], buildingUpdate: ['buildings', 'PATCH', 'BuildingPatch', 'Building'],
    roomCreate: ['rooms', 'POST', 'RoomCreate', 'Room'], roomUpdate: ['rooms', 'PATCH', 'RoomPatch', 'Room'],
    approve: ['applications', 'POST', 'ApplicationApprove', 'ApprovalResult', 'approve'], reject: ['applications', 'POST', 'ApplicationReject', 'Application', 'reject'],
    checkIn: ['residences', 'POST', 'CheckIn', 'Residence', 'check-in'], cancel: ['residences', 'POST', 'CancelAllocation', 'Residence', 'cancel'], checkOut: ['residences', 'POST', 'CheckOut', 'Residence', 'check-out'],
    receiptCreate: ['receipts', 'POST', 'ReceiptCreate', 'Receipt'], pay: ['receipts', 'POST', 'ReceiptPay', 'Receipt', 'pay'], period: ['registration-period', 'PATCH', 'PeriodPatch', 'RegistrationPeriod'],
} as const;
export type Operation = keyof typeof operations;
function validId(id: string) { if (!UUID_PATTERN.test(id))
    throw new ApiError('NOT_FOUND', 404); return encodeURIComponent(id.toLowerCase()); }
export function createManagementClient(api: SessionClient) {
    async function list<K extends Collection>(collection: K, query: Query = {}, signal?: AbortSignal) {
        const body = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''));
        const errors = inputErrors(queries[collection], body);
        if (Object.keys(errors).length)
            throw new ApiError('VALIDATION_ERROR', 422, Object.entries(errors).map(([field, message]) => ({ field, message })));
        const params = new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)]));
        return readPage(await api.get('management/' + collection + '?' + params, signal), v => decode<Entities[K]>(entities[collection], v));
    }
    async function get<K extends Collection>(collection: K, id: string, signal?: AbortSignal) {
        const data = decode<Entities[K]>(entities[collection], (await api.get('management/' + collection + '/' + validId(id), signal))?.data);
        if (data.id.toLowerCase() !== id.toLowerCase())
            throw new ApiError('UNEXPECTED_RESPONSE');
        return data;
    }
    async function statistics(signal?: AbortSignal) { return decode<S.Statistics>('Statistics', (await api.get('management/statistics', signal))?.data); }
    async function period(signal?: AbortSignal) { return decode<S.RegistrationPeriod>('RegistrationPeriod', (await api.get('management/registration-period', signal))?.data); }
    async function write(operation: Operation, body: Record<string, unknown>, id?: string, signal?: AbortSignal): Promise<Entity | S.ApprovalResult | S.RegistrationPeriod> {
        const [collection, method, input, output] = operations[operation];
        const errors = inputErrors(input, body);
        if (Object.keys(errors).length)
            throw new ApiError('VALIDATION_ERROR', 422, Object.entries(errors).map(([field, message]) => ({ field, message })));
        const create = operation.endsWith('Create'), suffix = operations[operation].length === 5 ? (operations[operation] as readonly string[])[4] : '';
        const path = 'management/' + collection + (operation === 'period' || create ? '' : '/' + validId(id ?? '')) + (suffix ? '/' + suffix : '');
        let received = false;
        try {
            const result = await api.mutate(path, method, body, signal);
            received = true;
            const value = decode<Entity | S.ApprovalResult | S.RegistrationPeriod>(output, result?.data);
            if (!create && operation !== 'period') {
                const entity = 'application' in value ? value.application : value;
                if (String(entity.id).toLowerCase() !== id?.toLowerCase())
                    throw new ApiError('UNEXPECTED_RESPONSE');
            }
            if (operation === 'approve') {
                const valueResult = value as S.ApprovalResult;
                if (valueResult.application.status !== 'APPROVED' || valueResult.residence.status !== 'ALLOCATED' || valueResult.residence.applicationId !== id || valueResult.residence.studentId !== valueResult.application.studentId || valueResult.residence.roomId !== body.roomId)
                    throw new ApiError('UNEXPECTED_RESPONSE');
            }
            const expected: Partial<Record<Operation, string>> = { reject: 'REJECTED', checkIn: 'CHECKED_IN', cancel: 'CANCELLED', checkOut: 'ENDED', pay: 'PAID', receiptCreate: 'UNPAID' };
            if (expected[operation] && (!('status' in value) || value.status !== expected[operation]))
                throw new ApiError('UNEXPECTED_RESPONSE');
            if (!('application' in value)) {
                for (const [key, inputValue] of Object.entries(body)) {
                    const responseKey = key === 'reason' ? (operation === 'reject' ? 'rejectionReason' : 'cancellationReason') : key;
                    if (!(responseKey in value) || (value as unknown as Record<string, unknown>)[responseKey] !== inputValue)
                        throw new ApiError('UNEXPECTED_RESPONSE');
                }
            }
            return value;
        }
        catch (error) {
            if (error instanceof ApiError && (error.ambiguous || received))
                throw new ApiError('WRITE_OUTCOME_UNKNOWN', 0, [], true);
            throw error;
        }
    }
    return { list, get, statistics, period, write };
}
export type ManagementClient = ReturnType<typeof createManagementClient>;
