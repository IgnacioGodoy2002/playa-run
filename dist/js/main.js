import {CHARACTERS} from './animal-models.js';
import {CharacterPreview} from './character-preview.js';
import {runSpeed,BASE_SPEED,MAX_SPEED} from './difficulty.js';
import {View} from './render.js';import {World} from './world.js';import {Input} from './input.js';import {PlayerPhysics} from './physics.js';import {AudioEngine} from './audio.js';
import {suraService} from './sura.js';
import {fetchLeaderboard} from './leaderboard.js';
const $=id=>document.getElementById(id);let view;try{view=new View($('game'))}catch(e){$('error').hidden=false;throw e}const world=new World(view.scene),p=new PlayerPhysics(),audio=new AudioEngine();let mode='menu',distance=0,coins=0,score=0,best=0,time=0,speed=BASE_SPEED,powers={},invincible=0,toastTimer,runStartedAt=0;try{best=Number(localStorage.getItem('playa-best'))||Number(localStorage.getItem('selva-best'))||0}catch{}$('best').textContent=best.toLocaleString('es-AR');
// El récord que manda el host es el de la cuenta, y es la autoridad: se asigna,
// no se combina. Un `Math.max` acá anularía el arreglo de sura.js, porque el
// valor que se leyó del localStorage en la línea de arriba puede ser basura
// vieja de este dispositivo — un score forjado, o un récord que el backend ya
// corrigió. El localStorage queda sólo como lo que se muestra antes de que
// llegue el INIT_GAME, y mientras se juega sin host.
suraService.onAccountBestResolved(v=>{best=v;$('best').textContent=best.toLocaleString('es-AR')});
suraService.onPause(()=>{if(mode==='run')pause()});
suraService.onResume(()=>{if(mode==='pause')pause()});
suraService.start();
// El host dibuja su propia X de cerrar arriba a la derecha, encima del iframe
// /WebView: la fila de botones del juego se corre para no quedar debajo (ver
// `body.embedded header` en style.css).
if(suraService.isEmbedded)document.body.classList.add('embedded');
// En mobile el pie va oculto; la marca de versión se espeja dentro del menú
// para seguir pudiendo confirmar qué build quedó servida.
$('buildTagMenu').textContent=$('buildTag').textContent;

