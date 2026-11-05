import type { Collection, Entity, ManagementClient } from '@/lib/management/client';
import type { StudentProfile, Room, Residence } from '@/lib/management/schema';
export interface Related {
    profiles: Record<string, StudentProfile>;
    rooms: Record<string, Room>;
    residences: Record<string, Residence>;
}
export async function hydrate(client: ManagementClient, collection: Collection, rows: Entity[], signal: AbortSignal): Promise<Related> {
    const related: Related = { profiles: {}, rooms: {}, residences: {} };
    const residenceIds = [...new Set(rows.flatMap(x => 'residenceId' in x ? [x.residenceId] : []))];
    await Promise.all(residenceIds.map(async (id) => { related.residences[id] = await client.get('residences', id, signal); }));
    const combined = [...rows, ...Object.values(related.residences)];
    const studentIds = [...new Set(combined.flatMap(x => 'studentId' in x ? [x.studentId] : []))];
    const roomIds = [...new Set(combined.flatMap(x => 'preferredRoomId' in x ? [x.preferredRoomId] : 'roomId' in x ? [x.roomId] : []))];
    await Promise.all([...studentIds.map(async (id) => { related.profiles[id] = await client.get('student-profiles', id, signal); }), ...roomIds.map(async (id) => { related.rooms[id] = await client.get('rooms', id, signal); })]);
    return related;
}
export function summary(entity: Entity, related?: Related): string[] {
    if ('studentCode' in entity)
        return [entity.fullName, entity.studentCode, entity.className + ' · ' + entity.faculty, entity.gender];
    if ('buildingName' in entity)
        return [entity.code, entity.buildingName, (entity.availablePlaces + ' / ' + entity.capacity) + ' chỗ trống', entity.status];
    if ('name' in entity)
        return [entity.name, entity.code, 'Tòa nhà', 'Danh mục'];
    const residence = 'residenceId' in entity ? related?.residences[entity.residenceId] : undefined;
    const student = 'studentId' in entity ? related?.profiles[entity.studentId] : residence ? related?.profiles[residence.studentId] : undefined;
    const roomId = 'preferredRoomId' in entity ? entity.preferredRoomId : 'roomId' in entity ? entity.roomId : residence?.roomId;
    const room = roomId ? related?.rooms[roomId] : undefined;
    return [student?.fullName ?? 'Hồ sơ sinh viên', student?.studentCode ?? entity.id, room ? room.code + ' · ' + room.buildingName : 'Đang cập nhật', entity.status];
}
export const titles: Record<Collection, string> = { 'student-profiles': 'Hồ sơ sinh viên', buildings: 'Tòa nhà', rooms: 'Tòa nhà và phòng', applications: 'Đơn đăng ký', residences: 'Quá trình lưu trú', receipts: 'Phiếu thu' };
export const statuses: Partial<Record<Collection, string[]>> = { 'student-profiles': ['MALE', 'FEMALE'], rooms: ['ACTIVE', 'INACTIVE'], applications: ['PENDING', 'APPROVED', 'REJECTED'], residences: ['ALLOCATED', 'CHECKED_IN', 'ENDED', 'CANCELLED'], receipts: ['UNPAID', 'PAID'] };
