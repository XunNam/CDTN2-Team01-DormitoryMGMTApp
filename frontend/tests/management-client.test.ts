import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { ApiError, createSessionClient } from '../src/lib/api/client.ts';
import { createManagementClient, type Collection, type Operation } from '../src/lib/management/client.ts';
import { decode, inputErrors, validDate } from '../src/lib/management/contracts.ts';
import { schemas } from '../src/lib/management/schema.ts';
import { money } from '../src/lib/management/presentation.ts';
import { profile, building, room, application, residence, receipt, uuid } from '../e2e/management-api.ts';
const token = 'a'.repeat(64), data = (value: unknown) => Response.json({ data: value });
function mock(answer: (url: string, init: RequestInit) => Promise<Response> | Response) { const calls: {
    url: string;
    init: RequestInit;
}[] = []; const api = createSessionClient(async (url, init = {}) => { assert.equal(init.credentials, 'same-origin'); assert.equal(init.cache, 'no-store'); calls.push({ url: String(url), init }); if (String(url).endsWith('/auth/csrf'))
    return data({ csrfToken: token }); return answer(String(url), init); }); return { client: createManagementClient(api), calls }; }
test('generated contracts exactly match current shared schemas', () => { const source = JSON.parse(fs.readFileSync(new URL('../../API Endpoint/Shared/schemas.json', import.meta.url), 'utf8')).schemas; for (const [name, value] of Object.entries(schemas))
    assert.deepEqual(value, source[name]); });
for (const [collection, entity] of Object.entries({ 'student-profiles': profile, buildings: building, rooms: room, applications: application, residences: residence, receipts: receipt }))
    test('list and get ' + collection + ' use exact paths, validated pagination and UUID', async () => { const m = mock(url => url.includes('?') ? Response.json({ data: [entity], meta: { page: 1, pageSize: 5, totalItems: 1, totalPages: 1 } }) : data(entity)); assert.equal((await m.client.list(collection as Collection, { page: 1, pageSize: 5 })).data[0].id, entity.id); assert.equal((await m.client.get(collection as Collection, entity.id)).id, entity.id); assert.equal(m.calls[1].url, '/api/v1/management/' + collection + '/' + entity.id); await assert.rejects(m.client.get(collection as Collection, 'invalid'), { code: 'NOT_FOUND' }); assert.equal(m.calls.length, 2); });
const actions: [
    Operation,
    Record<string, unknown>,
    unknown,
    string,
    string
][] = [
    ['profileCreate', { studentCode: 'SV0001', fullName: profile.fullName, gender: 'MALE', className: 'K30', faculty: 'CNTT' }, { ...profile, className: 'K30', faculty: 'CNTT' }, 'student-profiles', 'POST'],
    ['profileUpdate', { phone: null }, profile, 'student-profiles/' + profile.id, 'PATCH'],
    ['buildingCreate', { code: 'A', name: 'Tòa A' }, building, 'buildings', 'POST'], ['buildingUpdate', { name: 'Tòa A' }, building, 'buildings/' + building.id, 'PATCH'],
    ['roomCreate', { buildingId: building.id, code: 'A101', capacity: 6, gender: 'MALE', feeVnd: '1000000', status: 'ACTIVE' }, room, 'rooms', 'POST'], ['roomUpdate', { feeVnd: '9007199254740993' }, { ...room, feeVnd: '9007199254740993' }, 'rooms/' + room.id, 'PATCH'],
    ['approve', { roomId: room.id }, { application: { ...application, status: 'APPROVED' }, residence }, 'applications/' + application.id + '/approve', 'POST'], ['reject', { reason: 'Không đủ điều kiện' }, { ...application, status: 'REJECTED', rejectionReason: 'Không đủ điều kiện' }, 'applications/' + application.id + '/reject', 'POST'],
    ['checkIn', { checkInDate: '2026-10-28' }, { ...residence, status: 'CHECKED_IN', checkInDate: '2026-10-28' }, 'residences/' + residence.id + '/check-in', 'POST'], ['cancel', { reason: 'Không đến nhận' }, { ...residence, status: 'CANCELLED', cancellationReason: 'Không đến nhận' }, 'residences/' + residence.id + '/cancel', 'POST'], ['checkOut', { checkOutDate: '2026-10-28' }, { ...residence, status: 'ENDED', checkOutDate: '2026-10-28' }, 'residences/' + residence.id + '/check-out', 'POST'],
    ['receiptCreate', { residenceId: residence.id }, receipt, 'receipts', 'POST'], ['pay', { paymentDate: '2026-10-28' }, { ...receipt, status: 'PAID', paymentDate: '2026-10-28' }, 'receipts/' + receipt.id + '/pay', 'POST'], ['period', { status: 'CLOSED' }, { id: 1, status: 'CLOSED', updatedBy: null, updatedAt: '2026-10-28T00:00:00.000Z' }, 'registration-period', 'PATCH']
];
for (const [operation, input, response, path, method] of actions)
    test(operation + ' sends only contract fields with CSRF and accepts authoritative response', async () => { const id = operation.startsWith('profile') ? profile.id : operation.startsWith('building') ? building.id : operation.startsWith('room') ? room.id : ['approve', 'reject'].includes(operation) ? application.id : ['checkIn', 'cancel', 'checkOut'].includes(operation) ? residence.id : receipt.id; const m = mock((url, init) => { assert.equal(url, '/api/v1/management/' + path); assert.equal(init.method, method); assert.deepEqual(JSON.parse(init.body as string), input); assert.equal((init.headers as Record<string, string>)['X-CSRF-Token'], token); return data(response); }); await m.client.write(operation, input, id); assert.equal(m.calls.filter(c => c.init.method !== 'GET').length, 1); });
