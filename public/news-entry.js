// Check on both a fresh app opening with an existing session and a new login.
// The server keeps read receipts per account; navigation within a session stays put.
export function createNewsEntry(loadNews){
 let checked=null,pending=null,generation=0;
 return {
  reset(){checked=null;pending=null;generation++;},
  async target(userId,current='dashboard'){
   if(checked===userId)return current;
   const ticket=generation;
   if(!pending||pending.userId!==userId)pending={userId,promise:Promise.resolve().then(loadNews)};
   let news;try{news=await pending.promise;}catch(error){pending=null;throw error;}
   if(ticket!==generation)return current;
   checked=userId;pending=null;
   return news.unread?'bulletins':current;
  }
 };
}
