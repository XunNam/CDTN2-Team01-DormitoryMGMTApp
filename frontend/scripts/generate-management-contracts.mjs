import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const schemas=JSON.parse(fs.readFileSync(path.join(root,'API Endpoint/Shared/schemas.json'),'utf8')).schemas;
const names=['StudentProfile','Building','Room','Application','Residence','Receipt','RegistrationPeriod','Statistics','ApprovalResult','StudentProfileQuery','BuildingQuery','RoomQuery','ApplicationQuery','ResidenceQuery','ReceiptQuery','ProfileCreate','ProfilePatch','BuildingCreate','BuildingPatch','RoomCreate','RoomPatch','PeriodPatch','ApplicationApprove','ApplicationReject','CheckIn','CancelAllocation','CheckOut','ReceiptCreate','ReceiptPay'];
function type(s){if(s.$ref)return s.$ref.split('/').at(-1);if(s.const!==undefined)return JSON.stringify(s.const);if(s.enum)return s.enum.map(v=>JSON.stringify(v)).join(' | ');if(Array.isArray(s.type))return s.type.map(t=>type({...s,type:t})).join(' | ');if(s.type==='object')return '{ '+Object.entries(s.properties).map(([k,v])=>k+(s.required?.includes(k)?'':'?')+': '+type(v)).join('; ')+' }';return {string:'string',integer:'number',boolean:'boolean',null:'null'}[s.type]||'unknown';}
const output='// Generated from API Endpoint/Shared/schemas.json revision 1.0.0. Regenerate with node scripts/generate-management-contracts.mjs.\n'+names.map(n=>'export type '+n+' = '+type(schemas[n])+';').join('\n')+'\nexport const schemas = '+JSON.stringify(Object.fromEntries(names.map(n=>[n,schemas[n]])),null,2)+' as const;\n';
const target=path.join(root,'frontend/src/lib/management/schema.ts');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);