test('filter false is preserved, literal search encoded, unsupported query never sent', async () => { const m = mock(url => { const query = new URL(url, 'http://test').searchParams; assert.equal(query.get('hasAvailability'), 'false'); assert.equal(query.get('q'), '%_ A & B'); return Response.json({ data: [], meta: { page: 1, pageSize: 5, totalItems: 0, totalPages: 0 } }); }); await m.client.list('rooms', { q: '%_ A & B', hasAvailability: false, page: 1, pageSize: 5 }); await assert.rejects(m.client.list('applications', { q: 'SV001' }), { code: 'VALIDATION_ERROR' }); assert.equal(m.calls.length, 1); });
test('stale state and full room surface server conflict without automatic retry', async () => { const m = mock(() => Response.json({ error: { code: 'ROOM_FULL' } }, { status: 409 })); await assert.rejects(m.client.write('approve', { roomId: room.id }, application.id), { code: 'ROOM_FULL', status: 409, ambiguous: false }); assert.equal(m.calls.length, 2); });
test('lost or malformed success blocks automatic mutation replay', async () => { for (const answer of [() => { throw new Error('lost'); }, () => data({ ...receipt, status: 'PAID', amountVnd: 1000000 }), () => data({ ...receipt, id: uuid(999), status: 'PAID' })]) {
    const m = mock(answer);
    await assert.rejects(m.client.write('pay', { paymentDate: '2026-10-28' }, receipt.id), { code: 'WRITE_OUTCOME_UNKNOWN', ambiguous: true });
    assert.equal(m.calls.filter(c => c.init.method === 'POST').length, 1);
} });
test('exact money beyond safe integer is preserved and database maximum enforced', () => { assert.equal(money('9007199254740993'), '9.007.199.254.740.993 ₫'); assert.equal(Object.keys(inputErrors('RoomPatch', { feeVnd: '9223372036854775807' })).length, 0); assert.ok(inputErrors('RoomPatch', { feeVnd: '9223372036854775808' }).feeVnd); assert.throws(() => decode('Receipt', { ...receipt, amountVnd: 1000000 }), ApiError); });
test('nullable clearing, immutable identifiers, real calendar dates and empty patch rules', () => { assert.deepEqual(inputErrors('ProfilePatch', { phone: null, email: null }), {}); assert.ok(inputErrors('ProfilePatch', { studentCode: 'NEW' }).studentCode); assert.ok(Object.keys(inputErrors('ProfilePatch', {})).length); assert.equal(validDate('2026-02-30'), false); assert.ok(inputErrors('CheckIn', { checkInDate: '2999-01-01' }).checkInDate); assert.ok(inputErrors('ApplicationReject', { rejectionReason: 'wrong key' }).reason); assert.ok(inputErrors('ReceiptCreate', { residenceId: residence.id, amountVnd: '1' }).amountVnd); });
test('room count invariants, wrong identifiers and missing statistics are rejected', async () => { assert.throws(() => decode('Room', { ...room, availablePlaces: 7 }), ApiError); const m = mock(() => data({ ...room, id: uuid(999) })); await assert.rejects(m.client.get('rooms', room.id), { code: 'UNEXPECTED_RESPONSE' }); assert.throws(() => decode('Statistics', { totalRooms: 0, availablePlaces: 0, currentResidents: 0 }), ApiError); });
test('statistics and period use independent protected GET endpoints', async () => { const m = mock(url => url.endsWith('/statistics') ? data({ totalRooms: 0, availablePlaces: 0, currentResidents: 0, unpaidReceipts: 0 }) : data({ id: 1, status: 'OPEN', updatedBy: null, updatedAt: '2026-10-28T00:00:00.000Z' })); assert.equal((await m.client.statistics()).unpaidReceipts, 0); assert.equal((await m.client.period()).status, 'OPEN'); });
