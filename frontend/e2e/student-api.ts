import type { Page, Route } from '@playwright/test';
import type { Application, Residence, Receipt } from '../src/lib/student/schema';
import { uuid, time, profile, room, room2, building, application, residence, receipt } from '../tests/student-fixtures';
export async function studentApi(page: Page, options: {
    role?: string;
    mode?: 'new' | 'pending' | 'approved' | 'rejected' | 'ended' | 'cancelled';
    closed?: boolean;
    retired?: boolean;
    lost?: boolean;
    error?: string;
    session?: boolean;
} = {}) {
    const mode = options.mode ?? 'new';
    const state = { profile: structuredClone(profile), rooms: [structuredClone(room), structuredClone(room2), { ...room, id: uuid(5), code: 'B202', gender: 'FEMALE' as const, buildingCode: 'B', buildingName: 'Tòa B', capacity: 4, allocatedPlaces: 2, availablePlaces: 2 }], buildings: [structuredClone(building)], applications: [] as Application[], residences: [] as Residence[], receipts: [] as Receipt[], period: options.closed ? 'CLOSED' : 'OPEN', session: options.session ?? true, expired: false, role: options.role ?? 'SV', csrf: 'a'.repeat(64), lost: options.lost, error: options.error, calls: [] as {
            path: string;
            method: string;
            query: Record<string, string>;
            body: Record<string, unknown> | null;
            csrf: string | undefined;
        }[] };
    if (mode !== 'new')
        state.applications = [{ ...application, status: mode === 'pending' ? 'PENDING' : mode === 'rejected' ? 'REJECTED' : 'APPROVED', rejectionReason: mode === 'rejected' ? 'Thiếu điều kiện của kỳ lưu trú.' : null }];
    if (['approved', 'ended', 'cancelled'].includes(mode)) {
        state.residences = [{ ...residence, status: mode === 'approved' ? 'ALLOCATED' : mode === 'ended' ? 'ENDED' : 'CANCELLED', checkInDate: mode === 'ended' ? '2026-10-28' : null, checkOutDate: mode === 'ended' ? '2026-11-04' : null, cancellationReason: mode === 'cancelled' ? 'Không đến nhận phòng.' : null }];
        state.receipts = [structuredClone(receipt)];
    }
    const fail = (route: Route, status: number, code: string) => route.fulfill({ status, json: { error: { code, message: 'Test error' } } });
    await page.route('**/api/v1/**', async (route) => {
        const request = route.request(), url = new URL(request.url()), path = url.pathname, method = request.method(), body = request.postData() ? request.postDataJSON() as Record<string, unknown> : null;
        state.calls.push({ path, method, query: Object.fromEntries(url.searchParams), body, csrf: request.headers()['x-csrf-token'] });
        const identity = { accountId: uuid(98), actorKind: state.role === 'SV' ? 'STUDENT' : 'STAFF', role: state.role, studentId: state.role === 'SV' ? profile.id : null, identifier: 'SV0001', displayName: profile.fullName };
        if (path.endsWith('/auth/me'))
            return state.session ? route.fulfill({ json: { data: identity } }) : fail(route, 401, state.expired ? 'SESSION_EXPIRED' : 'AUTH_REQUIRED');
        if (path.endsWith('/auth/csrf'))
            return route.fulfill({ json: { data: { csrfToken: state.csrf } } });
        if (method !== 'GET' && request.headers()['x-csrf-token'] !== state.csrf)
            return fail(route, 403, 'CSRF_INVALID');
        if (path.endsWith('/auth/login')) {
            state.session = true;
            state.expired = false;
            state.csrf = 'b'.repeat(64);
            return route.fulfill({ json: { data: identity } });
        }
        if (path.endsWith('/auth/logout')) {
            state.session = false;
            return route.fulfill({ status: 204, body: '' });
        }
        if (!state.session)
            return fail(route, 401, state.expired ? 'SESSION_EXPIRED' : 'AUTH_REQUIRED');
        if (path.endsWith('/auth/change-password')) {
            state.csrf = 'b'.repeat(64);
            return route.fulfill({ status: 204, body: '' });
        }
        if (state.role !== 'SV')
            return fail(route, 403, 'FORBIDDEN');
        if (!path.startsWith('/api/v1/student/'))
            return fail(route, 403, 'FORBIDDEN');
        const answer = (value: unknown) => route.fulfill({ json: { data: value } });
        if (path.endsWith('/profile')) {
            if (method === 'PATCH') {
                Object.assign(state.profile, body);
                if (state.lost) {
                    state.lost = false;
                    return route.abort('failed');
                }
            }
            return answer(state.profile);
        }
        if (path.endsWith('/registration-period'))
            return answer({ id: 1, status: state.period, updatedBy: null, updatedAt: time });
        const [collection, id] = path.split('/').slice(4);
        const lists = { buildings: state.buildings, rooms: state.rooms, applications: state.applications, residences: state.residences, receipts: state.receipts };
        const list = lists[collection as keyof typeof lists];
        if (!list)
            return fail(route, 404, 'NOT_FOUND');
        if (method === 'POST' && collection === 'applications') {
            if (state.error) {
                const error = state.error;
                state.error = undefined;
                return fail(route, error === 'CSRF_INVALID' ? 403 : 409, error);
            }
            if (Object.keys(body ?? {}).join(',') !== 'preferredRoomId')
                return fail(route, 422, 'VALIDATION_ERROR');
            if (state.applications.some(a => a.status === 'PENDING'))
                return fail(route, 409, 'PENDING_APPLICATION_EXISTS');
            const created = { ...application, preferredRoomId: String(body?.preferredRoomId) };
            state.applications.unshift(created);
            if (state.lost) {
                state.lost = false;
                return route.abort('failed');
            }
            return answer(created);
        }
        if (method !== 'GET')
            return fail(route, 403, 'FORBIDDEN');
        if (id) {
            const value = list.find(x => x.id === id);
            if (!value || collection === 'rooms' && options.retired && id === room2.id)
                return fail(route, 404, 'NOT_FOUND');
            return answer(value);
        }
        const allowed = collection === 'rooms' ? ['page', 'pageSize', 'q', 'buildingId', 'gender', 'hasAvailability'] : collection === 'buildings' ? ['page', 'pageSize'] : ['page', 'pageSize', 'status'];
        if ([...url.searchParams.keys()].some(key => !allowed.includes(key)))
            return fail(route, 422, 'VALIDATION_ERROR');
        const values = list.filter(item => { const x = item as unknown as Record<string, unknown>; return [...url.searchParams].every(([key, value]) => { if (['page', 'pageSize'].includes(key))
            return true; if (key === 'q')
            return String(x.code + ' ' + x.buildingName).toLowerCase().includes(value.toLowerCase()); if (key === 'hasAvailability')
            return String(Number(x.availablePlaces) > 0) === value; return String(x[key]) === value; }); });
        const number = Number(url.searchParams.get('page') ?? 1), size = Number(url.searchParams.get('pageSize') ?? 20);
        return route.fulfill({ json: { data: values.slice((number - 1) * size, number * size), meta: { page: number, pageSize: size, totalItems: values.length, totalPages: Math.ceil(values.length / size) } } });
    });
    return state;
}
