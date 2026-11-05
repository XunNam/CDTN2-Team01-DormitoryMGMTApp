import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=JSON.parse(fs.readFileSync(path.join(root,'API Endpoint/Shared/schemas.json'),'utf8')).schemas;
const names=['StudentProfile','Building','Room','Application','Residence','Receipt','RegistrationPeriod','ContactPatch','ApplicationCreate','PageQuery','RoomQuery','ApplicationQuery','ResidenceQuery','ReceiptQuery'];
const selected=Object.fromEntries(names.map(name=>[name,structuredClone(source[name])]));
// Student contract narrows shared query schemas: ownership always comes from the session.
for(const name of ['RoomQuery','ApplicationQuery','ResidenceQuery','ReceiptQuery'])for(const key of Object.keys(selected[name].properties))if(!({RoomQuery:['page','pageSize','q','buildingId','gender','hasAvailability'],ApplicationQuery:['page','pageSize','status'],ResidenceQuery:['page','pageSize','status'],ReceiptQuery:['page','pageSize','status']}[name]).includes(key))delete selected[name].properties[key];
function type(s){if(s.const!==undefined)return JSON.stringify(s.const);if(s.enum)return s.enum.map(JSON.stringify).join(' | ');if(Array.isArray(s.type))return s.type.map(t=>type({...s,type:t})).join(' | ');if(s.type==='object')return '{ '+Object.entries(s.properties).map(([k,v])=>k+(s.required?.includes(k)?'':'?')+': '+type(v)).join('; ')+' }';return {string:'string',integer:'number',boolean:'boolean',null:'null'}[s.type]||'unknown';}
const output='// Generated from Shared schemas revision 1.0.0, narrowed to Student API contract query allowlists.\n'+names.map(n=>'export type '+n+' = '+type(selected[n])+';').join('\n')+'\nexport const schemas = '+JSON.stringify(selected,null,2)+' as const;\n';
const target=path.join(root,'frontend/src/lib/student/schema.ts');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);
