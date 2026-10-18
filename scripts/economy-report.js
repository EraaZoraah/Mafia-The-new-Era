import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {ranks,distinctionStep} from '../progression.js';
import {careerRanks} from '../empire-catalog.js';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const study=read('art/economy-v2-90d.json'),long=read('art/economy-v2-180d-pilot.json'),careers=read('art/career-playtest.json');
const sixty={...study,method:'First 60 consecutive days of the five-seed 90-day real-handler study. Fresh $5,000 accounts, zero XP, standard starter kit, two active hours/day, daily crime cash and achievement XP. No other players, staff grants, gifts, casino or investments. Purchases: one coffeeshop and one tier-2 weapon; ammunition replaced as needed.',results:study.results.map(r=>{const days=r.days.slice(0,60),d=days.at(-1),t=d.totals;assert.equal(d.cash,5000+t.crimeGross-t.fines-t.ammo+t.daily+t.passive-t.purchases);return {...r,days,totals:t,netCrime:t.crimeGross-t.fines-t.ammo,final:{cash:d.cash,xp:d.xp}}})};
writeFileSync('art/economy-v2-60d.json',JSON.stringify(sixty,null,2));
const money=n=>'$'+Math.round(n).toLocaleString('en-US'),range=(xs,format=n=>n.toLocaleString('en-US'))=>format(Math.min(...xs))+'–'+format(Math.max(...xs));
const day=n=>study.results.map(r=>r.days[n-1]);
const rows=[1,14,30,60,90].map(n=>{const ds=day(n);return `| ${n} | ${range(ds.map(d=>d.cash),money)} | ${range(ds.map(d=>d.xp))} | ${[...new Set(ds.map(d=>d.rank))].join(' / ')} |`});
const ledgers=sixty.results.map(r=>`| ${r.seed} | ${money(r.totals.crimeGross)} | ${money(r.totals.fines)} | ${money(r.totals.ammo)} | ${money(r.netCrime)} | ${money(r.totals.daily)} | ${money(r.totals.passive)} | ${money(r.totals.purchases)} | ${money(r.final.cash)} |`);
const final=long.results[0].days.at(-1),gf=study.results.map(r=>r.days.find(d=>d.rank==='The Godfather')?.day);assert.ok(gf.every(Boolean));
const crows=['personal','family'].map(scope=>{const rs=careers.results.filter(r=>r.scope===scope);return `| ${scope} | ${range(rs.map(r=>r.connect.drugs))} | ${range(rs.map(r=>r.connect.guns))} |`});
const report=`# Economy & progression verification — 12 October 2026

Build: 2026-10-12-progression-presence-2. This report supersedes the earlier economy-care balance report.

## Fresh-account progression

Five deterministic seeds (17, 42, 91, 123, 777), real game handlers and in-memory disposable databases. Each player starts with $5,000, zero XP and the standard starter kit. Two continuous active hours per day, one-minute decision steps, then 22 hours offline. The strategy selects the highest expected cash-per-energy eligible crime, buys a coffeeshop and tier-2 weapon, replaces ammunition, claims completed crime dailies and available achievement XP. No PvP losses, gifts, staff grants, casino, investments, large property portfolio or career runs. This is a saving strategy, not a prediction for every playstyle. A mixed crime/shipment strategy spends the same finite energy on different activities and will have different results.

| Day | Cash after measured costs | Normal XP | Rank |
|---|---:|---:|---|
${rows.join('\n')}

- Family creation costs $1,000,000. All five accounts first have that cash available on day ${range(study.results.map(r=>r.days.find(d=>d.cash>=1e6).day))}; the simulation saves it rather than creating a family. Joining an open family remains free.
- First promotion threshold: ${ranks[1].xp.toLocaleString('en-US')} XP. All five accounts finish day 1 as Outsider.
- Godfather threshold: ${ranks.at(-1).xp.toLocaleString('en-US')} XP. Measured first arrival: day ${range(gf)}. Thus this active playstyle can reach Godfather by day 90.
- Each further ${distinctionStep.toLocaleString('en-US')} XP grants a legacy distinction, matching the final normal-rank gap. Existing +15% compounded active-income distinctions remain.
- One 180-day continuation (seed 42): ${final.xp.toLocaleString('en-US')} XP, Godfather +${final.distinctions}, ${money(final.cash)} saved. This is one long-run scenario, not a five-seed distribution. The requested compounded legacy bonuses make late-game income grow substantially; monitor real-player data and money sinks before treating this as a final public economy.

## Exact day-60 money reconciliation

Net crime = gross rewards minus fines and replacement ammunition. Ending cash = $5,000 + net crime + daily cash + passive cash − purchases. Every seed is asserted to reconcile exactly. Weapons and business purchases total $1,620,000; retained assets are not included in the cash column. No manual refill of cash, XP or energy occurs in this study.

| Seed | Crime gross | Fines | Ammo | Net crime | Daily cash | Passive | Purchases | Ending cash |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${ledgers.join('\n')}

Current crime baselines are 4× the preceding 10%-payout build (40% of the older baseline). Normal crime/daily/PvP XP rewards are 4× their former values; failure XP is included. Shipment career XP is 160 / 440 / 1,000 on success and 20% on failure. Bullets remain $50 each. Passive catalog rates remain reduced and rank scaling uses a square root; passive holdings were not raised with active crime rewards. Existing cash and XP are preserved, while ranks are recalculated using the new thresholds.

## Drugs and guns — separate career cadence study

Five seeds per scope, 120 simulated days, four attempts per career per day in four six-hour-spaced sessions. Career XP starts at zero; normal rank is held at Outsider. This separate study has prepared funding and the necessary weapons, charges replacement ammunition, and measures career cadence only. It is not a fresh-account earnings study and cannot be added to the crime study without allocating additional playtime/energy and equipment capital. No escorts, family holdings or donation bonuses. Both 15-rank careers end at ${careerRanks.drugs.at(-1).xp.toLocaleString('en-US')} XP.

| Scope | Drugs: first Connect day | Guns: first Connect day |
|---|---:|---:|
${crows.join('\n')}

Family scope uses one contributor and every run credits personal and family XP equally; the reported family dates therefore apply to both. Several active contributors advance the family sooner. Higher-tier runs still require both the personal and family rank, funds, weapons and ammunition.

## Other implemented safeguards and rewards

- Achievements: one-time 500 XP introductory rewards; 1,000 or 2,000 XP for other milestones. Claim on the achievement page. Normal promotion energy restoration applies. Claim history survives gameplay reset, preventing repeated farming.
- Same-family robbery, kidnapping and liquidation rejected on the server before resource consumption.
- Anonymous liquidation attempts and paid arrest reports cost an extra $500,000. Valid failed attempts still pay; invalid requests roll back. Victim notifications and personal event logs hide the actor, while the actor’s retained activity log remains available to staff.
- New coma treatment: $1m at rank 1 to $100m at Godfather, using quadratic rank scaling. Other hospital/prison release fees: 5–100% of their original maximum. All decrease linearly with remaining time. Rank is fixed into the fee when the stay starts; existing stays retain their saved quote. Cash, bank, selected assets and authorized family/third-party rescue remain supported.
- Profiles and Owner population overview show account creation, distinct active UTC days and measured hours. Heartbeats count at most 60 seconds per observation and stop counting gaps beyond 90 seconds, avoiding multi-tab double counting. Tracking begins with this update; historical hours are unavailable. Online/last-seen indicators and chat dots use the same server timestamps.

## Reproduce and install

From the project folder containing package.json: \`npm test\`; \`node scripts/economy-playtest.js 90\`; \`node scripts/career-playtest.js\`; for the long scenario, set SIM_SEEDS=42 and run \`node scripts/economy-playtest.js 180\`; then \`node scripts/economy-report.js\`. Simulations never open the real database. Five-seed runs take several minutes.

For hosting: stop the running Node process, back up data/mafia.sqlite together with its WAL/SHM files (or take a SQLite backup), replace application files and public/ from the update archive, preserve data/ and environment configuration, then restart the actual service. Verify /api/health reports this build and reload the browser. No deployment to the friend’s server has been performed here.
`;
writeFileSync('ECONOMY-PROGRESSION-REPORT.md',report);
console.log(JSON.stringify({day60Cash:range(day(60).map(d=>d.cash),money),godfatherDays:gf,day180:final,career:crows},null,2));
