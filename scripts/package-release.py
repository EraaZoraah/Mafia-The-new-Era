"""Build a code-only update; never include databases, local accounts or secrets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib

root = Path(__file__).resolve().parent.parent
out = root.parent / 'releases' / 'mafia-update-1.18.6-2026-10-18.zip'
out.parent.mkdir(exist_ok=True)
files = [root / 'CURRENT-RELEASE-1.18.6.md', root / 'art' / 'sunday-funday-popup.png', root / 'art' / 'v1186-focused.log', root / 'art' / 'auth-login-fade-mobile.png', root / 'art' / 'auth-register-fade-mobile.png', root / 'art' / 'v1185-focused.log', root / 'CURRENT-RELEASE-1.18.5.md', root / 'art' / 'auth-login-fade-desktop.png', root / 'art' / 'auth-register-fade-desktop.png', root / 'CURRENT-RELEASE-1.18.3.md', root / 'art' / 'opening-page-fade-desktop.png', root / 'art' / 'v1184-focused.log', root / 'CURRENT-RELEASE-1.18.4.md', root / 'FUTURE-WORK.md', root / 'art' / 'v1183-regression.log', root / 'art' / 'v1183-http.log', root / 'art' / 'family-crests-equal-desktop.png', root / 'art' / 'family-crest-bounds.json', root / 'FAMILY-CRESTS.md', root / 'art' / 'family-crests-contact.jpg', root / 'art' / 'family-crests-final.log']
files += [p for p in root.glob('*.js') if not p.name.startswith('seed-')]
files += [root / n for n in ['VERSIONING.md','CHANGELOG.md','OCTOBER-17-REFINEMENTS.md','ART-HEISTS-AND-PUSH.md','REFERRAL-BETA.md','package-lock.json']]
files += [p for p in (root / 'art').glob('oct17-*') if p.is_file() and (p.suffix in ['.png','.jpg','.json'] or p.name.endswith('final.log'))]
files += [p for p in (root / 'art').glob('oct18-*') if p.is_file() and (p.suffix in ['.png','.jpg','.json'] or p.name.endswith('final.log'))]
files += [p for p in (root / 'art').glob('v117-*') if p.is_file() and (p.suffix in ['.png','.jpg','.json'] or p.name.endswith('final.log'))]
files += [root / n for n in ['BOT-AUTONOMY-AND-LUCA.md','ART-COLLECTORS-AND-DUTCH.md','STREET-RACES-PROPOSAL.md']]
files += [p for p in (root / 'translations').rglob('*') if p.is_file()]
files += [root / 'art' / n for n in ['art-collectors-regression-tests.log','art-collectors-http-tests.log','art-and-collector-prompts.json','collector-cars-contact.jpg','dutch-completeness-audit.json','art-market-dutch-desktop.png','vehicle-condition-dutch.png','vehicle-auctions-dutch-mobile.png','luca-condition-auctions-dutch.png']]
files += [root / 'POLICE-BRIBES.md',root / 'MIDNIGHT-CIRCUIT.md']
files += [root / 'art' / name for name in ['midnight-regression-tests.log','midnight-http-tests.log','midnight-focused-tests.log','midnight-language-guide-final.log','midnight-circuit-prompts.json','midnight-circuit-art-contact.jpg','midnight-stage-desktop.png','midnight-results-desktop.png','midnight-results-mobile.png','achievements-trophy-banner-desktop.png','achievements-trophy-banner-mobile.png']]
files += [root / 'art' / name for name in ['police-bribes-regression-tests.log','police-bribes-http-tests.log','police-bribes-map-desktop.png','police-bribes-map-mobile.png','police-bribe-dialog.png','police-bribe-art.json','localization-corpus.json']]
files += [root / 'art' / name for name in ['autonomy-guide-tests.log','bot-autonomy-regression-tests.log','bot-autonomy-http-tests.log','territory-atlas-desktop.png','territory-atlas-mobile.png']]
files += [root / n for n in ['TERRITORY-AND-VEHICLES.md','GEOGRAPHY-NOTICE.md','GEOGRAPHY-LICENSE.txt','DUTCH-LOCALIZATION.md','CASINO-REVIEW.md','VISUAL-REVIEW.md','AGENTS.md','INTERFACE-AND-FREIGHT.md','EMPIRE-REFRESH.md', 'EMPIRE-SIMULATION-180-DAYS.md', 'package.json', 'BOTS-AND-SKINS.md', 'SIMULATION-180-DAYS.md', 'CREW-AND-GUIDE.md', 'VISUAL-AUDIT.md', 'CITY-EXPANSION.md', 'README.md', 'PLAYER-SYSTEMS-UPDATE.md', 'ECONOMY-PROGRESSION-REPORT.md']]
for folder in ['public', 'test']:
    files += [p for p in (root / folder).rglob('*') if p.is_file()]
files += list((root / 'scripts').glob('*.js')) + list((root / 'scripts').glob('*.mjs')) + list((root / 'scripts').glob('*.py'))
files += [root / 'art' / n for n in ['full-svg-audit.json','full-art-inventory.json','full-raster-audit.json','visual-audit-prompts.json','interface-audit.json','interface-freight-prompts.json','empire-balanced-simulation-180d.json','empire-balanced-simulation-180d.csv','empire-balanced-simulation-180d.html','skins-manifest.json','bonus-simulation-180d.json','bonus-simulation-180d.csv','bonus-simulation-180d.html','visual-refresh-prompts.json','image-file-duplicates.json','economy-v2-60d.json', 'economy-v2-90d.json', 'economy-v2-180d-pilot.json', 'career-playtest.json']]
files += [root / 'art' / n for n in ['territory-vehicles-art.json','territory-vehicles-final-tests.log','territory-vehicle-http-tests.log','bot-wave-validation.log','vehicle-wealth-tests.log','vehicle-warehouse-contact.jpg','garage-extension-contact.jpg','geographic-city-map.png','recovered-vehicle-popup.png','recovered-vehicle-mobile.png','purchased-garage-collection.png']]
files += list((root / 'art').glob('language-above-logout-*.png')) + [root / 'art' / 'dutch-foundation-tests.log']
files += list((root / 'art').glob('casino-*.png')) + [root / 'art' / 'casino-review-tests.log']
files += list((root / 'art').glob('audit-rasters-*.jpg')) + list((root / 'art').glob('audit-icons-*.html')) + list((root / 'art').glob('logout-outside-frame-*.png')) + [root / 'art' / 'audit-replacements.jpg',root / 'art' / 'audit-entry-pages.jpg']
with ZipFile(out, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for p in sorted(set(files)):
        rel = p.relative_to(root)
        assert not any(part in ['data', '.git', 'node_modules'] for part in rel.parts)
        assert p.suffix not in ['.db', '.sqlite', '.sqlite3'] and not p.name.startswith('.env')
        archive.write(p, 'mafia-the-new-era/' + rel.as_posix())
with ZipFile(out) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    for name in ['game.js','player-systems.js','public/player-systems-ui.js','server.js','package.json']:
        assert 'mafia-the-new-era/' + name in names
print(f'{out}\n{len(files)} files, {out.stat().st_size:,} bytes\nSHA256 {hashlib.sha256(out.read_bytes()).hexdigest()}')