// Escapa antes de meter un alias (texto de otro jugador, no confiable) en
// innerHTML — el leaderboard es público, cualquiera puede haber elegido un
// nickname con '<' o '&' adentro.
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
// Por qué no hay ranking. Distinguirlo importa: cada motivo se arregla en un
// lugar distinto, y sin esto "no carga el ranking" obliga a adivinar entre un
// problema del juego, del host o de la API.
//   E1 = el host nunca contestó el MINIGAME_READY (no hay puente, o no
//        responde) — se arregla del lado de la app.
//   E2 = el handshake llegó pero sin gameId/apiBaseUrl — se arregla en el
//        payload del INIT_GAME del host.
//   E3 = había sesión y endpoint, y la API falló o no es alcanzable (CORS,
//        500, timeout) — se arregla del lado del backend.
function motivoSinRanking(){
 if(!suraService.isEmbedded)return null;
 if(!suraService.hasSession())return {codigo:'E1',corto:'SURA no respondió.',largo:'La app no contestó el pedido de sesión. Probá cerrar y volver a abrir el juego.'};
 if(!suraService.getGameId()||!suraService.getApiBaseUrl())return {codigo:'E2',corto:'Sesión sin datos de ranking.',largo:'La sesión llegó sin los datos para consultar el ranking.'};
 return {codigo:'E3',corto:'No se pudo cargar el ranking.',largo:'No se pudo cargar el ranking. Probá de nuevo en un rato.'};
}
function renderTop3(entries){
 const list=$('top3List');
 // null = no hay entradas reales que mostrar (ver fetchLeaderboard). No se
 // rellena con la preview: un ranking inventado se lee como uno roto.
 if(entries===null){
  const m=motivoSinRanking()||{codigo:'E3',corto:'No se pudo cargar el ranking.'};
  list.innerHTML=`<li class="top3-empty">${escapeHtml(m.corto)} <b class="diag">${m.codigo}</b></li>`;
  return;
 }
 const top=entries.slice(0,3);
 if(!top.length){list.innerHTML='<li class="top3-empty">Todavía no hay puntajes.</li>';return}
 const medals=['🥇','🥈','🥉'];
 list.innerHTML=top.map((e,i)=>`<li><span class="t3-rank">${medals[i]||e.rank}</span><span class="t3-alias">${escapeHtml(e.alias)}</span><span class="t3-score">${e.score.toLocaleString('es-AR')}</span></li>`).join('');
}
function renderRanking(entries){
 const list=$('rankingList'),loading=$('rankingLoading');
 if(entries===null){
  const m=motivoSinRanking()||{codigo:'E3',largo:'No se pudo cargar el ranking. Probá de nuevo en un rato.'};
  loading.innerHTML=`${escapeHtml(m.largo)} <b class="diag">${m.codigo}</b>`;
  loading.hidden=false;list.hidden=true;return;
 }
 if(!entries.length){loading.textContent='Todavía no hay puntajes.';loading.hidden=false;list.hidden=true;return}
 list.innerHTML=entries.map(e=>`<li class="${e.isMe?'me':''}"><span class="r-rank">#${e.rank}</span><span class="r-alias">${escapeHtml(e.alias)}</span><span class="r-score">${e.score.toLocaleString('es-AR')}</span></li>`).join('');
 loading.hidden=true;list.hidden=false;
}
// En standalone se puede pedir ya mismo (cae al listado de preview). Embebido,
// recién tiene sentido una vez que el handshake terminó y hay gameId/apiBaseUrl
// reales — antes de eso solo mostraría la preview y la pisaría igual al toque.
if(suraService.isEmbedded){
 let handshakeDone=false;
 suraService.onSessionReady(()=>{handshakeDone=true;fetchLeaderboard(50).then(renderTop3)});
 // Si el handshake nunca llega (host viejo, puente roto), el TOP 3 se
 // quedaba en "Cargando…" para siempre.
 setTimeout(()=>{if(!handshakeDone)renderTop3(null)},10000);
}
else fetchLeaderboard(50).then(renderTop3);
$('openRanking').onclick=()=>{
 $('rankingOverlay').hidden=false;$('rankingLoading').hidden=false;$('rankingLoading').textContent='Cargando…';$('rankingList').hidden=true;
 fetchLeaderboard(50).then(renderRanking);
};
$('closeRanking').onclick=()=>{$('rankingOverlay').hidden=true};
const names={shield:'Escudo',magnet:'Imán',double:'Puntaje ×2',speed:'Impulso'};function toast(text){$('feedback').textContent=text;$('feedback').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('feedback').classList.remove('show'),650)}
function action(type){if(type==='pause'){if(mode==='run'||mode==='pause')pause();return}if(mode!=='run')return;if(p.input(type)){toast({left:'←',right:'→',jump:'↑ Salto',slide:'↓ ¡Agachate!'}[type]);if(type==='jump'||type==='slide')audio.effect(type)}}const input=new Input($('game'),action);$('instructions').innerHTML=input.touch?'<div><b>← → Deslizá</b>Cambiar de carril</div><div><b>↑ / ↓ Deslizá</b>Saltar / deslizarse</div>':'<div><b><kbd>←</kbd> <kbd>→</kbd> o A / D</b>Cambiar de carril</div><div><b><kbd>↑</kbd> Espacio / W</b>Saltar</div><div><b><kbd>↓</kbd> S</b>Deslizarse</div>';
let selectedCharacter='suri',preview=null;
try{const saved=localStorage.getItem('playa-character');if(CHARACTERS.some(c=>c.id===saved))selectedCharacter=saved}catch{}
try{preview=new CharacterPreview($('characterPreview'))}catch(e){console.warn('Character preview unavailable',e);$('characterPreview').hidden=true}
function selectCharacter(id){
 const info=CHARACTERS.find(c=>c.id===id);if(!info||mode!=='menu')return;
 selectedCharacter=id;view.setCharacter(id);preview?.setCharacter(id);
 for(const button of document.querySelectorAll('[data-character]'))button.setAttribute('aria-pressed',String(button.dataset.character===id));
 $('characterName').textContent=info.name;$('characterCaption').textContent=info.caption;
 $('selectionStatus').textContent='Vas a jugar con '+info.name;
 $('characterPreview').setAttribute('aria-label','Vista previa de '+info.name);
 try{localStorage.setItem('playa-character',id)}catch{}
}
const characterButtons=[...document.querySelectorAll('[data-character]')];
characterButtons.forEach((button,index)=>{button.onclick=()=>selectCharacter(button.dataset.character);button.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=characterButtons[(index+(e.key==='ArrowRight'?1:characterButtons.length-1))%characterButtons.length];next.focus();selectCharacter(next.dataset.character)}});
selectCharacter(selectedCharacter);
function start(){view.setCharacter(selectedCharacter);p.reset();world.reset();distance=coins=score=time=0;speed=BASE_SPEED;powers={};invincible=0;mode='run';runStartedAt=performance.now();suraService.notifyStarted();$('menu').hidden=true;$('dialog').hidden=true;$('footer').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pausar');audio.init(true);$('soundState').textContent='ON';$('sound').setAttribute('aria-label','Silenciar');audio.music(true);updateHud()}
function updateHud(){$('score').textContent=Math.floor(score).toString().padStart(5,'0');$('distance').textContent=Math.floor(distance)+' m';$('coins').textContent='◈ '+coins;$('velocity').textContent=speed.toFixed(0);$('speedFill').style.width=Math.min(100,(speed-BASE_SPEED)/(MAX_SPEED-BASE_SPEED)*100)+'%';$('powers').innerHTML=Object.entries(powers).filter(([,v])=>v>0).map(([k,v])=>`<span>${names[k]} · ${Math.ceil(v)} s${k==='speed'?' · protegido':''}</span>`).join('')}
function pause(){if(mode==='run'){mode='pause';$('dialog').hidden=false;$('dialogTag').textContent='TOMATE UN RESPIRO';$('dialogTitle').innerHTML='La playa<br>puede esperar.';$('results').hidden=true;$('resume').innerHTML='Seguir viaje <span>↗</span>';$('pause').textContent='▶';$('pause').setAttribute('aria-label','Reanudar');audio.music(false)}else if(mode==='pause'){mode='run';$('dialog').hidden=true;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Pausar');audio.init();audio.music(true)}}
function die(){mode='dead';audio.effect('hit');audio.music(false);const finalScore=Math.floor(score),durationMs=runStartedAt>0?Math.round(performance.now()-runStartedAt):undefined;suraService.notifyCompleted(finalScore,durationMs);suraService.requestNewSession();best=Math.max(best,finalScore);try{localStorage.setItem('playa-best',best)}catch{}$('best').textContent=best.toLocaleString('es-AR');$('dialogTag').textContent='FIN DE LA AVENTURA';$('dialogTitle').innerHTML='Un paso más<br>la próxima vez.';$('results').hidden=false;$('finalScore').textContent=Math.floor(score).toLocaleString('es-AR');$('finalDetail').textContent=`${Math.floor(distance)} metros · ${coins} monedas · Mejor: ${best}`;$('resume').innerHTML='Volver a rodar <span>↗</span>';setTimeout(()=>{if(mode==='dead')$('dialog').hidden=false},500)}
$('start').onclick=start;$('resume').onclick=()=>mode==='pause'?pause():start();$('pause').onclick=pause;$('sound').onclick=()=>{const enabled=audio.toggle();$('soundState').textContent=enabled?'ON':'OFF';$('sound').setAttribute('aria-label',enabled?'Silenciar':'Activar sonido');if(enabled&&mode==='run')audio.music(true)};$('home').onclick=()=>{mode='menu';world.reset();p.reset();$('menu').hidden=false;$('dialog').hidden=true;$('hud').hidden=true;$('footer').hidden=false;document.body.classList.remove('playing');audio.music(false);
 // El TOP 3 se pedia una sola vez, en onSessionReady. Al volver de una partida
 // el host manda un INIT_GAME nuevo, pero con el mismo gameId, apiBaseUrl y
 // nickname — y onSessionReady solo dispara si alguno de esos tres cambio (ver
 // `endpointCambio` en sura.js). Resultado: el TOP 3 del menu mostraba lo que
 // habia al abrir el juego y no se actualizaba nunca, ni despues de hacer un
 // record. Safari Crossing ya refresca asi (showMenu -> applyLang ->
 // refreshTop3); esto lo empareja.
 if(suraService.isEmbedded)fetchLeaderboard(50).then(renderTop3)};document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='run')pause()});window.addEventListener('blur',()=>{if(mode==='run')pause()});
