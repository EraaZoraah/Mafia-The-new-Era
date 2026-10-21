import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile, cp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import http from 'node:http';
import {ranks,distinctionStep,progression,prestigeThreshold} from '../progression.js';

// All writes and security probes target a disposable copy, never the real database.
test('isolated prototype baseline', { timeout: 90000 }, async t => {
  // Keep HTTP fixtures independent of the real weekday; Sunday has dedicated tests.
  const auditNow=Date.UTC(2026,9,14,12);t.mock.timers.enable({apis:['Date'],now:auditNow});
  const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const fixture = await mkdtemp(path.join(tmpdir(), 'mafia-audit-'));
  let server;
  let db;
  try {
    // Include new runtime modules automatically; never copy live database state.
    for(const name of (await readdir(source)).filter(name=>name.endsWith('.js')||name==='package.json'))await copyFile(path.join(source,name),path.join(fixture,name));
    await cp(path.join(source, 'public'), path.join(fixture, 'public'), { recursive: true });
    // Port 0 avoids collisions. Only the disposable copy's startup log is instrumented.
    const { readFile, writeFile } = await import('node:fs/promises');
    const serverFile = path.join(fixture, 'server.js');
    await writeFile(serverFile, (await readFile(serverFile, 'utf8')).replace('http://localhost:${port}', 'http://localhost:${server.address().port}'));
    await writeFile(path.join(fixture,'test-clock.mjs'),`const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[${auditNow}]))}static now(){return ${auditNow}}};`);
    server = spawn(process.execPath, ['--import',pathToFileURL(path.join(fixture,'test-clock.mjs')).href,'server.js'], {
      cwd: fixture, env: { ...process.env, PORT: '0', NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let errors = '';
    server.stderr.on('data', chunk => { errors += chunk; });
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timed out: ' + errors)), 5000);
      let output = '';
      server.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/http:\/\/localhost:(\d+)/);
        if (match) { clearTimeout(timer); resolve('http://127.0.0.1:' + match[1]); }
      });
      server.once('error', e => { clearTimeout(timer); reject(e); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${errors}`)); });
    });
    db = new DatabaseSync(path.join(fixture, 'data', 'mafia.sqlite'));
    db.exec('PRAGMA busy_timeout=5000');
    async function api(route, body, cookie, headers = {}) {
      const response = await fetch(base + '/api/' + route, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(3000),
      });
      return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
    }
    let alice, bob, owner;
    const password = 'Disposable-test-password-42';
    t.beforeEach(()=>{if(db){db.exec("INSERT OR IGNORE INTO armory_accounts(scope,owner_id,ammo) SELECT 'personal',id,100000 FROM users; UPDATE armory_accounts SET ammo=100000; INSERT OR IGNORE INTO armory_weapons(scope,owner_id,weapon_id,quantity) SELECT 'personal',id,'sovereign-arsenal',1 FROM users; INSERT OR IGNORE INTO armory_accounts(scope,owner_id,ammo) SELECT 'family',id,100000 FROM families; INSERT OR IGNORE INTO armory_weapons(scope,owner_id,weapon_id,quantity) SELECT 'family',id,'sovereign-arsenal',1 FROM families;");db.prepare('UPDATE users SET prison_until=0').run();db.exec("DELETE FROM police_bribes WHERE custody_id IN (SELECT id FROM custody WHERE kind='prison'); DELETE FROM custody WHERE kind='prison'");}});
    await t.test('health and unauthenticated access', async () => {
      assert.equal((await api('health')).status, 200);
      assert.equal((await api('me')).status, 401);
    });
    await t.test('registration ignores submitted owner role and enforces uniqueness', async () => {
      alice = await api('register', { username: 'Alice', email: 'alice@example.test', password, role: 'owner' });
      bob = await api('register', { username: 'Bob', email: 'bob@example.test', password });
      assert.equal(alice.status, 201);
      assert.equal(bob.status, 201);
      assert.equal(alice.body.user.role, 'player');
      assert.equal((await api('admin', undefined, alice.cookie)).status, 403);
      assert.equal((await api('register', { username: 'ALICE', email: 'other@example.test', password })).status, 409);
    });
    await t.test('push settings require login and expose no private signing key',async()=>{
      assert.equal((await api('push')).status,401);
      const settings=await api('push',undefined,alice.cookie);assert.equal(settings.status,200);assert.equal(typeof settings.body.ready,'boolean');assert.equal(settings.body.privateKey,undefined);
      assert.equal((await api('push/save',{subscription:{endpoint:'http://127.0.0.1/private'}},alice.cookie)).status,400);
      for(const file of ['/scroll-position.js','/premium-theme.css','/push-ui.js','/sw.js','/input-limits.js','/es.js','/fr.js','/de.js','/manifest.webmanifest','/icons/app-logo-v4-192.png','/icons/app-logo-v4-512.png','/icons/app-logo-v4-maskable.png','/icons/app-logo-v4-apple.png'])assert.equal((await fetch(base+file)).status,200);
    });
    await t.test('modern artwork delivery is smaller while original image fallback remains available',async()=>{
      const optimized=await fetch(base+'/images/banner-home-v3.png',{headers:{Accept:'image/webp'}});
      const original=await fetch(base+'/images/banner-home-v3.png',{headers:{Accept:'image/png'}});
      assert.equal(optimized.status,200);assert.equal(original.status,200);
      assert.equal(optimized.headers.get('content-type'),'image/webp');assert.equal(original.headers.get('content-type'),'image/png');
      assert.equal(optimized.headers.get('vary'),'Accept');
      assert.ok((await optimized.arrayBuffer()).byteLength<(await original.arrayBuffer()).byteLength/2);
    });
    await t.test('login, password rejection, and logout revocation', async () => {
      assert.equal((await api('login', { login: 'Alice', password: 'wrong' })).status, 401);
      const login = await api('login', { login: 'Alice', password });
      assert.equal(login.status, 200);
      assert.equal((await api('presence/heartbeat',{},login.cookie)).status,200);
      assert.equal((await api('presence?ids='+alice.body.user.id,undefined,alice.cookie)).body.players[0].online,true);
      assert.equal((await api('logout', {}, login.cookie)).status, 200);
      assert.equal((await api('presence?ids='+alice.body.user.id,undefined,alice.cookie)).body.players[0].online,false);
      assert.equal((await api('presence/heartbeat',{},login.cookie)).status,401);
      assert.equal((await api('me', undefined, login.cookie)).status, 401);
    });
    await t.test('bank conserves money and rejects invalid and excessive transfers', async () => {
      assert.equal((await api('bank', { type: 'deposit', amount: 1000 }, alice.cookie)).status, 200);
      assert.equal((await api('bank', { type: 'withdraw', amount: 250 }, alice.cookie)).status, 200);
      for (const amount of [-1, 0, 0.5, 100000, '100']) {
        assert.equal((await api('bank', { type: 'deposit', amount }, alice.cookie)).status, 400);
      }
      const user = (await api('me', undefined, alice.cookie)).body.user;
      assert.equal(user.cash, 4250);
      assert.equal(user.bank, 750);
    });
    await t.test('actions enforce cooldown and consume energy on the server', async () => {
      assert.equal((await api('action', { kind: 'crime' }, alice.cookie)).status, 200);
      // Isolate the cooldown assertion from the independently tested random arrest penalty.
      db.prepare('UPDATE users SET prison_until=0 WHERE id=?').run(alice.body.user.id);
      assert.equal((await api('action', { kind: 'crime' }, alice.cookie)).status, 429);
      assert.equal((await api('me', undefined, alice.cookie)).body.user.energy, 90);
      assert.equal((await api('action', { kind: 'invalid' }, alice.cookie)).status, 400);
    });
    await t.test('private messages are scoped to the recipient', async () => {
      assert.equal((await api('messages', { recipient: 'Bob', message: 'Private test message' }, alice.cookie)).status, 200);
      assert.equal((await api('messages', undefined, bob.cookie)).body.messages.length, 1);
      assert.equal((await api('messages', undefined, alice.cookie)).body.messages.length, 0);
    });
    await t.test('terminal owner provisioning revokes old sessions and protects owner', async () => {
      const provision = spawnSync(process.execPath, ['owner-setup.js', 'Bob', password], { cwd: fixture, encoding: 'utf8' });
      assert.equal(provision.status, 0, provision.stderr);
      assert.equal((await api('me', undefined, bob.cookie)).status, 401);
      owner = await api('login', { login: 'Bob', password });
      assert.equal(owner.body.user.role, 'owner');
      assert.equal((await api('admin', undefined, owner.cookie)).status, 200);
      assert.equal((await api('admin/user', { id: bob.body.user.id, field: 'banned', value: 1 }, owner.cookie)).status, 409);
      assert.equal((await api('admin/user', { id: alice.body.user.id, field: 'cash', value: 1100000 }, owner.cookie)).status, 200);
    });
    await t.test('family creation deducts its price and joining enforces membership', async () => {
      db.prepare('UPDATE users SET cash=1100000 WHERE id=?').run(alice.body.user.id);
      assert.equal((await api('families', { name: 'Test Family' }, alice.cookie)).status, 201);
      assert.equal((await api('me', undefined, alice.cookie)).body.user.cash, 100000);
      const id = (await api('families', undefined, alice.cookie)).body.families[0].id;
      assert.equal((await api('families/join', { id }, owner.cookie)).status, 200);
      assert.equal((await api('families/join', { id }, owner.cookie)).status, 409);
    });
    await t.test('owner ban revokes sessions and blocks login; unban permits login', async () => {
      const change = value => api('admin/user', { id: alice.body.user.id, field: 'banned', value }, owner.cookie);
      assert.equal((await change(1)).status, 200);
      assert.equal((await api('me', undefined, alice.cookie)).status, 401);
      assert.equal((await api('login', { login: 'Alice', password })).status, 401);
      assert.equal((await change(0)).status, 200);
      alice = await api('login', { login: 'Alice', password });
      assert.equal(alice.status, 200);
    });
    await t.test('catalog has expanded crimes, 51 cars, businesses and residences', async () => {
      const result=await api('catalog',undefined,alice.cookie);
      assert.equal(result.status,200);
      assert.ok(result.body.crimes.length>=13);
      assert.equal(result.body.catalog.filter(x=>x.category==='car').length,51);
      assert.equal(result.body.catalog.filter(x=>x.category==='business').length,11);
      assert.equal(result.body.catalog.filter(x=>x.category==='home').length,12);
    });
    await t.test('energy regenerates offline, preserves partial ticks and respects the cap',async()=>{
      const stamp=Date.now()-95000;
      db.prepare('UPDATE users SET energy=50,energy_at=? WHERE username=?').run(stamp,'Alice');
      let user=(await api('me',undefined,alice.cookie)).body.user;
      assert.equal(user.energy,53);
      assert.equal(user.energy_at,stamp+90000);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.energy,53);
      db.prepare('UPDATE users SET energy_at=? WHERE username=?').run(Date.now()-86400000,'Alice');
      assert.equal((await api('me',undefined,alice.cookie)).body.user.energy,100);
    });
    await t.test('extended staff editor is authenticated, scoped and available through HTTP',async()=>{
      const endpoint='admin/state?scope=personal&id='+bob.body.user.id;
      assert.equal((await api(endpoint)).status,401);
      assert.equal((await api(endpoint,undefined,alice.cookie)).status,403);
      const state=await api(endpoint,undefined,owner.cookie);assert.equal(state.status,200);
      const racing=state.body.sections.find(s=>s.section==='racing');assert.ok(racing);
      const result=await api('admin/state',{scope:'personal',targetId:bob.body.user.id,section:'racing',revision:racing.revision,reason:'HTTP race correction',operation:'save',values:{xp:500,next_at:0}},owner.cookie);
      assert.equal(result.status,200);assert.equal(db.prepare('SELECT xp FROM race_profiles WHERE user_id=?').get(bob.body.user.id).xp,500);
    });
    await t.test('staff account order uses creation time and rejects untrusted ordering',async()=>{
      const a=alice.body.user.id,b=bob.body.user.id;
      const previous=db.prepare('SELECT id,created_at FROM users WHERE id IN (?,?)').all(a,b);
      try{
        db.prepare('UPDATE users SET created_at=? WHERE id=?').run(auditNow+2000,a);
        db.prepare('UPDATE users SET created_at=? WHERE id=?').run(auditNow+1000,b);
        const newest=await api('admin?order=newest',undefined,owner.cookie);
        assert.equal(newest.status,200);assert.equal(newest.body.users[0].id,a);
        const oldest=await api('admin?order=oldest',undefined,owner.cookie);
        assert.equal(oldest.status,200);assert.ok(oldest.body.users.findIndex(u=>u.id===b)<oldest.body.users.findIndex(u=>u.id===a));
        assert.equal((await api('admin?order=DROP',undefined,owner.cookie)).status,400);
      }finally{for(const row of previous)db.prepare('UPDATE users SET created_at=? WHERE id=?').run(row.created_at,row.id)}
    });
    await t.test('Owner edits own statistics and player possessions atomically with audit records',async()=>{
      assert.equal((await api('admin/player',{id:bob.body.user.id,changes:{cash:50000,energy:75,health:88,xp:1000}},owner.cookie)).status,200);
      assert.equal((await api('me',undefined,owner.cookie)).body.user.cash,50000);
      assert.equal((await api('admin/player',{id:alice.body.user.id,changes:{cash:999,energy:101}},owner.cookie)).status,400);
      assert.notEqual((await api('me',undefined,alice.cookie)).body.user.cash,999);
      assert.equal((await api('admin/player',{id:alice.body.user.id,changes:{role:'invalid'}},owner.cookie)).status,403);
      assert.equal((await api('admin/player?id='+bob.body.user.id,undefined,alice.cookie)).status,403);
      assert.equal((await api('admin/player',{id:alice.body.user.id,changes:{cash:2000000,xp:1000,possessions:[{category:'car',item_id:'golf'}]}},owner.cookie)).status,200);
      const player=(await api('admin/player?id='+alice.body.user.id,undefined,owner.cookie)).body;
      assert.equal(player.player.password,undefined);
      assert.equal(player.possessions[0].item_id,'golf');
      assert.ok((await api('admin/audit',undefined,owner.cookie)).body.entries.length>0);
    });
    await t.test('repeat purchases debit increasing server prices and reject forged prices and overspending',async()=>{
      const before=(await api('me',undefined,alice.cookie)).body.user.cash;
      assert.equal((await api('assets/buy',{category:'business',id:'coffee',price:1},alice.cookie)).status,201);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,before-120000);
      assert.equal((await api('assets/buy',{category:'business',id:'coffee'},alice.cookie)).status,201);
      assert.equal((await api('assets/buy',{category:'home',id:'elysium'},alice.cookie)).status,409);
      assert.equal((await api('assets/buy',{category:'car',id:'missing'},alice.cookie)).status,400);
      const beforeCars=(await api('me',undefined,alice.cookie)).body.user.cash;
      db.prepare("INSERT OR IGNORE INTO possessions(user_id,category,item_id,acquired_at,income_at) VALUES(?,'garage','collector',?,?)").run(alice.body.user.id,Date.now(),Date.now());
      const attempts=await Promise.all([api('assets/buy',{category:'car',id:'fiat500'},alice.cookie),api('assets/buy',{category:'car',id:'fiat500'},alice.cookie)]);
      assert.deepEqual(attempts.map(x=>x.status).sort(),[201,409]);
      const afterCars=(await api('me',undefined,alice.cookie)).body;
      assert.equal(afterCars.user.cash,beforeCars-180000);
      assert.equal(afterCars.possessions.find(x=>x.item_id==='fiat500').quantity,1);
      assert.equal((await api('assets/buy',{category:'home',id:'studio'},alice.cookie)).status,201);
    });
    await t.test('passive income accrues by full minute once and caps offline income at 24 hours',async()=>{
      const before=(await api('me',undefined,alice.cookie)).body.user.cash;
      db.prepare("UPDATE possessions SET income_at=?,elapsed_remainder=0 WHERE user_id=? AND category='business'").run(Date.now()-3650000,alice.body.user.id);
      db.prepare('DELETE FROM income_cycles WHERE user_id=?').run(alice.body.user.id);db.prepare('UPDATE users SET income_claim_at=? WHERE id=?').run(Date.now()-3650000,alice.body.user.id);
      await api('income/claim',{},alice.cookie);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,before+240);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,before+240);
      db.prepare('DELETE FROM income_cycles WHERE user_id=?').run(alice.body.user.id);db.prepare('UPDATE users SET income_claim_at=? WHERE id=?').run(Date.now()-48*3600000,alice.body.user.id);
      db.prepare("UPDATE possessions SET income_at=?,elapsed_remainder=0 WHERE user_id=? AND category='business'").run(Date.now()-48*3600000,alice.body.user.id);
      await api('income/claim',{},alice.cookie);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,before+6000);
    });
    await t.test('PvP validates targets, new-player protection, cooldowns and conservation of cash',async()=>{
      db.prepare('DELETE FROM family_members WHERE user_id=?').run(bob.body.user.id);
      assert.equal((await api('pvp',{kind:'rob',target:'Alice'},alice.cookie)).status,400);
      db.prepare('UPDATE users SET xp=0 WHERE username=?').run('Bob');
      assert.equal((await api('pvp',{kind:'rob',target:'Bob'},alice.cookie)).status,403);
      db.prepare('UPDATE users SET xp=1000,protected_until=? WHERE username=?').run(Date.now()+60000,'Bob');
      assert.equal((await api('pvp',{kind:'rob',target:'Bob'},alice.cookie)).status,409);
      db.prepare('UPDATE users SET protected_until=0,health=100,energy=100').run();
      const before=db.prepare('SELECT SUM(cash) cash FROM users').get().cash;
      const result=await api('pvp',{kind:'rob',target:'Bob'},alice.cookie);
      assert.equal(result.status,200);
      assert.equal(db.prepare('SELECT SUM(cash) cash FROM users').get().cash,before);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.energy,75);
      assert.equal((await api('pvp',{kind:'attack',target:'Bob'},alice.cookie)).status,429);
      assert.equal((await api('protection',{},alice.cookie)).status,200);
      assert.equal((await api('protection',{},alice.cookie)).status,409);
    });
    await t.test('hospital and hostage timers block actions and hospital recovery restores health',async()=>{
      db.prepare('UPDATE users SET hospital_until=?,health=0 WHERE username=?').run(Date.now()+60000,'Alice');
      assert.equal((await api('action',{kind:'courier'},alice.cookie)).status,409);
      db.prepare('UPDATE users SET hospital_until=? WHERE username=?').run(Date.now()-60000,'Alice');
      assert.equal((await api('me',undefined,alice.cookie)).body.user.health,100);
      db.prepare('UPDATE users SET captured_until=? WHERE username=?').run(Date.now()+60000,'Alice');
      assert.equal((await api('action',{kind:'courier'},alice.cookie)).status,409);
      db.prepare('UPDATE users SET captured_until=0 WHERE username=?').run('Alice');
      assert.equal((await api('action',{kind:'courier'},alice.cookie)).status,200);
    });
    await t.test('invalid JSON shapes and foreign origins are rejected',async()=>{
      assert.equal((await api('register',null)).status,400);
      assert.equal((await api('register',[])).status,400);
      assert.equal((await api('bank',{type:'deposit',amount:1},alice.cookie,{Origin:'https://foreign.example'})).status,403);
      assert.equal((await api('bank',{type:'deposit',amount:1},alice.cookie,{'Content-Type':'text/plain'})).status,415);
    });
    await t.test('every PvP outcome and repeated migration is deterministic and preserves balances',async()=>{
      const {installGame}=await import('../game.js');
      const before=db.prepare('SELECT cash,bank FROM users ORDER BY id').all();
      let roll=0;
      const engine=installGame(db,{bigScoreRoll:()=>9999,hash:()=>{throw Error('Not used');},log:()=>{},json:(_res,status,body)=>({status,body}),roll:()=>roll});
      assert.deepEqual(db.prepare('SELECT cash,bank FROM users ORDER BY id').all(),before);
      for(const kind of ['attack','rob','liquidate','hostage']){
        db.prepare('DELETE FROM actions WHERE kind=?').run('pvp');
        db.prepare('UPDATE users SET xp=1000,cash=100000,energy=100,health=100,hospital_until=0,protected_until=0,captured_until=0,energy_at=?,health_at=?').run(Date.now(),Date.now());
        const result=engine.route({method:'POST'},null,'/api/pvp',{kind,target:'Bob'},{id:alice.body.user.id});
        assert.equal(result.status,200);
        assert.equal(result.body.success,true);
        const target=db.prepare('SELECT * FROM users WHERE username=?').get('Bob');
        assert.ok(target.protected_until>Date.now());
        assert.equal(db.prepare('SELECT SUM(cash) total FROM users').get().total,200000);
        if(kind==='rob')assert.equal(result.body.reward,10000);
        if(kind==='hostage'){assert.ok(result.body.reward>0&&result.body.reward<=100000);assert.ok(target.captured_until>Date.now());}
        if(kind==='liquidate'){assert.equal(target.health,0);assert.ok(target.hospital_until>Date.now());}
      }
      roll=9999;
      db.prepare("DELETE FROM actions WHERE kind='pvp'").run();
      db.prepare('UPDATE users SET energy=100,health=100,hospital_until=0,protected_until=0,captured_until=0').run();
      const result=engine.route({method:'POST'},null,'/api/pvp',{kind:'attack',target:'Bob'},{id:alice.body.user.id});
      assert.equal(result.body.success,false);
      assert.equal(db.prepare('SELECT health FROM users WHERE username=?').get('Alice').health,85);
    });
    await t.test('payout ranges, guaranteed random extras and rank bonuses match server execution',async()=>{
      const {installGame}=await import('../game.js');
      let outcome=0,high=false;
      const engine=installGame(db,{bigScoreRoll:()=>9999,hash:()=>'',log:()=>{},json:(_res,status,body)=>({status,body}),roll:()=>outcome,draw:(min,max)=>high?max:min});
      const id=alice.body.user.id;
      for(const mode of ['minimum','maximum','failed']){
        db.prepare('UPDATE users SET cash=1000000,xp=0,energy=100,health=100,captured_until=0,hospital_until=0 WHERE id=?').run(id);
        db.prepare('DELETE FROM actions WHERE user_id=?').run(id);
        high=mode==='maximum';outcome=mode==='failed'?9999:0;
        const offer=engine.route({method:'GET'},null,'/api/catalog',{}, {id}).body.crimes.find(x=>x.id==='crime');
        const result=engine.route({method:'POST'},null,'/api/action',{kind:'crime'},{id});
        assert.equal(result.status,200);
        assert.equal(result.body.reward,mode==='failed'?offer.payout.bonusMin:high?offer.payout.max:offer.payout.min);
        assert.ok(result.body.bonus>0);
      }
      db.prepare('UPDATE users SET xp=1350000 WHERE id=?').run(id);
      const offers=engine.route({method:'GET'},null,'/api/catalog',{}, {id}).body.crimes;
      assert.ok(offers.every(x=>x.chance<=.95));
      assert.ok(offers.find(x=>x.id==='vault').chance<1);
      assert.ok(offers.find(x=>x.id==='crime').payout.min>7000);
    });
    await t.test('aircraft purchase, ownership gates, title authorization and improved recovery work',async()=>{
      const id=alice.body.user.id;
      assert.equal((await api('action',{kind:'airlift'},alice.cookie)).status,403);
      assert.equal((await api('title',{title:'jet:imperium'},alice.cookie)).status,403);
      assert.equal((await api('admin/player',{id,changes:{cash:1000000000,energy:100}},owner.cookie)).status,200);
      assert.equal((await api('assets/buy',{category:'helicopter',id:'sparrow'},alice.cookie)).status,201);
      assert.equal((await api('assets/buy',{category:'jet',id:'swift'},alice.cookie)).status,201);
      assert.equal((await api('title',{title:'jet:swift'},alice.cookie)).status,200);
      const user=(await api('me',undefined,alice.cookie)).body.user;
      assert.match(user.title,/Swift/);
      assert.equal(user.benefits.energyMax,100+progression(user.xp).rankEnergyBonus);
      assert.equal(user.benefits.energyInterval,30000);
      assert.equal(user.benefits.cooldownBps,310);
      assert.equal((await api('action',{kind:'airlift'},alice.cookie)).status,200);
      // This test checks aircraft access, independently of a random arrest on the previous attempt.
      db.prepare('UPDATE users SET prison_until=0,hospital_until=0,coma_until=0,captured_until=0,health=100 WHERE id=?').run(id);
      assert.equal((await api('action',{kind:'overseas'},alice.cookie)).status,200);
    });
    await t.test('minute-by-minute business collection preserves fractional rank income',async()=>{
      const id=alice.body.user.id;
      db.prepare('UPDATE users SET xp=1000 WHERE id=?').run(id);
      db.prepare("UPDATE possessions SET income_at=?,income_remainder=0 WHERE user_id=?").run(Date.now(),id);
      const before=(await api('me',undefined,alice.cookie)).body.user.cash;
      for(let minute=0;minute<60;minute++){
        db.prepare('UPDATE income_cycles SET last_at=? WHERE user_id=?').run(Date.now()-61000,id);
        db.prepare("UPDATE possessions SET income_at=?,elapsed_remainder=0 WHERE user_id=? AND category='business'").run(Date.now()-61000,id);
        await api('me',undefined,alice.cookie);
      }
      await api('income/claim',{},alice.cookie);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,before+240);
    });
    await t.test('all selected artwork is served locally with matching JPEG or PNG signatures',async()=>{
      for(const file of ['asset-order.js','finance-controls.js','nl-oct17.js'])assert.equal((await fetch(base+'/'+file)).status,200,file);
      const module=await fetch(base+'/page-art.js');assert.equal(module.status,200);assert.match(module.headers.get('content-type'),/javascript/);
      const d=(await api('catalog',undefined,alice.cookie)).body;
      for(const item of [...d.catalog,...d.crimes]){
        const response=await fetch(base+item.image);assert.equal(response.status,200,item.image);const bytes=new Uint8Array(await response.arrayBuffer());
        if(item.image.endsWith('.png')){assert.match(response.headers.get('content-type'),/image\/png/);assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);}
        else {assert.match(response.headers.get('content-type'),/image\/jpeg/);assert.equal(bytes[0],255);assert.equal(bytes[1],216);}
      }
    });
    await t.test('Owner quantities are validated atomically and collection limits prevent extra debits',async()=>{
      const id=alice.body.user.id;
      const possessions=(await api('me',undefined,alice.cookie)).body.possessions;
      for(const quantity of [0,-1,1.5,2,5,100,'2'])assert.equal((await api('admin/player',{id,changes:{cash:1,possessions:[{category:'garage',item_id:'collector',quantity}]}},owner.cookie)).status,400);
      assert.ok((await api('me',undefined,alice.cookie)).body.user.cash>1);
      assert.equal((await api('admin/player',{id,changes:{possessions:[...possessions.filter(a=>a.item_id!=='collector'),{category:'garage',item_id:'collector',quantity:1}]}},owner.cookie)).status,200);
      const before=(await api('me',undefined,alice.cookie)).body.user.cash;
      assert.equal((await api('assets/buy',{category:'garage',id:'collector',price:0,quantity:-1},alice.cookie)).status,409);
      assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,before);
    });
    await t.test('rank promotions refill after action costs, persist notices and cannot be reclaimed',async()=>{
      const {installGame}=await import('../game.js');const id=alice.body.user.id;let roll=0;
      const callbacks={bigScoreRoll:()=>9999,hash:()=>'',log:()=>{},json:(_res,status,body)=>({status,body}),roll:()=>roll,draw:min=>min};
      let engine=installGame(db,callbacks);
      db.prepare('DELETE FROM possessions WHERE user_id=?').run(id);
      for(const [xp,kind,outcome,expectedEnergy] of [[ranks[1].xp-80,'courier',0,110],[ranks[2].xp-20,'courier',9999,120],[ranks.at(-1).xp-80,'courier',0,340],[prestigeThreshold(1)-80,'courier',0,350]]){
        roll=outcome;db.prepare('DELETE FROM promotion_notifications').run();db.prepare('DELETE FROM actions WHERE user_id=?').run(id);
        db.prepare('UPDATE users SET xp=?,energy=20,health=100,prison_until=0,hospital_until=0,captured_until=0,energy_at=? WHERE id=?').run(xp,Date.now(),id);
        const result=engine.route({method:'POST'},null,'/api/action',{kind},{id});assert.equal(result.status,200);
        const user=engine.settle(id);assert.equal(user.energy,expectedEnergy);
        const notice=engine.profile(user).promotion;assert.equal(notice.energyBonus,10);assert.equal(notice.energyRestored,true);assert.equal(notice.energyMax,expectedEnergy);
        if(xp===ranks[1].xp-80)assert.ok(Math.abs(notice.incomePercent-10)<1e-8);
        if(xp===prestigeThreshold(1)-80){assert.equal(notice.distinctions,1);assert.ok(Math.abs(notice.incomePercent-(progression(prestigeThreshold(1)).incomeMultiplier/progression(ranks.at(-1).xp).incomeMultiplier-1)*100)<1e-8);}
        engine=installGame(db,callbacks);assert.equal(engine.profile(engine.settle(id)).promotion.id,notice.id);
        assert.equal((await api('promotion/ack',{id:notice.id},owner.cookie)).status,200);
        assert.equal(engine.profile(engine.settle(id)).promotion.id,notice.id);
        db.prepare('UPDATE users SET energy=1,energy_at=? WHERE id=?').run(Date.now(),id);
        assert.equal((await api('promotion/ack',{id:notice.id},alice.cookie)).status,200);
        assert.equal((await api('promotion/ack',{id:notice.id},alice.cookie)).status,200);
        const final=engine.settle(id);assert.equal(final.energy,1);assert.equal(engine.profile(final).promotion,null);
      }
      // No refill for XP gains within a rank or rejected cooldown requests.
      db.prepare('UPDATE users SET xp=0,energy=20,energy_at=? WHERE id=?').run(Date.now(),id);db.prepare('DELETE FROM actions WHERE user_id=?').run(id);roll=0;
      engine.route({method:'POST'},null,'/api/action',{kind:'courier'},{id});assert.equal(engine.settle(id).energy,12);assert.equal(engine.profile(engine.settle(id)).promotion,null);
      assert.equal(engine.route({method:'POST'},null,'/api/action',{kind:'courier'},{id}).status,429);assert.equal(engine.settle(id).energy,12);
    });
    await t.test('PvP promotions and multi-rank Owner grants preserve home bonuses',async()=>{
      const id=alice.body.user.id;const {installGame}=await import('../game.js');
      const engine=installGame(db,{bigScoreRoll:()=>9999,hash:()=>'',log:()=>{},json:(_res,status,body)=>({status,body}),roll:()=>0});
      db.prepare('DELETE FROM actions').run();db.prepare('DELETE FROM promotion_notifications').run();
      db.prepare('UPDATE users SET xp=?,energy=30,health=100,hospital_until=0,captured_until=0,protected_until=0,energy_at=?').run(ranks[3].xp-400,Date.now());
      assert.equal(engine.route({method:'POST'},null,'/api/pvp',{kind:'attack',target:'Bob'},{id}).status,200);
      assert.equal(engine.settle(id).energy,130);
      db.prepare('DELETE FROM promotion_notifications').run();db.prepare('UPDATE users SET xp=0,energy=1 WHERE id=?').run(id);
      assert.equal((await api('admin/player',{id,changes:{xp:ranks[3].xp,possessions:[{category:'home',item_id:'townhouse',quantity:1}]}},owner.cookie)).status,200);
      const user=(await api('me',undefined,alice.cookie)).body.user;assert.equal(user.energy,135);assert.equal(user.promotion.steps,3);assert.equal(user.promotion.energyBonus,30);
      assert.ok(Array.isArray(user.promotion.unlocks));
      await api('promotion/ack',{id:user.promotion.id},alice.cookie);
      await api('admin/player',{id,changes:{xp:ranks[4].xp,energy:7}},owner.cookie);
      const overridden=(await api('me',undefined,alice.cookie)).body.user;assert.equal(overridden.energy,7);assert.equal(overridden.promotion.energyRestored,false);
    });
    await t.test('investment and mystery endpoints resist duplicate requests over HTTP',async()=>{
      const id=alice.body.user.id;
      db.prepare('DELETE FROM police_bribes WHERE user_id=?').run(id);db.prepare('DELETE FROM custody WHERE user_id=?').run(id);
      db.prepare('UPDATE users SET cash=300000000000,energy=0,energy_at=?,health=100,hospital_until=0,captured_until=0,mystery_next_at=? WHERE id=?').run(Date.now(),Date.now()-1,id);
      db.prepare('UPDATE possessions SET income_at=? WHERE user_id=?').run(Date.now(),id);
      assert.equal((await api('investments')).status,401);
      const rates=(await api('investments',undefined,alice.cookie)).body.accounts.find(a=>a.scope==='personal');
      const quote=rates.quotes[0],body={scope:'personal',amount:60000000000,hours:6,rateBps:quote.rateBps};
      const opens=await Promise.all([api('investments/open',body,alice.cookie),api('investments/open',body,alice.cookie)]);
      assert.deepEqual(opens.map(x=>x.status).sort(),[200,409]);assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,240000000000);
      const position=opens.find(x=>x.status===200).body.id;db.prepare('UPDATE investments SET matures_at=? WHERE id=?').run(Date.now()-1,position);
      const claims=await Promise.all([api('investments/claim',{scope:'personal',id:position},alice.cookie),api('investments/claim',{scope:'personal',id:position},alice.cookie)]);
      assert.deepEqual(claims.map(x=>x.status).sort(),[200,409]);assert.equal((await api('me',undefined,alice.cookie)).body.user.cash,300000000000+Math.floor(60000000000*quote.rateBps/10000));
      assert.equal((await api('family/buy',{id:'safehouse-starter'},owner.cookie)).status,403);
      const offer=(await api('mystery',undefined,alice.cookie)).body.offer;assert.ok(offer);
      const results=await Promise.all([api('mystery/resolve',{id:offer.id,choice:'accept'},alice.cookie),api('mystery/resolve',{id:offer.id,choice:'accept'},alice.cookie)]);
      assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);assert.equal((await api('me',undefined,alice.cookie)).body.user.energy,0);
      const {familyAssets}=await import('../empire-catalog.js');
      for(const src of [...familyAssets.map(x=>x.image),'/images/personal-protection.jpg','/images/shipment-escort.jpg','/images/shipment-drugs.jpg','/images/shipment-guns.jpg','/images/mystery-contact.jpg'])assert.equal((await fetch(base+src)).status,200,src);
    });
    await t.test('account security enforces passphrases, session rotation, password changes and logout everywhere',async()=>{
      assert.equal((await api('register',{username:'ShortPass',email:'short@example.test',password:'tenletters!!'})).status,400);
      const account=await api('register',{username:'SecurityCheck',email:' SECURITY@example.test ',password});assert.equal(account.status,201);
      assert.match(db.prepare('SELECT password FROM users WHERE id=?').get(account.body.user.id).password,/^v2:/);
      assert.equal((await api('bank',{type:'deposit',amount:1},account.cookie,{'Sec-Fetch-Site':'cross-site'})).status,403);
      const login=await api('login',{login:'security@example.test',password},account.cookie);assert.equal(login.status,200);assert.notEqual(login.cookie,account.cookie);assert.equal((await api('me',undefined,account.cookie)).status,401);
      const second=await api('login',{login:'SecurityCheck',password});assert.equal(second.status,200);
      assert.equal((await api('account/password',{currentPassword:'wrong',newPassword:'Replacement-passphrase-823'},login.cookie)).status,401);
      const changed=await api('account/password',{currentPassword:password,newPassword:'Replacement-passphrase-823'},login.cookie);assert.equal(changed.status,200);assert.equal((await api('me',undefined,second.cookie)).status,401);assert.equal((await api('me',undefined,login.cookie)).status,401);assert.equal((await api('me',undefined,changed.cookie)).status,200);
      assert.equal((await api('account/logout-all',{},changed.cookie)).status,200);assert.equal((await api('me',undefined,changed.cookie)).status,401);
      assert.equal((await api('admin/security',undefined,changed.cookie)).status,401);assert.equal((await api('admin/security',undefined,alice.cookie)).status,403);assert.ok((await api('admin/security',undefined,owner.cookie)).body.entries.some(x=>x.event==='password_changed'));
      db.prepare('UPDATE users SET password=? WHERE username=?').run('corrupt','SecurityCheck');assert.equal((await api('login',{login:'SecurityCheck',password})).status,401);
      const response=await fetch(base+'/avatars/portrait-06.svg');assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/svg/);assert.equal((await fetch(base+'/avatars/portrait-99.svg')).status,404);
    });
    // Persistent login limits are asserted, including alternate username/email attempts.
    const failures = [];
    for (let i = 0; i < 20; i++) failures.push((await api('login', { login: 'Alice', password: 'wrong' })).status);
    assert.ok(failures.includes(401));assert.ok(failures.includes(429));assert.equal((await api('login',{login:'alice@example.test',password})).status,429);
    t.diagnostic('AUDIT login throttling, 20 failures: ' + JSON.stringify([...new Set(failures)]));
    t.diagnostic('AUDIT null registration body status: ' + (await api('register', null)).status);
    t.diagnostic('AUDIT foreign Origin + text/plain bank POST with explicit session status: ' +
      (await api('bank', { type: 'deposit', amount: 1 }, alice.cookie, { Origin: 'https://foreign.example', 'Content-Type': 'text/plain' })).status);
    await t.test('concurrent transfers conserve balances, deduplicate retries and serve the transfer UI',async()=>{
      const sender=alice.body.user.id,target=bob.body.user.id;
      db.prepare('DELETE FROM possessions WHERE user_id IN (?,?)').run(sender,target);
      db.prepare('UPDATE users SET cash=1000,energy=100,energy_at=? WHERE id=?').run(Date.now(),sender);
      db.prepare('UPDATE users SET cash=0,energy=0,energy_at=? WHERE id=?').run(Date.now(),target);
      const body={recipient:'Bob',kind:'cash',amount:700,requestKey:'cash-concurrency-0001'};
      const first=await Promise.all([api('transfers',body,alice.cookie),api('transfers',body,alice.cookie)]);assert.deepEqual(first.map(x=>x.status),[200,200]);assert.equal(first.filter(x=>x.body.duplicate).length,1);
      assert.equal(db.prepare('SELECT cash FROM users WHERE id=?').get(sender).cash,300);assert.equal(db.prepare('SELECT cash FROM users WHERE id=?').get(target).cash,700);
      const overspend=await Promise.all(['cash-concurrency-0002','cash-concurrency-0003'].map(requestKey=>api('transfers',{...body,amount:200,requestKey},alice.cookie)));assert.deepEqual(overspend.map(x=>x.status).sort(),[200,409]);
      const energy={recipient:'Bob',kind:'energy',amount:70,requestKey:'energy-concurrency-01'};const gifts=await Promise.all([api('transfers',energy,alice.cookie),api('transfers',energy,alice.cookie)]);assert.deepEqual(gifts.map(x=>x.status),[200,200]);assert.equal(db.prepare('SELECT energy FROM users WHERE id=?').get(sender).energy,30);assert.equal(db.prepare('SELECT energy FROM users WHERE id=?').get(target).energy,70);
      assert.equal((await api('transfers',body)).status,401);assert.equal((await fetch(base+'/transfers-ui.js')).status,200);assert.equal((await fetch(base+'/owner-ui.js')).status,200);
    });
    t.diagnostic('AUDIT CSP: ' + (await fetch(base)).headers.get('content-security-policy'));
    db.prepare('UPDATE users SET energy=0 WHERE username=?').run('Alice');
    db.prepare('UPDATE actions SET available_at=0').run();
    t.diagnostic('AUDIT depleted energy, expired cooldown status: ' + (await api('action', { kind: 'crime' }, alice.cookie)).status);
    t.diagnostic('AUDIT fixture integrity: ' + JSON.stringify(db.prepare('PRAGMA integrity_check').all()));
    // Raw malformed absolute-form request checks the outer async handler boundary.
    const exited = once(server, 'exit');
    await new Promise(resolve => {
      const req = http.request(base, { path: 'http://[', timeout: 2000 }, res => { res.resume(); res.on('end', resolve); });
      req.on('error', resolve);
      req.on('timeout', () => { req.destroy(); resolve(); });
      req.end();
    });
    let timer;
    const crash = await Promise.race([exited.then(([code]) => `exited ${code}`), new Promise(resolve => { timer = setTimeout(() => resolve('survived'), 1000); })]);
    clearTimeout(timer);
    t.diagnostic('AUDIT malformed request target: ' + crash);
    assert.equal(crash,'survived');
    assert.equal((await api('health')).status,200);
    await t.test('beta referral signup grants the exact starter bonus and validates the referrer',async()=>{
      db.exec("DELETE FROM auth_limits WHERE key LIKE 'register:%'");
      const ref=db.prepare("SELECT username FROM users WHERE role='owner' AND banned=0 LIMIT 1").get().username;
      const bad=await api('register',{username:'BadRef',email:'badref@example.test',password,referrer:'no_such_player'});assert.equal(bad.status,400);assert.equal(db.prepare("SELECT COUNT(*) n FROM users WHERE username='BadRef'").get().n,0);
      const good=await api('register',{username:'BetaFriend',email:'betafriend@example.test',password,referrer:ref});assert.equal(good.status,201);assert.equal(good.body.user.cash,25000000);
      const list=await api('referrals',undefined,good.cookie);assert.equal(list.status,200);assert.equal(list.body.rows[0].referrer,ref);
      assert.equal((await api('admin/referrals',undefined,good.cookie)).status,403);
      assert.equal((await api('family-directory',undefined,good.cookie)).status,200);
    });
  } finally {
    db?.close();
    if (server && server.exitCode === null && server.signalCode === null) {
      const stopped = once(server, 'exit');
      server.kill();
      await stopped;
    }
    // fixture is the exact directory returned by mkdtemp under the OS temp directory.
    assert.equal(path.dirname(fixture), tmpdir());
    assert.ok(path.basename(fixture).startsWith('mafia-audit-'));
    await rm(fixture, { recursive: true, force: true });
  }
});


