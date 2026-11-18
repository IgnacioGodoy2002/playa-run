// Integración con la plataforma SURA — parent-submit vía postMessage.
//
// Playa Run no tenía ninguna de estas piezas: corría standalone nomás, sin
// avisarle a nada cuándo termina una partida. Este módulo replica el mismo
// contrato que ya usan Pengu Rush / Safari Crossing / Joystick Pop:
//
//   MINIGAME_READY  (juego → host) — se manda apenas carga, antes de saber
//                   siquiera si hay un host real escuchando.
//   INIT_GAME       (host → juego) — primera y única fuente de sessionId,
//                   token, gameId, apiBaseUrl y bestScore. Nada de esto se
//                   hardcodea en build time: un solo build sirve en
//                   localhost, staging, prod y la WebView nativa.
//   SESSION_ACCEPTED (juego → host) — ack de que el handshake se completó.
//   MINIGAME_STARTED (juego → host) — cuando arranca la corrida real.
//   GAME_COMPLETE   (juego → host) — flat, no envelope (a diferencia de
//                   todo lo demás): { type, sessionId, score, provider,
//                   duration_ms }.
//
// Si no hay host (abierto suelto en una pestaña), todo esto es un no-op:
// el juego sigue funcionando en modo standalone con el récord local de
// siempre.

const SURA_MSG = {
 INIT: 'INIT_GAME',
 READY: 'MINIGAME_READY',
 STARTED: 'MINIGAME_STARTED',
 SESSION_ACCEPTED: 'SESSION_ACCEPTED',
 COMPLETED: 'GAME_COMPLETE',
 PAUSE: 'MINIGAME_PAUSE',
 RESUME: 'MINIGAME_RESUME',
 ERROR: 'MINIGAME_ERROR',
};

// El host no usa un solo juego de nombres: según el minijuego aparece
// MINIGAME_PAUSE o SURA_MINIGAME_PAUSE, SESSION_ACCEPTED o
// MINIGAME_SESSION_ACCEPTED. En vez de pedirle al host que unifique, el
// juego acepta las dos formas de entrada y manda el ack en las dos de
// salida: un type que el host no conoce lo ignora, pero uno que esperaba y
// no llega le deja la sesión colgada.
const INBOUND_ALIASES = {
 INIT_GAME: SURA_MSG.INIT,
 SURA_INIT_GAME: SURA_MSG.INIT,
 MINIGAME_PAUSE: SURA_MSG.PAUSE,
 SURA_MINIGAME_PAUSE: SURA_MSG.PAUSE,
 MINIGAME_RESUME: SURA_MSG.RESUME,
 SURA_MINIGAME_RESUME: SURA_MSG.RESUME,
};

const SESSION_ACCEPTED_TYPES = ['SESSION_ACCEPTED', 'MINIGAME_SESSION_ACCEPTED'];

// El WebView nativo engancha su handler de mensajes DESPUÉS de que la página
// terminó de cargar: un único MINIGAME_READY al arrancar se perdía en el
// aire y el handshake no empezaba nunca. Se reanuncia con backoff hasta que
// contesten (~7s en total), y se corta apenas llega el INIT_GAME para no
// hacerle abrir sesiones de más al host.
const READY_RETRY_DELAYS = [0, 300, 700, 1500, 2500, 2500];

const GAME_SLUG = 'playa_run';
const GAME_VERSION = 1;

// Misma key que main.js ya usa para el récord local — reconciliado acá
// contra el bestScore de la cuenta real, nunca al revés (ver handleInit).
const STORAGE_KEY_RECORD = 'playa-best';

// El puente de React Native solo transporta strings: lo que llega puede ser
// el objeto ya parseado (iframe web) o su JSON (app nativa).
function parseEnvelope(data) {
 if (typeof data !== 'string') return data;
 try {
  return JSON.parse(data);
 } catch {
  return null;
 }
}

// snake_case y camelCase a la vez: el host lee una u otra según el
// minijuego, y mandar las dos cuesta nada.
function sessionPayload(session) {
 return {
  session_id: session.sessionId,
  sessionId: session.sessionId,
  game_id: session.gameId,
  gameId: session.gameId,
 };
}

function canonicalType(type) {
 return INBOUND_ALIASES[type] || type;
}

