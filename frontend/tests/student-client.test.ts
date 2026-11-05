import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { ApiError, createSessionClient } from '../src/lib/api/client.ts';
import { createStudentClient, registrationBlock, type Collection } from '../src/lib/student/client.ts';
import { schemas } from '../src/lib/student/schema.ts';
import { inputErrors, decode, validDate } from '../src/lib/student/contracts.ts';
import { money } from '../src/lib/student/presentation.ts';
import { uuid, time, profile, room, room2, building, application, residence, receipt } from './student-fixtures.ts';
const token = 'a'.repeat(64), data = (value: unknown) => Response.json({ data: value });
function page(values: unknown[], n = 1, size = 5, total = values.length) { return Response.json({ data: values, meta: { page: n, pageSize: size, totalItems: total, totalPages: Math.ceil(total / size) } }); }
function mock(answer: (url: string, init: RequestInit) => Response | Promise<Response>) { const calls: {
    url: string;
    init: RequestInit;
}[] = []; const api = createSessionClient(async (url, init = {}) => { assert.equal(init.credentials, 'same-origin'); assert.equal(init.cache, 'no-store'); calls.push({ url: String(url), init }); return String(url).endsWith('/auth/csrf') ? data({ csrfToken: token }) : answer(String(url), init); }); return { client: createStudentClient(api, profile.id), calls }; }
test('generated DTOs match Shared and queries enforce narrower Student contract', () => { const source = JSON.parse(fs.readFileSync(new URL('../../API Endpoint/Shared/schemas.json', import.meta.url), 'utf8')).schemas; for (const [name, value] of Object.entries(schemas)) {
    const expected = structuredClone(source[name]);
    for (const key of Object.keys(expected.properties))
        if (!(key in value.properties))
            delete expected.properties[key];
    assert.deepEqual(value, expected);
} assert.deepEqual(Object.keys(schemas.ApplicationQuery.properties), ['page', 'pageSize', 'status']); assert.equal('status' in schemas.RoomQuery.properties, false); });
for (const [collection, value] of Object.entries({ rooms: room, applications: application, residences: residence, receipts: receipt }))
    test('list and detail ' + collection + ' use Student endpoints and validated ids', async () => { const m = mock(url => url.includes('?') ? page([value]) : data(value)); assert.equal((await m.client.list(collection as Collection, { page: 1, pageSize: 5 })).data[0].id, value.id); assert.equal((await m.client.get(collection as Collection, value.id)).id, value.id); assert.equal(m.calls[1].url, '/api/v1/student/' + collection + '/' + value.id); await assert.rejects(m.client.get(collection as Collection, 'bad'), { code: 'NOT_FOUND' }); });
