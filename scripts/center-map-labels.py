"""Center labels in visible city/cell intersections without changing territory IDs."""
from pathlib import Path
import json,re,math
root=Path(__file__).resolve().parent.parent
p=root/'public/city-geography.js';source=p.read_text(encoding='utf-8')
prefix,payload=source.split('export const cityGeography=',1);data=json.loads(payload.strip().rstrip(';'))
def rings(path):
 return [[tuple(map(float,xy.split(','))) for xy in re.findall(r'(-?[\d.]+,-?[\d.]+)',ring)] for ring in path.split('M') if ring]
def inside(point,poly):
 x,y=point;result=False
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:result=not result
 return result
def distance(point,a,b):
 dx,dy=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy))) if dx or dy else 0
 return math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy)
for city in data.values():
 coast=rings(city['outline']);coast_edges=[(a,b) for ring in coast for a,b in zip(ring,ring[1:]+ring[:1])]
 for cell in city['cells']:
  poly=rings(cell['path'])[0];edges=coast_edges+list(zip(poly,poly[1:]+poly[:1]))
  def score(point):
   if not inside(point,poly) or not any(inside(point,ring) for ring in coast):return -1
   return min(distance(point,a,b) for a,b in edges)
  best=(cell['x'],cell['y']);radius=score(best)
  loX,hiX=min(x for x,y in poly),max(x for x,y in poly);loY,hiY=min(y for x,y in poly),max(y for x,y in poly)
  for level in range(3):
   sx,sy=(hiX-loX)/8,(hiY-loY)/8
   for i in range(9):
    for j in range(9):
     point=(loX+i*sx,loY+j*sy);r=score(point)
     if r>radius:best,radius=point,r
   loX,hiX=best[0]-sx,best[0]+sx;loY,hiY=best[1]-sy,best[1]+sy
  cell.update(x=round(best[0],2),y=round(best[1],2),labelRadius=round(max(0,radius),2))
p.write_text(prefix+'export const cityGeography='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Centered labels in',sum(len(c['cells']) for c in data.values()),'territories.')
