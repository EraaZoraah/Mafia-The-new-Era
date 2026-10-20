"""Create smaller delivery copies; keep original artwork unchanged."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
source = root / 'public' / 'images'
dest = source / 'optimized'
dest.mkdir(exist_ok=True)
count = original_bytes = output_bytes = 0
for file in sorted(source.iterdir()):
    if file.suffix.lower() not in ('.png', '.jpg') or file.stat().st_size < 250000:
        continue
    output = dest / (file.name + '.webp')
    if not output.exists() or output.stat().st_mtime < file.stat().st_mtime:
        with Image.open(file) as opened:
            image = ImageOps.exif_transpose(opened).convert('RGBA' if 'A' in opened.getbands() else 'RGB')
            image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            image.save(output, 'WEBP', quality=86, method=4)
    if output.stat().st_size < file.stat().st_size:
        count += 1
        original_bytes += file.stat().st_size
        output_bytes += output.stat().st_size
print({'images': count, 'originalBytes': original_bytes, 'deliveryBytes': output_bytes})
