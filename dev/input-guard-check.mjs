// Prueba de cableado de la guarda isTrusted de dist/js/input.js.
//
//   node dev/input-guard-check.mjs
//
// No prueba que el navegador ponga isTrusted=false en un dispatchEvent — eso lo
// garantiza la plataforma. Prueba lo que SI puede romperse del lado nuestro:
// que la guarda este en los tres listeners, que descarte sin llamar a action(),
// que cuente, y que no haya roto el camino feliz.

import { Input, untrustedInputCount } from "../dist/js/input.js";

// --- shim minimo de DOM ---------------------------------------------------
const listeners = { canvas: {}, window: {} };

function target(bucket) {
  return {
    addEventListener(name, fn) {
      (listeners[bucket][name] ||= []).push(fn);
    },
    setPointerCapture() {},
  };
}

const canvas = target("canvas");
globalThis.window = target("window");
globalThis.matchMedia = () => ({ matches: false });
// Node 24 trae un `navigator` propio que solo tiene getter.
Object.defineProperty(globalThis, "navigator", { value: { maxTouchPoints: 0 }, configurable: true });
globalThis.HTMLButtonElement = class {};

function fire(bucket, name, event) {
  for (const fn of listeners[bucket][name] || []) fn(event);
}

// --- bajo prueba ----------------------------------------------------------
const actions = [];
new Input(canvas, (type) => actions.push(type));

let failures = 0;
function check(label, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FALLA"} ${label} -> ${JSON.stringify(got)}${ok ? "" : ` (esperaba ${JSON.stringify(want)})`}`);
}

// 1. Teclado sintetico: exactamente lo que hace un bot de consola.
fire("window", "keydown", { isTrusted: false, key: "ArrowLeft", preventDefault() {}, repeat: false });
check("keydown sintetico no produce accion", actions, []);
check("keydown sintetico se cuenta", untrustedInputCount(), 1);

// 2. Teclado real: el camino feliz tiene que seguir funcionando.
fire("window", "keydown", { isTrusted: true, key: "ArrowLeft", preventDefault() {}, repeat: false });
check("keydown real produce accion", actions, ["left"]);
check("keydown real no se cuenta", untrustedInputCount(), 1);

// 3. Swipe sintetico, las dos mitades.
fire("canvas", "pointerdown", { isTrusted: false, pointerType: "touch", clientX: 0, clientY: 0, pointerId: 7 });
fire("canvas", "pointermove", { isTrusted: false, pointerType: "touch", clientX: 90, clientY: 0, pointerId: 7 });
check("swipe sintetico no produce accion", actions, ["left"]);
check("las dos mitades del swipe se cuentan", untrustedInputCount(), 3);

// 4. Swipe real.
fire("canvas", "pointerdown", { isTrusted: true, pointerType: "touch", clientX: 0, clientY: 0, pointerId: 9 });
fire("canvas", "pointermove", { isTrusted: true, pointerType: "touch", clientX: 90, clientY: 0, pointerId: 9 });
check("swipe real produce accion", actions, ["left", "right"]);
check("swipe real no se cuenta", untrustedInputCount(), 3);

// 5. Un pointerdown sintetico no debe poder sembrar `origin` para que despues
//    un pointermove real lo complete. Si la guarda estuviera solo en
//    pointermove, esto pasaria.
fire("canvas", "pointerdown", { isTrusted: false, pointerType: "touch", clientX: 0, clientY: 0, pointerId: 11 });
fire("canvas", "pointermove", { isTrusted: true, pointerType: "touch", clientX: 90, clientY: 0, pointerId: 11 });
check("origin sintetico no se completa con un move real", actions, ["left", "right"]);

console.log(failures ? `\n${failures} fallas` : "\ntodo ok");
process.exit(failures ? 1 : 0);