// Consume elapsed time in small collision steps instead of slowing the entire game
// whenever rendering drops below 22 FPS. Rendering and HUD update only once per frame.
function simulate(dt){time+=dt;speed=runSpeed(distance)+(powers.speed>0?6:0);distance+=speed*dt;score+=speed*dt*(powers.double>0?2:1);p.update(dt);invincible=Math.max(0,invincible-dt);for(let k in powers)powers[k]=Math.max(0,powers[k]-dt);world.update(dt,speed,true,p,powers.magnet>0,false,distance);for(let o of [...world.items]){if(!o.obstacle){let close=Math.abs(o.z)<1.2&&Math.abs(p.x-o.lane*2.5)<1&&Math.abs(p.y)<1.7;if(o.attracting?o.arrived:close){if(o.type==='coin'){coins++;score+=10*(powers.double>0?2:1);audio.effect('coin')}else{powers[o.type]=o.type==='speed'?6:10;audio.effect('power');toast(names[o.type]+' activado')}world.remove(o)}}else if(invincible<=0&&p.collides(o,o.oldZ)){if(powers.shield>0||powers.speed>0){if(!powers.speed)powers.shield=0;invincible=.65;world.remove(o);audio.effect('power');toast('¡Protegido!')}else{die();break}}}}
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const raw=Math.max(0,(now-last)/1000);last=now;const elapsed=Math.min(raw,.25);
 if(mode==='run'){const oldDistance=distance;let remaining=elapsed;while(remaining>1e-8&&mode==='run'){const step=Math.min(remaining,1/120);simulate(step);remaining-=step}const consumed=elapsed-remaining;if(consumed>0)world.scenery.update(consumed,(distance-oldDistance)/consumed);updateHud()}
 else if(mode==='menu'){time+=elapsed;world.update(elapsed,3,false);preview?.draw(time)}
 else if(mode==='dead'){time+=elapsed}
 view.aura.visible=powers.shield>0||powers.speed>0;view.magnetIcon.visible=powers.magnet>0&&mode!=='menu';view.player.visible=invincible<=0||Math.floor(now/70)%2===0;view.draw(p,time,mode,speed,raw);
}
requestAnimationFrame(frame);