function isValidEnvelope(msg) {
 return (
  msg !== null &&
  typeof msg === 'object' &&
  typeof msg.type === 'string' &&
  msg.payload !== null &&
  typeof msg.payload === 'object'
 );
}

class SuraBridge {
 constructor() {
  // Nunca standalone solo por no estar en dev — un iframe o la WebView
  // nativa son siempre un host real, se detecten como se detecten.
  this.isNative = Boolean(window.ReactNativeWebView);
  this.isEmbedded = window.parent !== window || this.isNative;
  this.parentOrigin = null;
  this.listeners = new Map();
  if (this.isEmbedded) {
   const handler = (event) => this.handleMessage(event);
   window.addEventListener('message', handler);
   // La WebView nativa de React Native entrega los mensajes inyectados en
   // `document`, no en `window` (depende de la versión/plataforma), así que
   // se escuchan los dos. handleMessage descarta duplicados por envelope
   // inválido o por origen, nunca procesa dos veces el mismo INIT.
   if (this.isNative) document.addEventListener('message', handler);
  }
 }

 // Único punto de salida hacia el host. En la app nativa el canal NO es
 // window.parent (ahí parent === window: postMessage se lo mandaba a sí
 // mismo y el host nunca se enteraba de nada — ni del handshake, ni del
 // GAME_COMPLETE que paga la recompensa); es
 // window.ReactNativeWebView.postMessage, que además solo acepta strings.
 post(message, targetOrigin) {
  // Que falle un mensaje no puede cortar el handshake a la mitad: el ack
  // SESSION_ACCEPTED se manda justo antes de avisarle al juego que ya hay
  // sesión, y si tira (origen opaco, puente nativo roto) se quedaba sin
  // gameId y el ranking en "Cargando…" para siempre.
  try {
   if (this.isNative) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    return;
   }
   window.parent.postMessage(message, targetOrigin || '*');
  } catch (err) {
   console.warn('[sura] no se pudo enviar', message && message.type, err);
  }
 }

 on(type, listener) {
  if (!this.listeners.has(type)) this.listeners.set(type, new Set());
  this.listeners.get(type).add(listener);
 }

 // MINIGAME_READY abre el handshake — el origen del host todavía no se
 // conoce (recién llega con su propio INIT_GAME), así que este es el único
 // mensaje que sale a "*". No lleva nada sensible.
 sendReady() {
  if (!this.isEmbedded) return;
  this.post(
   { type: SURA_MSG.READY, payload: { game_id: GAME_SLUG, version: GAME_VERSION } },
   '*'
  );
 }

 // En la app nativa no hay origen que conocer (el canal es el puente de la
 // WebView, no un iframe), así que no se espera a parentOrigin — esperarlo
 // dejaba mudo todo el contrato en mobile.
 sendEnveloped(type, payload) {
  if (!this.isEmbedded) return;
  if (!this.isNative && !this.parentOrigin) return;
  this.post({ type, payload: payload || {} }, this.parentOrigin);
 }

 // GAME_COMPLETE es flat (no { type, payload }) — así lo espera el host,
 // a diferencia de todo lo demás en este contrato.
 sendCompletion({ sessionId, score, durationMs }) {
  if (!this.isEmbedded) return;
  if (!this.isNative && !this.parentOrigin) return;
  const message = { type: SURA_MSG.COMPLETED, sessionId, score, provider: 'tingz' };
  if (durationMs !== undefined) message.duration_ms = durationMs;
  this.post(message, this.parentOrigin);
 }

 handleMessage(event) {
  // Un MessageEvent armado a mano por el puente de la WebView nativa trae
  // source === null — se acepta. Cualquier otra cosa que no sea el propio
  // parent se descarta. En nativo no hay filtro posible por source: el
  // único emisor del canal es el host.
  if (!this.isNative && event.source !== null && event.source !== window.parent) return;
  // El puente nativo entrega strings (postMessage de RN solo mueve texto).
  const envelope = parseEnvelope(event.data);
  if (!isValidEnvelope(envelope)) return;

  if (canonicalType(envelope.type) === SURA_MSG.INIT) {
   if (this.parentOrigin === null) {
    // Un host con origen opaco (sandbox, file://) manda el string 'null',
    // que postMessage rechaza como targetOrigin — ahí se usa '*'.
    this.parentOrigin = event.origin && event.origin !== 'null' ? event.origin : '*';
   }
  } else if (!this.isNative && this.parentOrigin !== null && event.origin !== this.parentOrigin) {
   // Una vez conocido el host real, se ignora cualquiera que diga serlo
   // desde otro origen.
   return;
  }

  const set = this.listeners.get(canonicalType(envelope.type));
  if (set) for (const listener of set) listener(envelope.payload);
 }
}

