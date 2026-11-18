// An original upbeat arcade track is bundled locally. HTMLAudio is more reliable than
// continuous WebAudio oscillators inside iOS browsers and embedded web views.
export class AudioEngine{
 constructor(){this.enabled=false;this.ctx=null;this.musicEl=this.makeTrack()}
 makeTrack(){
  const audio=new Audio(new URL('../audio/playa-rush.mp3',import.meta.url).href);
  audio.loop=true;audio.preload='auto';audio.volume=.52;audio.setAttribute('playsinline','');return audio;
 }

 init(enable=false){if(enable)this.enabled=true;if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')return this.ctx.resume().catch(()=>{});return Promise.resolve()}
 tone(freq,dur=.12,vol=.07,type='sine'){if(!this.enabled||!this.ctx)return;let o=this.ctx.createOscillator(),g=this.ctx.createGain(),start=this.ctx.currentTime;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,start);g.gain.exponentialRampToValueAtTime(.001,start+dur);o.connect(g);g.connect(this.ctx.destination);o.start(start);o.stop(start+dur)}
 effect(type){const f={coin:880,jump:380,slide:190,power:660,hit:75};this.tone(f[type]||440,type==='hit'?.4:.12,.075,type==='hit'?'sawtooth':'sine')}
 toggle(){this.enabled=!this.enabled;if(this.enabled)this.init();else this.musicEl.pause();return this.enabled}
 music(on){if(!on||!this.enabled){this.musicEl.pause();return}this.musicEl.play().catch(()=>{})}
}
