// Ordered male/female pairs. Premium visuals are cosmetic: they do not grant ranks.
export const skins=[
 ['street-runner','The Street Runner','male',0],['street-fixer','The Street Fixer','female',0],
 ['getaway-driver','The Getaway Driver','male',0],['night-driver','The Night Driver','female',0],
 ['street-broker','The Street Broker','male',0],['city-broker','The City Broker','female',0],
 ['capo-vittorio','Capo Vittorio','male',399],['capo-valentina','Capo Valentina','female',399],
 ['consigliere-lorenzo','Consigliere Lorenzo','male',399],['consigliere-isabella','Consigliere Isabella','female',399],
 ['underboss-dante','Underboss Dante','male',399],['underboss-bianca','Underboss Bianca','female',399],
 ['don-salvatore','Don Salvatore','male',399],['donna-francesca','Donna Francesca','female',399],
 ['capo-antonio','Capo Antonio','male',399],['capo-rosalia','Capo Rosalia','female',399],
 ['don-marcello','Don Marcello','male',399],['donna-caterina','Donna Caterina','female',399],
 ['godfather','The Godfather','male',599],['godmother','The Godmother','female',599]
].map(([id,name,gender,cents],index)=>({id,name,gender,cents,image:'/images/skin-'+id+'.png',frame:cents?'skin-'+id:'plain',frameName:cents?(cents===599?'Imperial rose':'Signature')+' · '+name:'Plain',accent:['gold','burgundy','platinum','ivory','onyx','emerald','gold','sapphire'][Math.floor(index/2)%8]}));
for(const [id,name,gender] of [['owner-god','The Mafia God','male'],['owner-goddess','The Mafia Goddess','female']])skins.push({id,name,gender,cents:0,ownerOnly:true,image:'/images/skin-'+id+'.png',frame:'owner-diamond',frameName:'Owner Diamond',accent:'platinum'});
export const defaultSkin=skins[0];
export const legacySkin=id=>/^portrait-(0[1-9]|1[0-2])$/.test(id||'')?skins[(Math.max(1,Number(id.slice(-2)))-1)%6].id:id;

skins.find(s=>s.id==='owner-goddess').image='/images/skin-owner-goddess-v2.png';