class SuraIntegrationService {
 constructor() {
  this.bridge = new SuraBridge();
  this.session = null;
  // Mejor score logrado en ESTA carga de pagina. Es lo unico que puede
  // superar legitimamente al record de la cuenta: una partida recien
  // terminada que todavia no hizo el round-trip al backend. Vive en memoria
  // a proposito — un reload lo pierde, asi que un valor viejo del dispositivo
  // nunca puede sobrevivir a la verdad del servidor (ver handleInit).
  this.pendingLocalBest = 0;
  this.onReadyCallbacks = new Set();
  this.onSessionReadyCallbacks = new Set();
  this.bridge.on(SURA_MSG.INIT, (payload) => this.handleInit(payload));
  this.bridge.on(SURA_MSG.PAUSE, () => this.pauseCallbacks.forEach((cb) => cb()));
  this.bridge.on(SURA_MSG.RESUME, () => this.resumeCallbacks.forEach((cb) => cb()));
  this.pauseCallbacks = new Set();
  this.resumeCallbacks = new Set();
  // Cuenta de INIT_GAME recibidos — es lo que corta el backoff de READY y
  // lo que distingue "ya me contestaron" de "me contestaron antes".
  this.initCount = 0;
  this.readyTimers = [];
 }

 get isEmbedded() {
  return this.bridge.isEmbedded;
 }

 /** true dentro de la app nativa (WebView), false en el iframe web. */
 get isNative() {
  return this.bridge.isNative;
 }

 /** null hasta que termina el handshake — el leaderboard real los necesita. */
 getGameId() {
  return this.session ? this.session.gameId : null;
 }

 getApiBaseUrl() {
  return this.session ? this.session.apiBaseUrl : null;
 }

 /** true una vez que llegó un INIT_GAME válido del host. */
 hasSession() {
  return this.session !== null;
 }

 /** Puede ser null (jugador sin nickname) incluso con sesión activa. */
 getNickname() {
  return this.session ? this.session.nickname || null : null;
 }

 start() {
  this.announceReady();
 }

 /**
  * (Re)abre el handshake: manda MINIGAME_READY y lo repite con backoff
  * hasta que el host conteste un INIT_GAME. Sin esto, en la app nativa el
  * único READY salía antes de que el WebView tuviera handler y se perdía.
  * Los reintentos se cortan apenas llega una sesión nueva, así que el host
  * no abre seis sesiones por nada.
  */
 announceReady() {
  if (!this.isEmbedded) return;
  const baseline = this.initCount;
  for (const timer of this.readyTimers) clearTimeout(timer);
  this.readyTimers = [];
  let elapsed = 0;
  for (const delay of READY_RETRY_DELAYS) {
   elapsed += delay;
   this.readyTimers.push(
    setTimeout(() => {
     if (this.initCount !== baseline) return;
     this.bridge.sendReady();
    }, elapsed)
   );
  }
 }

 /**
  * Después de un GAME_COMPLETE el sessionId quedó consumido: usarlo de
  * nuevo hace que el host rechace la segunda partida como duplicada y esa
  * corrida no pague. Se pide una sesión fresca reabriendo el handshake.
  */
 requestNewSession() {
  this.announceReady();
 }

 onPause(cb) {
  this.pauseCallbacks.add(cb);
 }

 onResume(cb) {
  this.resumeCallbacks.add(cb);
 }

