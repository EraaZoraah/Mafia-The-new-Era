import {html as lhtml,text as ltext} from './localization.js';
if('serviceWorker' in navigator&&window.isSecureContext){navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{});}
let promptEvent=null;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;if(document.getElementById('install-game'))return;const b=document.createElement('button');b.id='install-game';b.className='btn small install-game';b.innerHTML=lhtml('<span aria-hidden="true">⇩</span> Install game');b.onclick=async()=>{if(!promptEvent)return;await promptEvent.prompt();await promptEvent.userChoice;promptEvent=null;b.remove()};document.body.append(b)});
window.addEventListener('appinstalled',()=>{promptEvent=null;document.getElementById('install-game')?.remove()});
