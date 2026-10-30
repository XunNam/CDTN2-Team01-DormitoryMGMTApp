"""Generate API index, OpenAPI JSON and HTTP requests from canonical definitions."""
from pathlib import Path
import json, copy, re
ROOT=Path(__file__).resolve().parents[1]
def build():
    manifest=json.loads((ROOT/'Coordination/contract-manifest.json').read_text(encoding='utf-8'))
    schemas=json.loads((ROOT/'API Endpoint/Shared/schemas.json').read_text(encoding='utf-8'))['schemas']
    examples=json.loads((ROOT/'API Endpoint/Shared/examples.json').read_text(encoding='utf-8'))
    codes=json.loads((ROOT/'API Endpoint/Shared/error-codes.json').read_text(encoding='utf-8'))
    spec={'openapi':'3.1.0','info':{'title':'DormFlow API','version':manifest['revision'],'description':'Specified, business endpoints not yet implemented. Markdown contracts and Shared schemas are authoritative.'},'servers':[{'url':'http://localhost:3001'}],'paths':{},'components':{'schemas':schemas,'securitySchemes':{'sessionCookie':{'type':'apiKey','in':'cookie','name':'dormflow.sid'},'csrfHeader':{'type':'apiKey','in':'header','name':'X-CSRF-Token'}}}}
    index=['# Danh mục API revision '+manifest['revision'],'','**SPECIFIED_NOT_IMPLEMENTED.** Danh mục HTTP dùng chung cho ba role. Đọc [AGENTS](AGENTS.md), [Shared](Shared/00-conventions.md), [DTO](Shared/03-data-contracts.md), [schema PostgreSQL](../SQL/schema.sql) và [hướng dẫn nhận việc](../Coordination/README.md).','','51 operation: 5 Shared, 13 SV, 28 BQL, 5 ADMIN. Shared không là role thứ tư. Role người làm không đồng nghĩa role tài khoản thử nghiệm.','','| operationId | Method | URL | Role | Contract | Code |','|---|---|---|---|---|---|']
    http=['@baseUrl = http://localhost:3001','@origin = http://localhost:3000','@csrf = REPLACE_WITH_TOKEN_FROM_GET_CSRF','@roomId = 00000000-0000-4000-8000-000000000001','@studentId = 00000000-0000-4000-8000-000000000001','@buildingId = 00000000-0000-4000-8000-000000000001','@applicationId = 00000000-0000-4000-8000-000000000001','@residenceId = 00000000-0000-4000-8000-000000000001','@receiptId = 00000000-0000-4000-8000-000000000001','@accountId = 00000000-0000-4000-8000-000000000001','@actorKind = STUDENT','','# Dữ liệu giả; nhập ID seed thực tế. REST client cần lưu cookie.','## GETcsrf -> login -> GETcsrf mới -> gọi role đã đăng nhập.']
    for op in manifest['operations']:
        oid=op['operationId'];method=op['method'];path=op['path'];request=op['request'];response=op['response'];unsafe=method in ['POST','PATCH']
        status='204' if oid in ['logout','changePassword'] else ('201' if method=='POST' and 'Create' in oid else '200')
        x={'operationId':oid,'tags':[op['role']],'summary':oid,'description':'Xem '+op['contract']+'; mã yêu cầu '+op['fr']+'. Chưa triển khai business/auth runtime.','parameters':[],'responses':{},'security':[] if oid=='getCsrfToken' else [{'sessionCookie':[],**({'csrfHeader':[]} if unsafe else {})}]}
        for part in path.split('/'):
            if part.startswith('{'):
                n=part[1:-1];x['parameters'].append({'name':n,'in':'path','required':True,'schema':{'type':'string','enum':['STUDENT','STAFF']} if n=='actorKind' else {'type':'string','format':'uuid'}})
        if request.endswith('Query'):
            props=copy.deepcopy(schemas[request]['properties'])
            if op['role']=='SV':
                forbidden={'RoomQuery':['status'],'ApplicationQuery':['studentId','preferredRoomId'],'ResidenceQuery':['studentId','roomId'],'ReceiptQuery':['studentId','residenceId']}.get(request,[])
                for k in forbidden:props.pop(k,None)
            x['parameters'] += [{'name':k,'in':'query','required':False,'schema':v} for k,v in props.items()]
        elif unsafe:
            x['requestBody']={'required':True,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+request},'example':examples.get(request,{})}}}
        if unsafe:x['parameters'].append({'name':'Origin','in':'header','required':True,'schema':{'type':'string'},'example':'http://localhost:3000'})
        if oid=='logout':x['security']=[{'sessionCookie':[],'csrfHeader':[]},{}]
        if response=='None':x['responses'][status]={'description':'Không có body'}
        else:
            islist=response.endswith('[]');name=response[:-2] if islist else response
            out={'type':'object','additionalProperties':False,'required':['data'],'properties':{'data':{'type':'array','items':{'$ref':'#/components/schemas/'+name}} if islist else {'$ref':'#/components/schemas/'+name}}}
            data=[examples[name]] if islist else examples[name];ex={'data':data}
            if islist:
                out['required'].append('meta');out['properties']['meta']={'type':'object','additionalProperties':False,'required':['page','pageSize','totalItems','totalPages'],'properties':{k:{'type':'integer','minimum':0 if k in ['totalItems','totalPages'] else 1} for k in ['page','pageSize','totalItems','totalPages']}}
                ex['meta']={'page':1,'pageSize':20,'totalItems':1,'totalPages':1}
            if op['role'] != 'SHARED':
                body=(ROOT/op['contract']).read_text(encoding='utf-8').split('## '+oid+'\n',1)[1].split('\n## ',1)[0]
                success=body.split('### Thành công',1)[1]
                example_match=re.search(r'```json\s*(.*?)```',success,re.S)
                if example_match:ex=json.loads(example_match.group(1))
            x['responses'][status]={'description':'Thành công','content':{'application/json':{'schema':out,'example':ex}}}
        for ec in ['401','403','404','409','422','500','503']+(['400','413','415'] if unsafe else []):
            x['responses'][ec]={'description':'Theo Shared/04-errors.md và operation contract','content':{'application/json':{'schema':{'$ref':'#/components/schemas/Error'}}}}
        spec['paths'].setdefault(path,{})[method.lower()]=x
        rel=op['contract'].removeprefix('API Endpoint/')
        index.append('| `'+oid+'` | '+method+' | `'+path+'` | '+op['role']+' | [Chi tiết](<'+rel+'>) | `'+op['code']+'` |')
        hp=path
        for part in path.split('/'):
            if part.startswith('{'):hp=hp.replace(part,'{{'+part[1:-1]+'}}')
        http+=['','### '+oid,method+' {{baseUrl}}'+hp,'Accept: application/json']
        if unsafe and op['role']!='SHARED':
            body=(ROOT/op['contract']).read_text(encoding='utf-8').split('## '+oid+'\n',1)[1].split('\n## ',1)[0]
            request_part=body.split('### Điều kiện trước',1)[0]
            rm=re.search(r'```json\s*(.*?)```',request_part,re.S)
            if rm:x['requestBody']['content']['application/json']['example']=json.loads(rm.group(1))
        if unsafe:http+=['Origin: {{origin}}','X-CSRF-Token: {{csrf}}','Content-Type: application/json','',json.dumps(x['requestBody']['content']['application/json']['example'],ensure_ascii=False,indent=2)]
    index+=['','## Nguồn và đầu ra dẫn xuất','','Markdown mô tả hành vi và Shared/schemas.json định nghĩa dữ liệu. [OpenAPI JSON](openapi.json) và [request mẫu](requests.http) sinh bằng `python tools/build_contract_artifacts.py`; không sửa riêng bản dẫn xuất. Chạy `python tools/check_specification.py` để phát hiện lệch. Chưa coi việc có contract/OpenAPI là API đã hoạt động.','']
    (ROOT/'API Endpoint/README.md').write_text('\n'.join(index),encoding='utf-8')
    (ROOT/'API Endpoint/openapi.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'API Endpoint/requests.http').write_text('\n'.join(http)+'\n',encoding='utf-8')
    print('Generated',len(manifest['operations']),'operations')
if __name__=='__main__':build()
