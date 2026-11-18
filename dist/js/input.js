// Pointer Events work with touch and stylus; keyboard remains available on hybrids.
export class Input {
 constructor(canvas, action){this.touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;let origin=null;
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;origin={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!origin||e.pointerId!==origin.id)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y;if(Math.max(Math.abs(dx),Math.abs(dy))<26)return;action(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'slide':'jump'));origin=null});
 for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>origin=null);
 window.addEventListener('keydown',e=>{const map={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',ArrowDown:'slide',s:'slide',S:'slide',Escape:'pause',p:'pause',P:'pause'};if(map[e.key]){if(e.target instanceof HTMLButtonElement&&e.key===' ')return;e.preventDefault();if(!e.repeat)action(map[e.key])}});
 }
}
