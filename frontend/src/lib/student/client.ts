import { ApiError, type SessionClient } from '../api/client.ts';
import { UUID_PATTERN } from '../auth/contracts.ts';
import { readPage } from '../admin/contracts.ts';
import { decode, inputErrors, type SchemaName } from './contracts.ts';
import type { Application, Building, ContactPatch, Receipt, RegistrationPeriod, Residence, Room, StudentProfile } from './schema.ts';
export interface Entities {
    rooms: Room;
    applications: Application;
    residences: Residence;
    receipts: Receipt;
}
export type Collection = keyof Entities;
export type Entity = Entities[Collection];
export type Query = Record<string, string | number | boolean | undefined>;
const entitySchemas: Record<Collection | 'buildings', SchemaName> = { rooms: 'Room', buildings: 'Building', applications: 'Application', residences: 'Residence', receipts: 'Receipt' };
const querySchemas: Record<Collection | 'buildings', SchemaName> = { rooms: 'RoomQuery', buildings: 'PageQuery', applications: 'ApplicationQuery', residences: 'ResidenceQuery', receipts: 'ReceiptQuery' };
function pathId(id: string) { if (!UUID_PATTERN.test(id))
    throw new ApiError('NOT_FOUND', 404); return encodeURIComponent(id.toLowerCase()); }
export function createStudentClient(api: SessionClient, studentId: string) {
    if (!UUID_PATTERN.test(studentId))
        throw new ApiError('UNEXPECTED_RESPONSE');
    function owned<T extends {
        studentId: string;
    }>(entity: T) { if (entity.studentId.toLowerCase() !== studentId.toLowerCase())
        throw new ApiError('UNEXPECTED_RESPONSE'); return entity; }
    function read<K extends Collection | 'buildings'>(collection: K, value: unknown) { const entity = decode<K extends Collection ? Entities[K] : Building>(entitySchemas[collection], value); if ('studentId' in entity)
        owned(entity); if (collection === 'rooms' && 'status' in entity && entity.status !== 'ACTIVE')
        throw new ApiError('UNEXPECTED_RESPONSE'); return entity; }
    async function list<K extends Collection | 'buildings'>(collection: K, query: Query = {}, signal?: AbortSignal) { const clean = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== '')); const errors = inputErrors(querySchemas[collection], clean); if (Object.keys(errors).length)
        throw new ApiError('VALIDATION_ERROR', 422, Object.entries(errors).map(([field, message]) => ({ field, message }))); const params = new URLSearchParams(Object.entries(clean).map(([key, value]) => [key, String(value)])); return readPage(await api.get('student/' + collection + '?' + params, signal), value => read(collection, value)); }
    async function get<K extends Collection>(collection: K, id: string, signal?: AbortSignal): Promise<Entities[K]> { const entity = read(collection, (await api.get('student/' + collection + '/' + pathId(id), signal))?.data) as Entities[K]; if (entity.id.toLowerCase() !== id.toLowerCase())
        throw new ApiError('UNEXPECTED_RESPONSE'); return entity; }
    async function profile(signal?: AbortSignal) { const value = decode<StudentProfile>('StudentProfile', (await api.get('student/profile', signal))?.data); if (value.id.toLowerCase() !== studentId.toLowerCase())
        throw new ApiError('UNEXPECTED_RESPONSE'); return value; }
    async function period(signal?: AbortSignal) { return decode<RegistrationPeriod>('RegistrationPeriod', (await api.get('student/registration-period', signal))?.data); }
    async function contact(input: ContactPatch, signal?: AbortSignal) { const errors = inputErrors('ContactPatch', input); if (Object.keys(errors).length)
        throw new ApiError('VALIDATION_ERROR', 422, Object.entries(errors).map(([field, message]) => ({ field, message }))); let received = false; try {
        const result = await api.mutate('student/profile', 'PATCH', input, signal);
        received = true;
        const value = decode<StudentProfile>('StudentProfile', result?.data);
        if (value.id.toLowerCase() !== studentId.toLowerCase() || Object.entries(input).some(([key, val]) => value[key as keyof ContactPatch] !== val))
            throw new ApiError('UNEXPECTED_RESPONSE');
        return value;
    }
    catch (error) {
        if (error instanceof ApiError && (error.ambiguous || received))
            throw new ApiError('CONTACT_OUTCOME_UNKNOWN', 0, [], true);
        throw error;
    } }
    async function apply(preferredRoomId: string, signal?: AbortSignal) { const input = { preferredRoomId }; const errors = inputErrors('ApplicationCreate', input); if (Object.keys(errors).length)
        throw new ApiError('VALIDATION_ERROR', 422); let received = false; try {
        const result = await api.mutate('student/applications', 'POST', input, signal);
        received = true;
        const application = owned(decode<Application>('Application', result?.data));
        if (application.preferredRoomId.toLowerCase() !== preferredRoomId.toLowerCase() || application.status !== 'PENDING')
            throw new ApiError('UNEXPECTED_RESPONSE');
        return application;
    }
    catch (error) {
        if (error instanceof ApiError && (error.ambiguous || received))
            throw new ApiError('APPLICATION_OUTCOME_UNKNOWN', 0, [], true);
        throw error;
    } }
    async function find<K extends Collection>(collection: K, predicate: (entity: Entities[K]) => boolean, signal?: AbortSignal): Promise<Entities[K] | null> { for (let page = 1;; page++) {
        const result = await list(collection, { page, pageSize: 100 }, signal);
        const found = result.data.find(predicate as (value: unknown) => boolean);
        if (found)
            return found as Entities[K];
        if (page >= result.meta.totalPages)
            return null;
    } }
    async function roomOrUnavailable(id: string, signal?: AbortSignal) { try {
        return await get('rooms', id, signal);
    }
    catch (error) {
        if (error instanceof ApiError && error.status === 404)
            return null;
        throw error;
    } }
    async function eligibility(signal?: AbortSignal) { const [student, registration, pending, allocated, checkedIn] = await Promise.all([profile(signal), period(signal), list('applications', { status: 'PENDING', page: 1, pageSize: 5 }, signal), list('residences', { status: 'ALLOCATED', page: 1, pageSize: 5 }, signal), list('residences', { status: 'CHECKED_IN', page: 1, pageSize: 5 }, signal)]); return { student, registration, pending: (pending.data[0] ?? null) as Application | null, active: (allocated.data[0] ?? checkedIn.data[0] ?? null) as Residence | null }; }
    return { list, get, profile, period, contact, apply, find, roomOrUnavailable, eligibility };
}
export type StudentClient = ReturnType<typeof createStudentClient>;
export function registrationBlock(room: Room, context: Awaited<ReturnType<StudentClient['eligibility']>>) { if (context.registration.status !== 'OPEN')
    return 'Kỳ đăng ký đang đóng. Bạn vẫn có thể tra cứu phòng.'; if (context.pending)
    return 'Bạn đã có đơn chờ duyệt. Theo dõi kết quả trước khi gửi đơn khác.'; if (context.active)
    return 'Bạn đã có hồ sơ lưu trú chưa kết thúc.'; if (room.gender !== context.student.gender)
    return 'Giới tính tiếp nhận của phòng không phù hợp với hồ sơ của bạn.'; if (room.availablePlaces <= 0)
    return 'Phòng hiện đã hết chỗ. Hãy chọn phòng khác.'; return ''; }
