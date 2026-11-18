// A longer warm-up, then a gentler ramp in speed and obstacle density —
// bajado a pedido, se sentía muy rápido casi desde el arranque. Mismo
// MAX_SPEED (el tope de una corrida larga queda igual), pero empieza más
// lento y tarda bastante más en acercarse a ese tope: a d=580 (donde antes
// ya estaba al 63% del camino a MAX_SPEED) ahora está al 45%.
export const BASE_SPEED=13;
export const MAX_SPEED=70;
export function runSpeed(distance){return BASE_SPEED+(MAX_SPEED-BASE_SPEED)*(1-Math.exp(-Math.max(0,distance)/980))}

export function difficulty(distance){
 const d=Math.max(0,distance);
 return {
  doubleChance:Math.min(.98,.33+d/820),
  movingChance:d<75?0:Math.min(.90,.16+(d-75)/850),
  // Always leave enough time to switch lanes, including a full-width escape.
  rowSeconds:.52+.43*Math.exp(-d/370)
 };
}
