import {employees} from './city-expansion.js';
import {weapons} from './logistics.js';
import {skins,defaultSkin,legacySkin} from './skins.js';
import {catalog} from './catalog.js';
import {progression} from './progression.js';
import {career} from './empire-catalog.js';
export const profileOptions={avatars:skins,themes:['gold','silver','burgundy'],emblems:['crown','diamond','rose','wolf'],banners:[{id:'skyline',name:'City skyline',image:'/images/city-new-york.png'},{id:'estate',name:'Private estate',image:'/images/family-compound-estate.jpg'},{id:'marina',name:'Coastal compound',image:'/images/family-compound-palace.jpg'}]};
export function installProfiles(db,{owned,profile,transaction,fail,clock,achievements=()=>[],themes=()=>[],honor=()=>null,frames=()=>['plain'],avatars=()=>skins.filter(s=>!s.cents&&!s.ownerOnly)}){
 const q=(s,...a)=>db.prepare(s).get(...a),run=(s,...a)=>db.prepare(s).run(...a);
 db.exec("CREATE TABLE IF NOT EXISTS player_profiles(user_id INTEGER PRIMARY KEY REFERENCES users(id),theme TEXT NOT NULL DEFAULT 'gold',emblem TEXT NOT NULL DEFAULT 'crown',banner TEXT NOT NULL DEFAULT 'skyline',bio TEXT NOT NULL DEFAULT '')");
 if(!db.prepare('PRAGMA table_info(player_profiles)').all().some(c=>c.name==='avatar'))db.exec("ALTER TABLE player_profiles ADD COLUMN avatar TEXT NOT NULL DEFAULT 'portrait-01'");
 if(!db.prepare('PRAGMA table_info(player_profiles)').all().some(c=>c.name==='frame'))db.exec("ALTER TABLE player_profiles ADD COLUMN frame TEXT NOT NULL DEFAULT 'plain'");
 const extras=id=>[...db.prepare('SELECT item_id,quantity FROM employees WHERE user_id=?').all(id).map(r=>({...employees.find(e=>e.id===r.item_id),quantity:r.quantity,category:'employee'})),...db.prepare("SELECT weapon_id,quantity FROM armory_weapons WHERE scope='personal' AND owner_id=?").all(id).map(r=>({...weapons.find(w=>w.id===r.weapon_id),quantity:r.quantity,category:'weapon'}))].filter(a=>a.name);
 const banners=id=>[...profileOptions.banners,...extras(id).map(a=>({id:'asset:'+a.category+':'+a.id,name:a.name,image:a.image})),...owned(id).map(a=>catalog.find(x=>x.category===a.category&&x.id===a.item_id)).filter(Boolean).map(a=>({id:'asset:'+a.category+':'+a.id,name:a.name,image:a.image}))];
 const storedAppearance=id=>q('SELECT theme,emblem,banner,bio,avatar,frame FROM player_profiles WHERE user_id=?',id)||{theme:'gold',emblem:'crown',banner:'skyline',bio:'',avatar:'portrait-01',frame:'plain'};
 const appearance=id=>{const a=storedAppearance(id),skin=avatars(id).find(s=>s.id===legacySkin(a.avatar))||defaultSkin;return {...a,avatar:skin.id,skin,bannerImage:(banners(id).find(b=>b.id===a.banner)||profileOptions.banners[0]).image};};
 function route(method,path,body,user){
  if(path==='/api/profile/settings'){
   if(method!=='POST')fail('Method not allowed',405);
   if(Object.keys(body).some(k=>!['theme','emblem','banner','bio','title','avatar','frame'].includes(k))||![...profileOptions.themes,...themes(user.id)].includes(body.theme)||!profileOptions.emblems.includes(body.emblem)||!banners(user.id).some(x=>x.id===body.banner)||typeof body.bio!=='string'||body.bio.length>160||typeof body.title!=='string'||body.frame!==undefined&&!frames(user.id).includes(body.frame)||body.avatar!==undefined&&!avatars(user.id).some(a=>a.id===legacySkin(body.avatar)))fail('Choose the available profile styles and a bio of at most 160 characters.');
   return transaction(()=>{const p=profile(q('SELECT * FROM users WHERE id=?',user.id));if(body.title&&!p.benefits.titles.some(t=>t.id===body.title))fail('This title is not unlocked.',403);
    run('INSERT INTO player_profiles(user_id,theme,emblem,banner,bio) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme,emblem=excluded.emblem,banner=excluded.banner,bio=excluded.bio',user.id,body.theme,body.emblem,body.banner,body.bio.trim());
    if(body.avatar!==undefined)run('UPDATE player_profiles SET avatar=? WHERE user_id=?',legacySkin(body.avatar),user.id);
    if(body.frame!==undefined)run('UPDATE player_profiles SET frame=? WHERE user_id=?',body.frame,user.id);
    run('UPDATE users SET selected_title=? WHERE id=?',body.title,user.id);return {ok:true,message:'Your profile has been updated.',image:banners(user.id).find(x=>x.id===body.banner).image};});
  }
  if(!path.startsWith('/api/profiles/'))return null;
  if(method!=='GET')fail('Method not allowed',405);
  const value=path.slice('/api/profiles/'.length);if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value)))fail('Invalid player ID.');
  const target=q('SELECT * FROM users WHERE id=? AND banned=0',Number(value));if(!target)fail('Player not found.',404);
  const p=profile(target),family=q('SELECT f.id,f.name,CASE WHEN f.leader_id=m.user_id THEN \'Don\' ELSE upper(substr(m.family_role,1,1)) || substr(m.family_role,2) END role FROM family_members m JOIN families f ON f.id=m.family_id WHERE m.user_id=?',target.id),assets=owned(target.id).map(a=>({...catalog.find(x=>x.category===a.category&&x.id===a.item_id),...a})).filter(a=>a.name).map(a=>({category:a.category,item_id:a.item_id,name:a.name,image:a.image,quantity:a.quantity,price:a.price,income:a.income,title:a.title}));
  return {player:{marriage:p.marriage,supporter:p.supporter,achievements:achievements(target.id).filter(x=>x.earnedAt),power:p.power,armory:p.armory,id:target.id,username:target.username,staffRole:['owner','admin'].includes(target.role)?target.role:null,cash:target.cash,xp:target.xp,city:target.city,createdAt:target.created_at,playMillis:target.play_ms||0,daysPlayed:q('SELECT COUNT(*) n FROM player_active_days WHERE user_id=?',target.id).n,...progression(target.xp),title:p.title,respect:{...p.respect,received:target.respect_received},family:family?{...family,honor:honor(family.id)}:null,careers:{drugs:career('drugs',target.drugs_xp),guns:career('guns',target.guns_xp)},status:target.prison_until>clock()?'In prison':target.coma_until>clock()?'In a coma':target.hospital_until>clock()?'In hospital':'Active',assets,assetCount:assets.reduce((n,a)=>n+a.quantity,0)+p.armory.weaponCount,assetValue:assets.reduce((n,a)=>n+a.price*a.quantity,0)+p.armory.weaponValue,passiveIncome:p.benefits.income,appearance:appearance(target.id)},canEdit:target.id===user.id,options:target.id===user.id?{...profileOptions,banners:banners(user.id),avatars:avatars(user.id),frames:frames(user.id),themes:[...profileOptions.themes,...themes(user.id)],titles:p.benefits.titles,selectedTitle:target.selected_title}:undefined};
 }
 return {route};
}
