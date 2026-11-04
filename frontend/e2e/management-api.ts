import type { Page, Route } from '@playwright/test';
import type { StudentProfile, Building, Room, Application, Residence, Receipt } from '../src/lib/management/schema';
export const uuid = (n: number) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0');
const time = '2026-10-28T02:00:00.000Z', staff = uuid(99), token = 'a'.repeat(64);
export const profile: StudentProfile = { id: uuid(1), studentCode: 'SV0001', fullName: 'Sinh viên minh họa A', gender: 'MALE', className: 'K30-CNTT01', faculty: 'Công nghệ thông tin', phone: null, email: null, dateOfBirth: null, permanentAddress: null, createdAt: time, updatedAt: time };
export const building: Building = { id: uuid(2), code: 'A', name: 'Tòa A', createdAt: time, updatedAt: time };
export const room: Room = { id: uuid(3), buildingId: building.id, buildingCode: 'A', buildingName: 'Tòa A', code: 'A101', capacity: 6, gender: 'MALE', feeVnd: '1000000', status: 'ACTIVE', allocatedPlaces: 0, availablePlaces: 6, createdAt: time, updatedAt: time };
export const application: Application = { id: uuid(4), studentId: profile.id, preferredRoomId: room.id, periodId: 1, status: 'PENDING', rejectionReason: null, reviewedBy: null, reviewedAt: null, createdAt: time, updatedAt: time };
export const residence: Residence = { id: uuid(5), applicationId: application.id, studentId: profile.id, roomId: room.id, status: 'ALLOCATED', allocatedBy: staff, allocatedAt: time, checkInDate: null, checkedInBy: null, checkedInAt: null, checkOutDate: null, checkedOutBy: null, checkedOutAt: null, cancellationReason: null, cancelledBy: null, cancelledAt: null };
export const receipt: Receipt = { id: uuid(6), residenceId: residence.id, amountVnd: '1000000', status: 'UNPAID', createdBy: staff, createdAt: time, paymentDate: null, paidBy: null, paidAt: null };
type Call = {
    path: string;
    method: string;
    body: Record<string, unknown> | null;
    query: Record<string, string>;
};
export async function managementApi(page: Page, options: {
    role?: string;
    error?: string;
    lost?: boolean;
    withResidence?: boolean;
    withReceipt?: boolean;
} = {}) {
    const state = { profiles: [structuredClone(profile)], buildings: [structuredClone(building)], rooms: [structuredClone(room)], applications: [structuredClone(application)], residences: options.withResidence ? [structuredClone(residence)] : [] as Residence[], receipts: options.withReceipt ? [structuredClone(receipt)] : [] as Receipt[], period: 'OPEN', calls: [] as Call[], error: options.error, lost: options.lost, session: true, role: options.role ?? 'BQL' };
    const fail = (route: Route, status: number, code: string) => route.fulfill({ status, json: { error: { code, message: 'Test error' } } });
    await page.route('**/api/v1/**', async (route) => {
        const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method(), body = request.postData() ? request.postDataJSON() : null;
        state.calls.push({ path, method, body, query: Object.fromEntries(url.searchParams) });
        const identity = { actorKind: state.role === 'SV' ? 'STUDENT' : 'STAFF', role: state.role, accountId: staff, studentId: state.role === 'SV' ? profile.id : null, identifier: 'management.demo', displayName: 'Quản lý minh họa' };
        if (path.endsWith('/auth/me'))
            return state.session ? route.fulfill({ json: { data: identity } }) : fail(route, 401, 'SESSION_EXPIRED');
        if (path.endsWith('/auth/csrf'))
            return route.fulfill({ json: { data: { csrfToken: token } } });
        if (method !== 'GET' && request.headers()['x-csrf-token'] !== token)
            return fail(route, 403, 'CSRF_INVALID');
        if (path.endsWith('/auth/login')) {
            state.session = true;
            return route.fulfill({ json: { data: identity } });
        }
        if (path.endsWith('/auth/logout')) {
            state.session = false;
            return route.fulfill({ status: 204, body: '' });
        }
        if (!state.session)
            return fail(route, 401, 'SESSION_EXPIRED');
        if (path.endsWith('/auth/change-password'))
            return route.fulfill({ status: 204, body: '' });
        if (state.role !== 'BQL')
            return fail(route, 403, 'FORBIDDEN');
        if (method !== 'GET' && state.error) {
            const code = state.error;
            state.error = undefined;
            return fail(route, code === 'CSRF_INVALID' ? 403 : 409, code);
        }
        const answer = async (value: unknown) => { if (method !== 'GET' && state.lost) {
            state.lost = false;
            return route.abort('failed');
        } return route.fulfill({ json: { data: value } }); };
        if (path.endsWith('/statistics'))
            return answer({ totalRooms: state.rooms.filter(x => x.status === 'ACTIVE').length, availablePlaces: state.rooms.filter(x => x.status === 'ACTIVE').reduce((sum, x) => sum + x.capacity - state.residences.filter(r => r.roomId === x.id && ['ALLOCATED', 'CHECKED_IN'].includes(r.status)).length, 0), currentResidents: state.residences.filter(x => x.status === 'CHECKED_IN').length, unpaidReceipts: state.receipts.filter(x => x.status === 'UNPAID').length });
        if (path.endsWith('/registration-period')) {
            if (method === 'PATCH')
                state.period = body.status;
            return answer({ id: 1, status: state.period, updatedBy: staff, updatedAt: time });
        }
        const parts = path.split('/').slice(4), [collection, id, action] = parts;
        const collections = { 'student-profiles': state.profiles, buildings: state.buildings, rooms: state.rooms, applications: state.applications, residences: state.residences, receipts: state.receipts };
        const list = collections[collection as keyof typeof collections] as unknown as Record<string, unknown>[];
        if (!list)
            return fail(route, 404, 'NOT_FOUND');
        if (method === 'GET' && !id) {
            let items = list.filter(item => [...url.searchParams].every(([key, value]) => { if (['page', 'pageSize'].includes(key))
                return true; if (key === 'q')
                return Object.values(item).join(' ').toLowerCase().includes(value.toLowerCase()); if (key === 'studentId' && collection === 'receipts')
                return state.residences.find(r => r.id === item.residenceId)?.studentId === value; if (key === 'hasAvailability')
                return String(Number(item.availablePlaces) > 0) === value; return String(item[key]) === value; }));
            if (collection === 'rooms')
                items = items.map(item => { const occupied = state.residences.filter(r => r.roomId === item.id && ['ALLOCATED', 'CHECKED_IN'].includes(r.status)).length; return { ...item, allocatedPlaces: occupied, availablePlaces: Number(item.capacity) - occupied }; });
            const pageNumber = Number(url.searchParams.get('page') ?? 1), pageSize = Number(url.searchParams.get('pageSize') ?? 20);
            return route.fulfill({ json: { data: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), meta: { page: pageNumber, pageSize, totalItems: items.length, totalPages: Math.ceil(items.length / pageSize) } } });
        }
        const current = list.find(x => x.id === id);
        if (method === 'GET') {
            if (!current)
                return fail(route, 404, 'NOT_FOUND');
            if (collection === 'rooms') {
                const occupied = state.residences.filter(r => r.roomId === id && ['ALLOCATED', 'CHECKED_IN'].includes(r.status)).length;
                return answer({ ...current, allocatedPlaces: occupied, availablePlaces: Number(current.capacity) - occupied });
            }
            return answer(current);
        }
        if (method === 'PATCH' && current) {
            Object.assign(current, body);
            return answer(current);
        }
        if (!id && method === 'POST') {
            if (collection === 'student-profiles' && state.profiles.some(x => x.studentCode === body.studentCode))
                return fail(route, 409, 'DUPLICATE_STUDENT_CODE');
            if (collection === 'receipts') {
                if (state.receipts.some(x => x.residenceId === body.residenceId))
                    return fail(route, 409, 'RECEIPT_ALREADY_EXISTS');
                const created = { ...receipt, id: uuid(100 + list.length), residenceId: body.residenceId, amountVnd: state.rooms[0].feeVnd };
                list.push(created);
                return answer(created);
            }
            const base = collection === 'student-profiles' ? profile : collection === 'buildings' ? building : room;
            const created = { ...base, ...body, id: uuid(100 + list.length) };
            list.push(created);
            return answer(created);
        }
        if (!current)
            return fail(route, 404, 'NOT_FOUND');
        if (action === 'approve') {
            if (current.status !== 'PENDING')
                return fail(route, 409, 'INVALID_STATE');
            Object.assign(current, { status: 'APPROVED', reviewedBy: staff, reviewedAt: time });
            const created = { ...residence, roomId: body.roomId };
            state.residences.push(created);
            return answer({ application: current, residence: created });
        }
        if (action === 'reject') {
            Object.assign(current, { status: 'REJECTED', rejectionReason: body.reason, reviewedBy: staff, reviewedAt: time });
            return answer(current);
        }
        if (action === 'check-in') {
            Object.assign(current, { status: 'CHECKED_IN', checkInDate: body.checkInDate, checkedInBy: staff, checkedInAt: time });
            return answer(current);
        }
        if (action === 'cancel') {
            Object.assign(current, { status: 'CANCELLED', cancellationReason: body.reason, cancelledBy: staff, cancelledAt: time });
            return answer(current);
        }
        if (action === 'check-out') {
            Object.assign(current, { status: 'ENDED', checkOutDate: body.checkOutDate, checkedOutBy: staff, checkedOutAt: time });
            return answer(current);
        }
        if (action === 'pay') {
            Object.assign(current, { status: 'PAID', paymentDate: body.paymentDate, paidBy: staff, paidAt: time });
            return answer(current);
        }
        return fail(route, 404, 'NOT_FOUND');
    });
    return state;
}
