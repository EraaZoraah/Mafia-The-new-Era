export const isStaff=u=>['owner','admin'].includes(u.role);
export function guardStaff(db,user,path,body={},url=path){
 if(!path.startsWith('/api/admin'))return;
 const fail=m=>{throw Object.assign(Error(m),{status:403})},q=(s,...v)=>db.prepare(s).get(...v);
 if(!isStaff(user))fail('Staff access required.');
 const targetId=body.targetId??body.id??new URL(url,'http://localhost').searchParams.get('id');
 if(!path.includes('/family')&&body.scope!=='family'&&new URL(url,'http://localhost').searchParams.get('scope')!=='family'&&['/api/admin/player','/api/admin/user','/api/admin/logistics','/api/admin/investments','/api/admin/state','/api/admin/investment'].includes(path)&&q('SELECT 1 FROM users WHERE id=? AND deleted_at>0',Number(targetId)||0))fail('This account has been deleted.');
 if(user.role==='owner')return;
 const params=new URL(url,'http://localhost').searchParams;
 const owner=id=>q("SELECT 1 FROM users WHERE id=? AND role='owner'",Number(id)||0);
 const ownerFamily=id=>q("SELECT 1 FROM families f WHERE f.id=? AND (EXISTS(SELECT 1 FROM users u WHERE u.id=f.leader_id AND u.role='owner') OR EXISTS(SELECT 1 FROM family_members m JOIN users u ON u.id=m.user_id WHERE m.family_id=f.id AND u.role='owner'))",Number(id)||0);
 const target=body.id??params.get('id'),c=body.changes||(body.field?{[body.field]:body.value}:{});
 if(['/api/admin/player','/api/admin/user'].includes(path)){
  if(owner(target))fail('Owner accounts are protected from Admin access.');
  if(c.role==='owner'||c.role==='moderator')fail('Admins cannot grant this role.');
  if(Number(target)===user.id&&'role' in c&&c.role!==user.role)fail('Admins cannot change their own role.');

 }
 if(['/api/admin/family','/api/admin/state','/api/admin/investment','/api/admin/investments','/api/admin/logistics'].includes(path)){
  const scope=body.scope??params.get('scope'),id=path==='/api/admin/family'?target:(body.targetId??params.get('id'));
  if(path!=='/api/admin/family'&&scope!=='family'&&owner(id))fail('Owner accounts are protected.');
  if(path==='/api/admin/family'){
   const f=q('SELECT leader_id FROM families WHERE id=?',Number(id)||0);
   if(c.don){const next=q('SELECT id FROM users WHERE username=?',c.don);if((owner(f?.leader_id)||owner(next?.id))&&next?.id!==f?.leader_id)fail('Admins cannot change the Owner’s family leadership.');}
   if(Array.isArray(c.members)){
    const protectedMembers=db.prepare("SELECT u.id,u.username,m.family_role,COALESCE(fc.total,'0') donated FROM family_members m JOIN users u ON u.id=m.user_id LEFT JOIN family_contributions fc ON fc.user_id=u.id AND fc.family_id=m.family_id WHERE m.family_id=? AND u.role='owner'").all(Number(id)||0);
    for(const p of protectedMembers){const row=c.members.find(x=>x.username?.toLowerCase()===p.username.toLowerCase());if(!row||row.role!==p.family_role||String(row.donated)!==String(p.donated))fail('Preserve the Owner’s membership, role and contributions.');}
    for(const row of c.members){const u=q('SELECT id FROM users WHERE username=?',row.username||'');if(owner(u?.id)&&!protectedMembers.some(p=>p.id===u.id))fail('Admins cannot move the Owner.');}
   }
  }
 }
}