 handleInit(payload) {
  this.initCount += 1;
  for (const timer of this.readyTimers) clearTimeout(timer);
  this.readyTimers = [];

  // Puede llegar más de un INIT_GAME: si el host tardó en enganchar su
  // handler, alcanzó a escuchar dos READY del backoff y contesta los dos.
  // El ack se manda igual por cada uno (el host correlaciona), pero el
  // leaderboard solo se vuelve a pedir si cambió a dónde hay que pegarle.
  const previous = this.session;

  this.session = {
   token: payload.token,
   sessionId: payload.sessionId,
   gameId: payload.gameId || '',
   apiBaseUrl: payload.apiBaseUrl || '',
   bestScore: typeof payload.bestScore === 'number' ? payload.bestScore : undefined,
   // Puede llegar vacío (jugador sin nickname) — quien lo consuma muestra
   // un placeholder genérico, nunca un nombre inventado.
   nickname: typeof payload.username === 'string' ? payload.username : undefined,
  };

  // El récord de la cuenta manda: para arriba Y para abajo.
  //
  // Antes esto sólo subía el valor local, y la intención era buena — no
  // borrar una victoria recién hecha que todavía no llegó al backend. Pero el
  // efecto era que cualquier número que entrara una vez al localStorage se
  // quedaba ahí para siempre. Un score forjado, o un `personalBest` viejo que
  // el backend mandó una vez, seguía mostrándose como récord del jugador
  // aunque el servidor ya dijera otra cosa, porque ningún `Math.max` lo dejaba
  // bajar nunca. Eso es exactamente el "tengo un récord que nunca hice y no se
  // me actualiza": limpiar la base no alcanzaba, el número estaba en el
  // dispositivo.
  //
  // Y como el localStorage es por dispositivo y por origen, el iframe de la
  // web y la WebView de la app tienen almacenamientos separados: el mismo
  // jugador veía un récord distinto en cada plataforma. Con el servidor como
  // autoridad, las dos muestran lo mismo porque leen lo mismo.
  //
  // `pendingLocalBest` conserva el caso legítimo sin la permanencia.
  if (this.session.bestScore !== undefined) {
   const record = Math.max(this.session.bestScore, this.pendingLocalBest);
   try {
    localStorage.setItem(STORAGE_KEY_RECORD, String(record));
   } catch {}
   for (const cb of this.onReadyCallbacks) cb(record);
  }

  for (const type of SESSION_ACCEPTED_TYPES) {
   this.bridge.sendEnveloped(type, sessionPayload(this.session));
  }

  // gameId/apiBaseUrl (necesarios para el leaderboard real) recién existen
  // a partir de acá — antes de esto, el leaderboard no tiene a dónde pegar.
  const endpointCambio =
   previous === null ||
   previous.gameId !== this.session.gameId ||
   previous.apiBaseUrl !== this.session.apiBaseUrl ||
   previous.nickname !== this.session.nickname;
  if (endpointCambio) {
   for (const cb of this.onSessionReadyCallbacks) cb();
  }
 }

 /** Llamado apenas arranca una corrida de verdad (no en el menú). */
 notifyStarted() {
  if (!this.session) return;
  this.bridge.sendEnveloped(SURA_MSG.STARTED, sessionPayload(this.session));
 }

 /**
  * durationMs es opcional pero conviene mandarlo siempre que se tenga: el
  * servidor toma min(tiempo medido por el server, duration_ms), así que
  * reportarlo honesto solo puede bajar el techo de anti-cheat si alguna vez
  * se configura uno, nunca subirlo.
  */
 notifyCompleted(score, durationMs) {
  if (!this.session) return;
  // Se registra antes de mandar: si el próximo INIT_GAME trae un bestScore
  // que todavía no incluye esta partida, este valor evita que el menú
  // muestre un récord más bajo del que el jugador acaba de hacer.
  if (typeof score === 'number' && score > this.pendingLocalBest) {
   this.pendingLocalBest = score;
  }
  this.bridge.sendCompletion({ sessionId: this.session.sessionId, score, durationMs });
 }

 /**
  * Se llama cuando el host informa el récord de la cuenta, suba o baje.
  * Antes se llamaba `onAccountBestRaised` y sólo corría al subir; el valor
  * que entrega ahora es el récord autoritativo, así que el juego lo asigna
  * en vez de combinarlo con lo que ya tenía.
  */
 onAccountBestResolved(cb) {
  this.onReadyCallbacks.add(cb);
 }

 /**
  * Se llama una vez que el handshake con el host terminó (gameId/apiBaseUrl
  * ya existen). Si el INIT_GAME ya llegó antes de registrarse — en mobile el
  * host puede contestar antes de que termine de evaluarse main.js — se
  * ejecuta en el acto, en vez de esperar un evento que ya pasó.
  */
 onSessionReady(cb) {
  this.onSessionReadyCallbacks.add(cb);
  if (this.session) cb();
 }
}

export const suraService = new SuraIntegrationService();
