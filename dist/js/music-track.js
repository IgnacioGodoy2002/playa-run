// Original arcade arrangement: 148 BPM, 64 bars, eight evolving sections.
// Kept as editable source; the bundled MP3 avoids synthesis work on phones.
export function buildMusicTrack(){
 const rate=22050,beat=60/148,bar=beat*4,count=Math.round(64*bar*rate),mix=new Float32Array(count),tau=2*Math.PI;
 const hz=n=>440*2**((n-69)/12);let seed=34791;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296*2-1};
 function note(at,midi,length,volume,kind='pluck'){
  const f=hz(midi),start=Math.round(at*rate),frames=Math.floor(length*rate);
  for(let j=0;j<frames&&start+j<count;j++){
   const t=j/rate,attack=Math.min(1,t/.008),release=Math.min(1,(length-t)/.05);
   const env=attack*release*Math.exp(-t/(kind==='chord'?.25:kind==='bass'?.19:.17));
   let v=Math.sin(tau*f*t);
   if(kind==='pluck')v+=.28*Math.sin(tau*f*2*t)*Math.exp(-t*5)+.11*Math.sin(tau*f*3*t)*Math.exp(-t*9);
   if(kind==='bass')v+=.22*Math.sin(tau*f*2*t);
   if(kind==='chord')v+=.18*Math.sin(tau*f*3*t);
   mix[start+j]+=v*env*volume;
  }
 }
 function drum(at,kind,vol){
  const start=Math.round(at*rate),length=kind==='kick'?.22:kind==='snare'?.15:kind==='open'?.14:.045;
  for(let j=0;j<length*rate&&start+j<count;j++){
   const t=j/rate,attack=Math.min(1,t/.002),noise=random();let sample;
   if(kind==='kick')sample=Math.sin(tau*(49*t+10*(1-Math.exp(-t*32))/32))*Math.exp(-t*20)+noise*.035*Math.exp(-t*170);
   else if(kind==='snare')sample=(noise*.58+Math.sin(tau*182*t)*.42)*Math.exp(-t*30);
   else sample=noise*Math.exp(-t*(kind==='open'?35:95));
   mix[start+j]+=sample*attack*vol;
  }
 }
 const chords=[[48,55,60,64],[43,55,59,62],[45,57,60,64],[41,53,57,60]];
 const phrases=[
  [[0,76],[.75,79],[1.5,76],[2,72],[3,74],[3.5,76]],
  [[.5,74],[1,79],[2.5,74],[3,71]],
  [[0,76],[1,81],[1.75,79],[2.5,76],[3.25,72]],
  [[.5,77],[1.5,76],[2,72],[3,69]],
  [[0,79],[.5,76],[1.5,72],[2.5,76],[3,79]],
  [[0,74],[1.5,71],[2,67],[3,74],[3.5,79]],
  [[.5,81],[1,79],[2,76],[2.75,72],[3.5,76]],
  [[0,77],[1,76],[2.5,72],[3.5,74]]
 ];
 for(let b=0;b<64;b++){
  const section=Math.floor(b/8),at=b*bar,chord=chords[b%4],bridge=section===2||section===6;
  for(let k=0;k<4;k++){
   if(!bridge||k%2===0)drum(at+k*beat,'kick',.32);
   if(k%2===1)drum(at+k*beat,'snare',bridge?.095:.14);
   drum(at+(k+.5)*beat,k===3?'open':'hat',bridge?.035:.055);
  }
  const bassPattern=bridge?[0,1.5,3]:[0,.75,1.5,2,2.75,3.5];
  for(const [i,off] of bassPattern.entries())note(at+off*beat,chord[0]-12+(i%3===2?12:0),beat*.55,.19,'bass');
  for(const off of (bridge?[.5,2.5]:[.5,1.5,2.5,3.5]))for(const n of chord.slice(1))note(at+off*beat,n,beat*.48,.04,'chord');
  if(!bridge||b%2===0){
   const motif=phrases[(b+section*2)%phrases.length];
   for(const [off,n] of motif){note(at+off*beat,n,.32,bridge?.085:.12);if(section===3||section===7)note(at+(off+.25)*beat,n-12,.2,.026)}
  }
  if((section===1||section===5)&&b%2===1)for(let i=0;i<8;i++)note(at+i*.5*beat,chord[1+i%3]+12,.15,.033);
  if(b%8===7){for(let k=0;k<4;k++)drum(at+(3+k*.25)*beat,'snare',.045+k*.016)}
 }
 const bytes=new Uint8Array(44+count*2),view=new DataView(bytes.buffer),write=(at,text)=>{for(let i=0;i<text.length;i++)bytes[at+i]=text.charCodeAt(i)};
 write(0,'RIFF');view.setUint32(4,36+count*2,true);write(8,'WAVE');write(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,count*2,true);
 for(let i=0;i<count;i++){const fade=Math.min(1,i/(rate*.015),(count-1-i)/(rate*.08));view.setInt16(44+i*2,Math.tanh(mix[i]*1.35)*fade*32767,true)}
 return bytes;
}
