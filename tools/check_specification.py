"""Offline consistency checks; does not claim PostgreSQL or business API runtime."""
from pathlib import Path
import json,re,uuid,datetime,hashlib
from urllib.parse import unquote
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def check(value,message):
    if not value:errors.append(message)
schemas=json.loads((ROOT/'API Endpoint/Shared/schemas.json').read_text(encoding='utf-8'))['schemas']
def validate(value,schema,label):
    if '$ref' in schema:return validate(value,schemas[schema['$ref'].split('/')[-1]],label)
    if 'oneOf' in schema:
        counts=[]
        for variant in schema['oneOf']:
            before=len(errors);validate(value,variant,label);counts.append(len(errors)==before);del errors[before:]
        return check(sum(counts)==1,label+': oneOf mismatch')
    typ=schema.get('type');types=typ if isinstance(typ,list) else [typ]
    actual='null' if value is None else 'boolean' if isinstance(value,bool) else 'integer' if isinstance(value,int) else 'number' if isinstance(value,float) else 'string' if isinstance(value,str) else 'array' if isinstance(value,list) else 'object' if isinstance(value,dict) else 'unknown'
    if actual not in types:return check(False,label+': type '+actual+' != '+str(types))
    if 'enum' in schema:check(value in schema['enum'],label+': enum')
    if 'const' in schema:check(value==schema['const'],label+': const')
    if value is None:return
    if actual=='object':
        for key in schema.get('required',[]):check(key in value,label+': missing '+key)
        check(len(value)>=schema.get('minProperties',0),label+': minProperties')
        for key,v in value.items():
            if key in schema['properties']:validate(v,schema['properties'][key],label+'.'+key)
            else:check(schema.get('additionalProperties',True),label+': unknown '+key)
    elif actual=='array':
        for i,v in enumerate(value):validate(v,schema['items'],label+str(i))
    elif actual=='string':
        check(len(value)>=schema.get('minLength',0),label+': minlength');check(len(value)<=schema.get('maxLength',float('inf')),label+': maxlength')
        if 'pattern' in schema:check(re.search(schema['pattern'],value) is not None,label+': pattern '+schema['pattern'])
        try:
            if schema.get('format')=='uuid':uuid.UUID(value)
            if schema.get('format')=='date':datetime.date.fromisoformat(value)
            if schema.get('format')=='date-time':datetime.datetime.fromisoformat(value.replace('Z','+00:00'))
        except ValueError:check(False,label+': format')
    elif actual in ['integer','number']:
        check(value>=schema.get('minimum',float('-inf')),label+': minimum');check(value<=schema.get('maximum',float('inf')),label+': maximum')
def main():
    manifest=json.loads((ROOT/'Coordination/contract-manifest.json').read_text(encoding='utf-8'))['operations']
    spec=json.loads((ROOT/'API Endpoint/openapi.json').read_text(encoding='utf-8'))
    check(spec['components']['schemas']==schemas,'stale OpenAPI schemas; run generator')
    ids=[o['operationId'] for o in manifest];check(len(ids)==51 and len(set(ids))==51,'operation IDs')
    check(len({(o['method'],o['path']) for o in manifest})==51,'duplicate method path')
    examples=json.loads((ROOT/'API Endpoint/Shared/examples.json').read_text(encoding='utf-8'))
    for name,value in examples.items():validate(value,schemas[name],name)
    docs=[f for f in ROOT.rglob('*.md') if not any(k in f.relative_to(ROOT).parts for k in ['node_modules','.git','.qa','dist'])]
    links=0
    for f in docs:
        text=f.read_text(encoding='utf-8');check(text.count('```')%2==0,str(f)+': code fence')
        for target in re.findall(r'\]\((<[^>]+>|[^)]+)\)',text):
            target=target.strip('<>').split('#')[0]
            if not target or re.match(r'^[a-zA-Z]+:',target):continue
            links+=1;check((f.parent/unquote(target)).exists(),str(f.relative_to(ROOT))+': missing link '+target)
    for o in manifest:
        doc=ROOT/o['contract'];check(doc.exists(),'missing contract '+o['contract'])
        check(o['operationId'] in doc.read_text(encoding='utf-8'),'missing section '+o['operationId'])
        check((ROOT/o['code']).is_dir(),'missing code location '+o['code'])
        x=spec['paths'][o['path']][o['method'].lower()];check(x['operationId']==o['operationId'],'OpenAPI mismatch')
        if o['role']!='SHARED':
            body=doc.read_text(encoding='utf-8').split('## '+o['operationId']+'\n',1)[1].split('\n## ',1)[0]
            expected=re.search(r'```json\s*(.*?)```',body.split('### Thành công',1)[1],re.S)
            if expected:
                actual=next(v['content']['application/json']['example'] for k,v in x['responses'].items() if k.startswith('2'))
                check(actual==json.loads(expected.group(1)),'stale OpenAPI success '+o['operationId'])
        for response in x['responses'].values():
            for media in response.get('content',{}).values():
                if 'example' in media:validate(media['example'],media['schema'],o['operationId']+' response')
        if 'requestBody' in x:
            for media in x['requestBody']['content'].values():validate(media['example'],media['schema'],o['operationId']+' request')
    source=ROOT/'Planning/Source/SRS_v2.pdf'
    check(hashlib.sha256(source.read_bytes()).hexdigest()=='14f09bfa0ace45f07694b5fa4209a92cce1c1a7109c0918c085a5b44ca419d69','SRS source changed')
    if errors:
        print('FAILED',len(errors));print('\n'.join(errors));raise SystemExit(1)
    print('PASS:',len(docs),'Markdown files,',links,'file links, 51 unique operations,',len(examples),'schema examples, OpenAPI requests/responses, SRS hash unchanged')
if __name__=='__main__':main()
