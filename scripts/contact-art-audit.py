from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFont
import hashlib,json,math
root=Path(__file__).resolve().parent.parent
items=json.loads((root/'art/full-art-inventory.json').read_text())
labels={}
for item in items:labels.setdefault(Path(item['image']).name,[]).append(item['group']+': '+item['name'])
files=sorted((root/'public/images').glob('*'),key=lambda p:(0 if p.name.startswith('page-') else 1,p.name))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
hashes={};visual={};sizes={};review=[]
for p in files:
 with Image.open(p) as im:
  sizes[p.name]=im.size
  pixel=hashlib.sha256(im.convert('RGB').tobytes()).hexdigest();hashes.setdefault(pixel,[]).append(p.name)
  normalized=hashlib.sha256(ImageOps.fit(im.convert('RGB'),(96,64)).tobytes()).hexdigest();visual.setdefault(normalized,[]).append(p.name)
for start in range(0,len(files),30):
 subset=files[start:start+30];sheet=Image.new('RGB',(1300,math.ceil(len(subset)/5)*210),'#101820');draw=ImageDraw.Draw(sheet)
 for n,p in enumerate(subset):
  x=(n%5)*260;y=(n//5)*210
  with Image.open(p) as im:
   thumb=ImageOps.contain(im.convert('RGB'),(250,156));sheet.paste(thumb,(x+(250-thumb.width)//2,y))
  draw.text((x+4,y+158),p.name,fill='#eed39b',font=font)
  name=' / '.join(labels.get(p.name,['unused / contextual']))
  for line in range(2):draw.text((x+4,y+175+line*15),name[line*35:(line+1)*35],fill='#c1cbd1',font=font)
 out=root/f'art/audit-rasters-{start//30+1:02}.jpg';sheet.save(out,quality=90);review.append(str(out))
result={'files':len(files),'references':len(items),'identicalPixels':[v for v in hashes.values() if len(v)>1],'identicalNormalizedPixels':[v for v in visual.values() if len(v)>1],'dimensions':sizes,'contactSheets':review}
(root/'art/full-raster-audit.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:result[k] for k in ['files','references','identicalPixels','identicalNormalizedPixels','contactSheets']}))
