import { ApiError, isRecord } from '../api/client.ts';
import { UUID_PATTERN } from '../auth/contracts.ts';
import { schemas } from './schema.ts';
export type SchemaName = keyof typeof schemas;
interface Shape {
    type?: string | readonly string[];
    properties?: Record<string, Shape>;
    required?: readonly string[];
    additionalProperties?: boolean;
    minProperties?: number;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    enum?: readonly unknown[];
    const?: unknown;
    format?: string;
    $ref?: string;
}
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
function issues(shape: Shape, value: unknown, field = ''): string[] {
    if (shape.$ref)
        return issues(schemas[shape.$ref.split('/').pop() as SchemaName], value, field);
    if (value === null && (shape.type === 'null' || Array.isArray(shape.type) && shape.type.includes('null')))
        return [];
    if (shape.enum && !shape.enum.includes(value) || shape.const !== undefined && value !== shape.const)
        return [field];
    const types = Array.isArray(shape.type) ? shape.type : [shape.type];
    if (types.includes('object')) {
        if (!isRecord(value))
            return [field];
        const errors = (shape.required ?? []).filter(k => !(k in value)).map(k => field ? field + '.' + k : k);
        if (shape.minProperties && Object.keys(value).length < shape.minProperties)
            errors.push(field);
        for (const [key, item] of Object.entries(value)) {
            const child = shape.properties?.[key];
            if (!child) {
                if (shape.additionalProperties === false)
                    errors.push(key);
            }
            else
                errors.push(...issues(child, item, field ? field + '.' + key : key));
        }
        return errors;
    }
    if (types.includes('integer'))
        return typeof value === 'number' && Number.isSafeInteger(value) && (shape.minimum === undefined || value >= shape.minimum) && (shape.maximum === undefined || value <= shape.maximum) ? [] : [field];
    if (types.includes('boolean'))
        return typeof value === 'boolean' ? [] : [field];
    if (typeof value !== 'string' || !types.includes('string'))
        return [field];
    if (shape.minLength !== undefined && [...value].length < shape.minLength || shape.maxLength !== undefined && [...value].length > shape.maxLength || shape.pattern && !new RegExp(shape.pattern).test(value))
        return [field];
    if (shape.format === 'uuid' && !UUID_PATTERN.test(value) || shape.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || shape.format === 'date' && !validDate(value) || shape.format === 'date-time' && (!/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))))
        return [field];
    if (['feeVnd', 'amountVnd'].includes(field.split('.').pop()!) && (!/^(0|[1-9][0-9]{0,18})$/.test(value) || BigInt(value) > BigInt('9223372036854775807')))
        return [field];
    return [];
}
export function inputErrors(name: SchemaName, value: unknown): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const key of issues(schemas[name], value))
        errors[key] = 'Thông tin chưa hợp lệ. Kiểm tra định dạng và giới hạn của trường.';
    if (isRecord(value))
        for (const key of ['dateOfBirth', 'checkInDate', 'checkOutDate', 'paymentDate'])
            if (typeof value[key] === 'string' && value[key] > today())
                errors[key] = 'Ngày không được trong tương lai.';
    return errors;
}
export function decode<T>(name: SchemaName, value: unknown): T {
    if (issues(schemas[name], value).length)
        throw new ApiError('UNEXPECTED_RESPONSE');
    if (name === 'Room' && isRecord(value) && Number(value.allocatedPlaces) + Number(value.availablePlaces) !== value.capacity)
        throw new ApiError('UNEXPECTED_RESPONSE');
    return value as T;
}