test('buildings query is pagination only; profile and period take no query', async () => { const m = mock(url => url.includes('/buildings') ? page([building]) : url.endsWith('/profile') ? data(profile) : data({ id: 1, status: 'OPEN', updatedBy: null, updatedAt: time })); await m.client.list('buildings', { page: 1, pageSize: 5 }); await m.client.profile(); await m.client.period(); assert.equal(m.calls[1].url, '/api/v1/student/profile'); await assert.rejects(m.client.list('buildings', { q: 'A' }), { code: 'VALIDATION_ERROR' }); });
test('room filter false survives and literal search is encoded', async () => { const m = mock(url => { const q = new URL(url, 'http://test').searchParams; assert.equal(q.get('hasAvailability'), 'false'); assert.equal(q.get('q'), '%_ A & B'); return page([]); }); await m.client.list('rooms', { page: 1, pageSize: 5, hasAvailability: false, q: '%_ A & B' }); });
test('ownership filters and unknown request properties never reach the network', async () => { const m = mock(() => page([])); for (const collection of ['applications', 'residences', 'receipts'] as const) {
    await assert.rejects(m.client.list(collection, { studentId: uuid(999) }), { code: 'VALIDATION_ERROR' });
    await assert.rejects(m.client.list(collection, { q: 'SV0001' }), { code: 'VALIDATION_ERROR' });
} await assert.rejects(m.client.contact({ phone: '1234567', ...{ gender: 'FEMALE' } }), { code: 'VALIDATION_ERROR' }); assert.equal(m.calls.length, 0); });
test('wrong-owner profile/application/residence fail before rendering', async () => { for (const collection of ['applications', 'residences'] as const) {
    const record = collection === 'applications' ? application : residence;
    const m = mock(() => data({ ...record, studentId: uuid(999) }));
    await assert.rejects(m.client.get(collection, record.id), { code: 'UNEXPECTED_RESPONSE' });
} const m = mock(() => data({ ...profile, id: uuid(999) })); await assert.rejects(m.client.profile(), { code: 'UNEXPECTED_RESPONSE' }); });
test('apply sends preferredRoomId alone with CSRF and no studentId or reservation', async () => { const m = mock((url, init) => { assert.equal(url, '/api/v1/student/applications'); assert.equal(init.method, 'POST'); assert.deepEqual(JSON.parse(init.body as string), { preferredRoomId: room.id }); assert.equal((init.headers as Record<string, string>)['X-CSRF-Token'], token); return data(application); }); assert.equal((await m.client.apply(room.id)).status, 'PENDING'); assert.equal(m.calls.length, 2); });
test('business conflicts surface once without retries or fake success', async () => { for (const code of ['PERIOD_CLOSED', 'ROOM_FULL', 'ROOM_INACTIVE', 'GENDER_MISMATCH', 'PENDING_APPLICATION_EXISTS', 'ACTIVE_RESIDENCE_EXISTS']) {
    const m = mock(() => Response.json({ error: { code } }, { status: 409 }));
    await assert.rejects(m.client.apply(room.id), { code, status: 409, ambiguous: false });
    assert.equal(m.calls.filter(c => c.init.method === 'POST').length, 1);
} });
test('lost or malformed creation response freezes the outcome without replay', async () => { for (const answer of [() => { throw new Error('lost'); }, () => data({ ...application, preferredRoomId: room2.id }), () => data({ ...application, status: 'APPROVED' }), () => data({ ...application, studentId: uuid(999) })]) {
    const m = mock(answer);
    await assert.rejects(m.client.apply(room.id), { code: 'APPLICATION_OUTCOME_UNKNOWN', ambiguous: true });
    assert.equal(m.calls.filter(c => c.init.method === 'POST').length, 1);
} });
test('contact clear uses null and update contains only fields supplied', async () => { const m = mock((url, init) => { assert.equal(url, '/api/v1/student/profile'); assert.equal(init.method, 'PATCH'); assert.deepEqual(JSON.parse(init.body as string), { phone: null }); return data(profile); }); await m.client.contact({ phone: null }); assert.deepEqual(inputErrors('ContactPatch', { phone: null, email: null }), {}); assert.ok(Object.keys(inputErrors('ContactPatch', {})).length); });
test('ambiguous contact save requires read-back instead of resubmission', async () => { const m = mock(() => { throw new Error('lost'); }); await assert.rejects(m.client.contact({ email: null }), { code: 'CONTACT_OUTCOME_UNKNOWN', ambiguous: true }); assert.equal(m.calls.filter(c => c.init.method === 'PATCH').length, 1); });
test('history tolerates retired rooms but does not hide authorization or transport errors', async () => { const missing = mock(() => Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404 })); assert.equal(await missing.client.roomOrUnavailable(room.id), null); const forbidden = mock(() => Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })); await assert.rejects(forbidden.client.roomOrUnavailable(room.id), { code: 'FORBIDDEN' }); });
test('find traverses all paginated own history without unsupported filters', async () => { const m = mock(url => { const q = new URL(url, 'http://test').searchParams; assert.equal(q.has('applicationId'), false); return q.get('page') === '1' ? page([], 1, 100, 101) : page([residence], 2, 100, 101); }); assert.equal((await m.client.find('residences', x => x.applicationId === application.id))?.id, residence.id); assert.equal(m.calls.length, 2); });
test('registration gates pending, active, closed, gender and full rooms', () => { const context = { student: profile, registration: { id: 1 as const, status: 'OPEN' as const, updatedBy: null, updatedAt: time }, pending: null, active: null }; assert.equal(registrationBlock(room, context), ''); assert.ok(registrationBlock(room, { ...context, pending: application })); assert.ok(registrationBlock(room, { ...context, active: residence })); assert.ok(registrationBlock(room, { ...context, registration: { ...context.registration, status: 'CLOSED' } })); assert.ok(registrationBlock({ ...room, gender: 'FEMALE' }, context)); assert.ok(registrationBlock({ ...room, availablePlaces: 0 }, context)); });
test('money remains exact and malformed currency/counts/dates are rejected', () => { assert.equal(money('9007199254740993'), '9.007.199.254.740.993 ₫'); assert.throws(() => decode('Receipt', { ...receipt, amountVnd: 1000000 }), ApiError); assert.throws(() => decode('Room', { ...room, availablePlaces: 7 }), ApiError); assert.equal(validDate('2026-02-30'), false); assert.throws(() => decode('Receipt', { ...receipt, amountVnd: '9223372036854775808' }), ApiError); });
