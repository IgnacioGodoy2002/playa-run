import * as T from './three.module.js';
import {PALETTES,animalSurface,buildAnimalTail} from './animal-models.js';
import {torsoGeometry,tailGeometry} from './raccoon-model.js';
import {polishedHead} from './polished-heads.js';
// Four articulated riders share the scooter rig: feet stay on deck; hands follow the grips.
export class Character extends T.Group {
 constructor(type='raccoon'){super();this.characterId=PALETTES[type]?type:'raccoon';type=this.characterId;const palette=PALETTES[type];const mat=(c,r=.64)=>new T.MeshStandardMaterial({color:c,roughness:r});const fur=type==='capybara'?animalSurface(type,palette.fur):mat(palette.fur),dark=mat(palette.dark),cream=mat(palette.cream),orange=mat(palette.accent),teal=mat(palette.coat),shoe=mat(palette.shoe,.55),black=mat('#152630',.45),white=mat('#fff6e5',.28),metal=mat('#657c85',.32);
 const sphere=new T.SphereGeometry(1,28,20),box=new T.BoxGeometry();
 const add=(parent,geo,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;parent.add(o);return o};
 this.board=new T.Group();this.add(this.board);
 add(this.board,new T.CapsuleGeometry(.22,1.04,5,14).rotateX(Math.PI/2),teal,0,.28,0,1,.20,1);
 add(this.board,box,dark,0,.326,0,.39,.02,1.28);
 for(const side of [-1,1])add(this.board,box,orange,side*.223,.28,0,.035,.065,1.10);
 this.wheels=[];for(const z of [-.81,.81]){const w=new T.Group();w.position.set(0,.18,z);this.board.add(w);add(w,new T.CylinderGeometry(.18,.18,.15,20),black,0,0,0).rotation.z=Math.PI/2;add(w,new T.CylinderGeometry(.105,.105,.16,16),metal,0,0,0).rotation.z=Math.PI/2;this.wheels.push(w);add(this.board,new T.TorusGeometry(.21,.035,6,16,Math.PI),teal,0,.18,z).rotation.y=Math.PI/2;}
 // Stem, front fork, battery indicator, grips and a small headlamp.
 add(this.board,new T.CylinderGeometry(.035,.05,1.06,12),metal,0,.78,-.68);
 add(this.board,new T.CylinderGeometry(.032,.032,.80,12),dark,0,1.31,-.68).rotation.z=Math.PI/2;
 this.grips=[];for(const side of [-1,1]){const grip=add(this.board,new T.CylinderGeometry(.052,.052,.21,12),black,side*.33,1.31,-.68);grip.rotation.z=Math.PI/2;this.grips.push(grip)}
 add(this.board,box,black,0,1.33,-.68,.13,.06,.11);add(this.board,box,new T.MeshBasicMaterial({color:'#75efc1'}),0,1.365,-.68,.075,.005,.035);
 add(this.board,sphere,new T.MeshStandardMaterial({color:'#fff4c5',emissive:'#ffebae',emissiveIntensity:1}),0,1.18,-.732,.07,.055,.025);
 add(this.board,box,new T.MeshBasicMaterial({color:'#ef7752'}),0,.34,.74,.13,.045,.025);
 this.rider=new T.Group();this.add(this.rider);const r=this.rider;
 if(type==='capybara'){
  // Barrel body, heavy shoulders and low belly; no jacket or bright chest patch.
  add(r,sphere,fur,0,.25,.12,.42,.42,.52);
  add(r,sphere,fur,0,.46,-.10,.41,.28,.32);
  add(r,sphere,fur,0,-.055,.13,.32,.17,.34);
  for(const side of [-1,1])add(r,sphere,fur,side*.34,.35,-.08,.17,.22,.25);
 }else if(type==='suri'){
  // Padded green hoodie, dark inner shirt and a real hood around the neck.
  add(r,torsoGeometry(),teal,0,0,0,1.08,1,.87);
  add(r,sphere,dark,0,.20,-.25,.205,.27,.04);
  add(r,new T.TorusGeometry(.185,.07,10,28),teal,0,.56,.025).rotation.x=Math.PI/2;
  add(r,box,dark,0,.27,-.304,.015,.38,.012);
  for(const side of [-1,1]){
   add(r,sphere,teal,side*.255,.40,-.03,.14,.21,.17);
   add(r,sphere,teal,side*.14,.09,-.27,.13,.07,.04);
  }
 }else{
  add(r,torsoGeometry(),teal,0,0,0,1,1,.8);add(r,sphere,dark,0,-.06,0,.25,.17,.22);
  add(r,new T.TorusGeometry(.16,.038,8,24),cream,0,.55,0).rotation.x=Math.PI/2;
  add(r,box,cream,0,.28,-.246,.025,.45,.016);add(r,box,orange,0,.31,.251,.20,.17,.022);
  for(const side of [-1,1])add(r,new T.CapsuleGeometry(.085,.13,4,12),orange,side*.26,.42,0,1,1,.8).rotation.z=side*.65;
 }
 this.head=new T.Group();this.head.position.y=.82;r.add(this.head);const h=this.head;
 const parts=polishedHead(type,h,add,sphere,box,{fur,dark,cream,orange,black,white});this.eyes=parts.eyes;this.ears=parts.ears;
 this.legs=[];this.arms=[];
 const limb=(x,y,z,length,radius,color,endMaterial,isArm)=>{const hip=new T.Group();hip.position.set(x,y,z);r.add(hip);add(hip,new T.CapsuleGeometry(radius,length-radius*2,4,12),color,0,-length/2,0);const knee=new T.Group();knee.position.y=-length;hip.add(knee);add(knee,new T.CapsuleGeometry(radius*.88,length-radius*1.76,4,12),fur,0,-length/2,0);const foot=add(knee,sphere,endMaterial,0,-length,0,isArm?.10:.12,isArm?.09:.09,isArm?.085:.19);return {hip,knee,foot,length}};
 for(const side of [-1,1]){this.legs.push(limb(side*.145,-.05,0,.37,type==='capybara'?.125:.10,type==='capybara'?fur:dark,shoe,false));this.arms.push(limb(side*.285,.44,-.04,.45,type==='capybara'?.115:.09,type==='capybara'?fur:teal,dark,true))}
 // Solid ringed tail: one opaque mesh avoids skinning artifacts on mobile GPUs.
 this.tail=new T.Group();this.tail.position.set(0,-.07,.20);r.add(this.tail);if(type==='raccoon'){const tailGeo=tailGeometry();
 const tailMesh=new T.Mesh(tailGeo,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,transparent:false,opacity:1,depthWrite:true,side:T.FrontSide}));tailMesh.castShadow=true;tailMesh.receiveShadow=true;this.tail.add(tailMesh);
 }else{buildAnimalTail(type,this.tail,add,sphere,{fur,dark,orange});}
 if(type==='toucan'){
  add(r,sphere,cream,0,.32,-.22,.235,.29,.09);
  for(const arm of this.arms){add(arm.hip,sphere,fur,0,-.23,.04,.15,.28,.08);for(let i=0;i<3;i++)add(arm.knee,sphere,dark,(i-1)*.045,-.24,.04,.04,.19,.055)}
 }
 if(type==='suri'){
  for(const side of [-1,1])add(r,sphere,dark,side*.145,-.12,.025,.14,.18,.18);
 }

 if(type==='raccoon'||type==='suri'){
  const seam=mat(type==='suri'?'#a3d552':'#78d6c5');
  for(const side of [-1,1]){
   add(r,new T.CapsuleGeometry(.015,.20,3,8),seam,side*.082,.405,-.263);
   add(r,sphere,cream,side*.084,.29,-.273,.02,.014,.012);
   add(r,sphere,teal,side*.16,.12,-.238,.102,.065,.046);
  }
  add(r,box,metal,0,.385,-.268,.027,.035,.015);
  for(const leg of this.legs){
   const sneaker=new T.Group();leg.foot.add(sneaker);sneaker.scale.set(1/leg.foot.scale.x,1/leg.foot.scale.y,1/leg.foot.scale.z);
   add(sneaker,sphere,teal,0,.025,-.025,.108,.068,.163);
   add(sneaker,box,white,0,-.075,0,.19,.027,.29);
   for(let i=0;i<3;i++)add(sneaker,box,white,0,.066,-.075+i*.034,.078,.008,.014);
  }
 }
 if(type==='capybara'){
  // A small beach bandana adds personality without changing the approved anatomy.
  const scarf=mat('#46bac6');
  add(r,new T.TorusGeometry(.23,.035,8,28),scarf,0,.58,.015).rotation.x=Math.PI/2;
  const flap=add(r,new T.ConeGeometry(.105,.22,3),scarf,0,.455,-.246);flap.rotation.z=Math.PI;
 }
 this.wasAir=false;this.landing=0;this.death=0;this.lastT=0;
 }
 solve(limb,target,bend){const {hip,knee,foot,length}=limb;this.rider.updateWorldMatrix(true,false);const local=this.rider.worldToLocal(target.clone()).sub(hip.position),distance=Math.min(local.length(),length*2-.00001),direction=local.clone().normalize();const forward=bend.clone().addScaledVector(direction,-bend.dot(direction)).normalize();const joint=direction.clone().multiplyScalar(distance*.5).addScaledVector(forward,Math.sqrt(length*length-distance*distance*.25));const down=new T.Vector3(0,-1,0);hip.quaternion.setFromUnitVectors(down,joint.clone().normalize());const lower=new T.Quaternion().setFromUnitVectors(down,direction.multiplyScalar(distance).sub(joint).normalize());knee.quaternion.copy(hip.quaternion).invert().multiply(lower);foot.quaternion.copy(lower).invert()}
 animate(p,t,mode,speed){const dt=Math.min(.05,Math.max(0,t-this.lastT));this.lastT=t;const air=p.y>0,run=mode==='run',slide=p.slideBlend||0,turn=T.MathUtils.clamp(p.lane*2.5-p.x,-1,1);
 if(this.wasAir&&!air&&run)this.landing=.22;this.wasAir=air;if(t===0||mode==='menu')this.landing=0;this.landing=Math.max(0,this.landing-dt);const absorb=Math.sin(this.landing/.22*Math.PI)*.07;this.death=mode==='dead'?Math.min(1,this.death+dt*3):0;
 this.position.set(p.x,p.y,0);this.rotation.set(0,mode==='menu'?-2.6:0,0);
 // Both feet stay aboard; a compact duck replaces the skate's prone slide.
 this.rider.position.set(-turn*.025,.91-slide*.40-absorb,.10+slide*.13);this.rider.rotation.set(-slide*1.30,0,-turn*.09*(1-slide)-this.death*.9);
 this.board.position.set(0,0,-this.death*1.4);this.board.rotation.set(air?-.13*T.MathUtils.clamp(p.vy/11,-1,1):0,0,-turn*.018);
 this.head.rotation.set(slide*.60+Math.sin(t*2.4)*.025*(1-slide),mode==='menu'?Math.sin(t*.7)*.22:-turn*.20,0);
 const blink=Math.pow(Math.max(0,Math.cos(t*1.8)),48);for(const eye of this.eyes)eye.scale.y=1-blink*.88;
 this.ears.forEach((ear,i)=>ear.rotation.z=(i?-.2:.2)+Math.sin(t*2.5+i)*.025);
 this.tail.rotation.set(slide*.68+Math.sin(t*2.1)*.018*(1-slide),-turn*.10+Math.sin(t*3.1)*.045*(1-slide),turn*.025);
 this.updateWorldMatrix(true,true);
 for(let i=0;i<2;i++){const local=new T.Vector3(i?.11:-.10,.43,i?.32:-.12);this.solve(this.legs[i],this.board.localToWorld(local),new T.Vector3(0,0,-1));this.solve(this.arms[i],this.grips[i].getWorldPosition(new T.Vector3()),new T.Vector3(i?1:-1,0,.25))}
 for(const wheel of this.wheels)if(run)wheel.rotation.x-=speed*dt/.18;
 }
}
