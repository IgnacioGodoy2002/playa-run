// Leaderboard real de Playa Run, vía el endpoint público (sin auth) de Sura:
// GET {apiBaseUrl}/minigames/v1/games/{gameId}/leaderboard?per_page=N
//
// Mismo endpoint y misma forma de respuesta que ya usan Pengu Rush y
// Joystick Pop (ver sus LeaderboardService.ts) — gameId y apiBaseUrl salen
// del handshake INIT_GAME, no de nada hardcodeado en build time.
//
// Sin sesión real (standalone, o antes de que el handshake termine) cae al
// listado de preview, para que la pantalla nunca se vea vacía.

import {suraService} from './sura.js';

const PREVIEW_ENTRIES=[
 {rank:1,alias:'CostaReal_99',score:9840},
 {rank:2,alias:'TucanVeloz',score:8620},
 {rank:3,alias:'CapyRunner',score:7910},
 {rank:4,alias:'MapacheX',score:6540},
 {rank:5,alias:'SuriPro',score:5980},
 {rank:6,alias:'PlayaKid',score:5120},
 {rank:7,alias:'OlaFeroz',score:4430},
 {rank:8,alias:'ArenaRush',score:3870},
 {rank:9,alias:'SolVeloz',score:3290},
 {rank:10,alias:'BrisaGamer',score:2650},
];

// Cuánto se espera al endpoint antes de darlo por caído. Sin esto, en la app
// nativa con señal mala el fetch queda colgado y el TOP 3 se queda en
// "Cargando…" para siempre.
const FETCH_TIMEOUT_MS=8000;

/**
 * Devuelve las entradas reales, o:
 *   - PREVIEW_ENTRIES en standalone (pestaña suelta): no hay backend al que
 *     pedirle nada y la pantalla no debería verse vacía.
 *   - null si hay sesión real pero el pedido falló. Embebido NUNCA se cae a
 *     la preview: mostrar alias inventados adentro de la app se lee como un
 *     ranking que "cargó mal", que es justo lo que se estaba viendo en
 *     mobile. Quien lo consuma muestra un estado de error explícito.
 */
export async function fetchLeaderboard(perPage){
 const gameId=suraService.getGameId(), apiBaseUrl=suraService.getApiBaseUrl();
 if(!suraService.isEmbedded)return PREVIEW_ENTRIES;
 if(!gameId||!apiBaseUrl)return null;

 const controller=typeof AbortController==='function'?new AbortController():null;
 const timer=controller?setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS):0;
 try{
  const res=await fetch(
   `${apiBaseUrl}/minigames/v1/games/${gameId}/leaderboard?per_page=${perPage||50}`,
   controller?{signal:controller.signal}:undefined
  );
  if(!res.ok)return null;
  const body=await res.json();
  const entries=body&&body.data&&body.data.entries;
  if(!Array.isArray(entries))return null;
  const me=suraService.getNickname();
  return entries.map(e=>({
   rank:e.position,
   // Puede llegar alias null (jugador sin nickname) — placeholder
   // genérico, nunca un nombre inventado.
   alias:e.alias==null?`Player ${e.position}`:e.alias,
   score:e.best_score,
   isMe:me!==null&&e.alias===me,
  }));
 }catch{
  return null;
 }finally{
  if(timer)clearTimeout(timer);
 }
}
