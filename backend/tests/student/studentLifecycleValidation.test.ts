import assert from 'node:assert/strict';
import test from 'node:test';
import * as v from '../../src/roles/student/validation.js';
import { AppError } from '../../src/shared/http/errors.js';

test('Student lifecycle query/body allowlists block ownership overrides and malformed filters',()=>{
  const bad=(work:()=>unknown)=>assert.throws(work,e=>e instanceof AppError&&e.code==='VALIDATION_ERROR');
  bad(()=>v.studentCreateApplication({},{preferredRoomId:'invalid'}));
  bad(()=>v.studentCreateApplication({},{preferredRoomId:'00000000-0000-4000-8000-000000000001',studentId:'other'}));
  for(const parse of [v.studentListApplications,v.studentListResidences,v.studentListReceipts]) {
    bad(()=>parse({studentId:'other'}));bad(()=>parse({status:['PENDING','APPROVED']}));bad(()=>parse({status:'UNKNOWN'}));
    assert.deepEqual(parse({page:'2',pageSize:'1'}),{page:2,pageSize:1});
  }
  bad(()=>v.studentGetReceipt({receiptId:'invalid'},{}));
});
