import json,re
from pathlib import Path
for language in ['fr','de']:
 d=json.loads((Path('art')/language/'draft.json').read_text(encoding='utf-8'))
 keys=json.loads((Path('art')/language/'source-keys.json').read_text(encoding='utf-8'))
 def nums(s):return [(m.group(),m.start(),m.end()) for m in re.finditer(r'\{[A-Za-z][A-Za-z0-9_]*\}|(?<![A-Za-z0-9])\d+(?:[.,\u00a0\u202f ]\d{3})*(?:[.,]\d+)*',s) if not m.group().startswith('{')]
 bad=[]
 for k,v in d.items():
  a,b=nums(k),nums(v)
  norm=lambda s:re.sub(r'[.,\s\u00a0\u202f]','',s)
  if len(a)==len(b) and all(norm(x[0])==norm(y[0]) for x,y in zip(a,b)):
   for x,y in reversed(list(zip(a,b))):v=v[:y[1]]+x[0]+v[y[2]:]
  elif [x[0] for x in a]!=[x[0] for x in b]:bad.append((k,v))
  if re.search('drug|production',k,re.I):
   v=re.sub(r'\bmédicaments\b','drogues',v,flags=re.I) if language=='fr' else re.sub(r'\bMedikamente\b','Drogen',v)
  if re.search('ammo|ammunition|rounds',k,re.I) and not re.search('casino|blackjack|roulette|poker|rounds played|completed rounds',k,re.I):
   v=re.sub(r'\btours\b','balles',v,flags=re.I) if language=='fr' else re.sub(r'\bRunden\b','Patronen',v)
  if 'Supporter' in k:
   for src in ['Grand partisan','Grand Partisan','grand partisan','Grand supporter','Großer Unterstützer','Große Unterstützer','Grand Unterstützer']:v=v.replace(src,'Grand Supporter')
   for src in ['partisan','Partisan','Unterstützer']:v=v.replace(src,'Supporter')
  if 'Luca' in k:v=v.replace('Lucas','Luca')
  d[k]=v
 Path('public/'+language+'.js').write_text('// Static '+('French' if language=='fr' else 'German')+' game resources. Player-authored content is never translated.\nexport const '+('french' if language=='fr' else 'german')+'=Object.freeze('+json.dumps(d,ensure_ascii=False,indent=2)+');\n',encoding='utf-8')
 print(language,'numeric reviews',len(bad))
 for k,v in bad[:8]:print(repr(k[:150]),'=>',repr(v[:150]))
 (Path('art')/language/'numeric-review.json').write_text(json.dumps(bad,ensure_ascii=False,indent=2),encoding='utf-8')
