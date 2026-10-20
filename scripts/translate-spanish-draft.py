import json,urllib.request,urllib.parse,re,time,concurrent.futures,threading
from pathlib import Path
root=Path('art/spanish');keys=json.loads((root/'source-keys.json').read_text(encoding='utf-8-sig'));cachepath=root/'draft.json'
cache=json.loads(cachepath.read_text(encoding='utf-8')) if cachepath.exists() else {}
lock=threading.Lock()

def keep_space(src,dst):return re.match(r'^\s*',src).group()+dst.strip()+re.search(r'\s*$',src).group()
def request(group):
 text='\n'.join('[[MTNE%04d]]\n%s'%(i,k) for i,k in enumerate(group))+'\n[[MTNE%04d]]'%len(group)
 tokens=[]
 def protect(m):
  tokens.append(m.group());return 'ZXQPH'+str(len(tokens)-1)+'ZXQ'
 text=re.sub(r'\{[A-Za-z][A-Za-z0-9_]*\}',protect,text)
 ranks=json.loads((root/'ranks.json').read_text(encoding='utf-8'))
 rank_pattern=r'(?<![A-Za-z])(?:'+'|'.join(re.escape(r) for r in sorted(ranks,key=len,reverse=True))+r')(?![A-Za-z])'
 text=re.sub(rank_pattern,protect,text)
 url='https://translate.googleapis.com/translate_a/single?'+urllib.parse.urlencode(dict(client='gtx',sl='en',tl='es',dt='t',q=text))
 for attempt in range(3):
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'})
   d=json.load(urllib.request.urlopen(req,timeout=45));translated=''.join(p[0] for p in d[0] if p[0])
   for j,token in enumerate(tokens):translated=re.sub(r'ZXQ\s*PH\s*'+str(j)+r'\s*ZXQ',lambda m:token,translated,flags=re.I)
   markers=list(re.finditer(r'\[\[\s*MTNE\s*(\d+)\s*\]\]',translated,re.I))
   if len(markers)!=len(group)+1:raise ValueError('Batch markers changed')
   result={}
   for i,k in enumerate(group):
    v=translated[markers[i].end():markers[i+1].start()].strip();v=re.sub(r'\{\s*v\s*(\d+)\s*\}',r'{v\1}',v)
    if sorted(re.findall(r'\{[A-Za-z][A-Za-z0-9_]*\}',k))!=sorted(re.findall(r'\{[A-Za-z][A-Za-z0-9_]*\}',v)):raise ValueError('Placeholder changed')
    result[k]=keep_space(k,v)
   with lock:
    cache.update(result);cachepath.write_text(json.dumps(cache,ensure_ascii=False,indent=2),encoding='utf-8');print('Saved',len(cache),'/',len(keys),flush=True)
   time.sleep(.25);return
  except Exception as e:
   if attempt==2:
    if len(group)>1:
     mid=len(group)//2;request(group[:mid]);request(group[mid:]);return
    with lock:print('FAILED:',repr(group[0][:90]),type(e).__name__,flush=True)
    return
   time.sleep(1+attempt*2)
missing=[k for k in keys if k not in cache];groups=[];batch=[];size=0
for k in missing:
 if batch and size+len(k)>2300:groups.append(batch);batch=[];size=0
 batch.append(k);size+=len(k)+25
if batch:groups.append(batch)
print('Translate',len(missing),'keys in',len(groups),'batches',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(request,groups))
print('Complete',len(cache),'of',len(keys),flush=True)
