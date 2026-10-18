import json,math,random
from pathlib import Path
src=json.loads(Path('art/world-city-boundaries.geojson').read_text())
specs=[('New York',['NEW YORK'],-74,40.7),('Miami',['MIAMI'],-80.2,25.8),('Los Angeles',['LOS ANGELES'],-118.25,34.05),('Chicago',['CHICAGO'],-87.65,41.85),('London',['LONDON'],-.12,51.5),('Amsterdam',['AMSTERDAM'],4.9,52.37),('Paris',['PARIS'],2.35,48.86),('Rome',['ROMA'],12.5,41.9),('Istanbul',['ISTANBUL'],29,41),('Dubai',['DUBAYY','AS SATWAH','AR RASHIDIYAH'],55.27,25.2),('Singapore',['SINGAPORE'],103.8,1.35),('Hong Kong',['VICTORIA','KOWLOON'],114.17,22.3),('Tokyo',['TOKYO'],139.75,35.7),('Sydney',['SYDNEY'],151.1,-33.86),('São Paulo',['SAO PAULO'],-46.63,-23.55)]
def area(p):return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(p,p[1:]+p[:1])))/2
def inside(pt,p):
 x,y=pt;c=False
 for a,b in zip(p,p[1:]+p[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:c=not c
 return c
def clip(poly,a,b,c):
 out=[]
 for u,v in zip(poly,poly[1:]+poly[:1]):
  du=a*u[0]+b*u[1]-c;dv=a*v[0]+b*v[1]-c
  if du<=0:out.append(u)
  if (du<=0)!=(dv<=0):
   t=du/(du-dv);out.append([u[0]+t*(v[0]-u[0]),u[1]+t*(v[1]-u[1])])
 return out
raw={}
for name,names,cx,cy in specs:
 rings=[]
 for f in src['features']:
  if f['properties'].get('NAME') not in names:continue
  p=f['geometry']['coordinates'][0]
  mx=sum(v[0] for v in p)/len(p);my=sum(v[1] for v in p)/len(p)
  if abs(mx-cx)<1.5 and abs(my-cy)<1:rings.append(p)
 if not rings:raise Exception(name)
 pts=[p for ring in rings for p in ring];cos=math.cos(cy*math.pi/180);areaKm=sum(area(r)*cos*111**2 for r in rings)
 raw[name]=(rings,areaKm,cos)
amin=min(v[1] for v in raw.values());amax=max(v[1] for v in raw.values());output={}
for idx,(name,(rings,km,cos)) in enumerate(raw.items()):
 count=40+round(20*math.log(km/amin)/math.log(amax/amin));pts=[p for r in rings for p in r];xmin=min(p[0]*cos for p in pts);xmax=max(p[0]*cos for p in pts);ymin=min(p[1] for p in pts);ymax=max(p[1] for p in pts);scale=min(790/(xmax-xmin),510/(ymax-ymin));offsetx=(900-(xmax-xmin)*scale)/2;offsety=(650-(ymax-ymin)*scale)/2
 projected=[[[round(offsetx+(x*cos-xmin)*scale,2),round(650-offsety-(y-ymin)*scale,2)] for x,y in r] for r in rings]
 rng=random.Random(7800+idx);candidates=[]
 while len(candidates)<1600:
  p=[rng.uniform(55,845),rng.uniform(65,585)]
  if any(inside(p,r) for r in projected):candidates.append(p)
 seeds=[candidates[0]]
 for k in range(1,count):
  # Mixed spacing makes a meaningful range of district/street sizes.
  subset=candidates[k*7:k*7+450] if k%3 else candidates[k*7:k*7+60]
  seeds.append(max(subset,key=lambda p:min((p[0]-s[0])**2+(p[1]-s[1])**2 for s in seeds)))
 cells=[]
 for i,u in enumerate(seeds):
  cell=[[0,0],[900,0],[900,650],[0,650]]
  for j,v in enumerate(seeds):
   if i!=j:cell=clip(cell,v[0]-u[0],v[1]-u[1],(v[0]**2+v[1]**2-u[0]**2-u[1]**2)/2)
  # Score actual intersection, keeping water outside all clickable cells.
  actual=sum(area(clipRing) for ring in projected if (clipRing:=__import__('functools').reduce(lambda p,v:clip(p,*v),[(v[0]-u[0],v[1]-u[1],(v[0]**2+v[1]**2-u[0]**2-u[1]**2)/2) for j,v in enumerate(seeds) if i!=j],ring)))
  cells.append({'path':'M'+'L'.join(','.join(str(round(z,2)) for z in p) for p in cell)+'Z','x':round(u[0],2),'y':round(u[1],2),'area':round(actual,2)})
 sortedcells=sorted(cells,key=lambda p:p['area']);small=sortedcells[:count//2];large=sortedcells[count//2:];arr=[]
 for slot in range(count):arr.append((small if (slot+idx*7)%6<3 and small else large if large else small).pop(0))
 output[name]={'count':count,'areaKm2':round(km),'outline':' '.join('M'+'L'.join(','.join(map(str,p)) for p in r)+'Z' for r in projected),'cells':arr,'source':'drei01/geojson-world-cities; historical urban footprints, simplified strategic rendering'}
Path('public/city-geography.js').write_text('// Geographic urban footprints; game territories are fictional subdivisions. Apache-2.0 source attribution: GEOGRAPHY-NOTICE.md\nexport const cityGeography='+json.dumps(output,separators=(',',':'),ensure_ascii=False)+';\n',encoding='utf-8')
print([(k,v['count'],v['areaKm2']) for k,v in output.items()])
