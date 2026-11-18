import * as T from './three.module.js';
import {powerIcon} from './powerups.js';
import {Scenery} from './scenery.js';
import {difficulty} from './difficulty.js';
const mat=(c)=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true});
export class World{
 constructor(scene){this.scene=scene;this.items=[];this.rows=0;this.until=25;this.box=new T.BoxGeometry(1,1,1);this.coinGeo=new T.CylinderGeometry(.26,.26,.10,10);this.powerGeo=new T.OctahedronGeometry(.47);this.ringGeo=new T.TorusGeometry(.66,.035,4,16);this.mats={low:mat('#b87432'),wall:mat('#cd8850'),arch:mat('#977348'),barrel:mat('#9a5c2e'),driftwood:mat('#765035'),net:mat('#e5c98c'),crab:mat('#e85b3f'),coin:mat('#ffda62'),shield:mat('#78e3e0'),magnet:mat('#f79aaa'),double:mat('#c4a0ff'),speed:mat('#f79e4b')};this.decor=[];this.setup()}
 mesh(geo,m,x,y,z,sx=1,sy=1,sz=1){let o=new T.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;return o}
 setup(){this.scenery=new Scenery(this.scene);this.trim=mat('#f5db9c');this.wood=mat('#81502d');this.dark=mat('#70422a')}
 reset(){for(const o of this.items)this.scene.remove(o.mesh);this.items=[];this.until=25;this.rows=0}
 spawn(type,lane,z,moving=false){let g=new T.Group(),m=this.mats[type];
 if(type==='arch'){
  for(const side of [-1,1]){g.add(this.mesh(this.box,m,side,1.3,0,.22,2.6,.55));g.add(this.mesh(this.box,this.trim,side,1.7,0,.28,.15,.62));}
  g.add(this.mesh(this.box,m,0,2,0,2.2,.8,.65));for(let x of [-.7,0,.7])g.add(this.mesh(this.box,this.trim,x,2.02,.335,.30,.12,.02));
 }else if(type==='wall'){
  for(let i=0;i<4;i++){g.add(this.mesh(this.box,m,0,.4+i*.8,0,1.85,.76,1.2));g.add(this.mesh(this.box,this.dark,(i%2?-.4:.4),.4+i*.8,.607,.045,.76,.02));}
  g.add(this.mesh(this.box,this.trim,0,3.16,0,2,.15,1.3));g.add(this.mesh(this.box,this.dark,0,2.0,.62,.6,.3,.03));
 }else if(type==='low'){
  g.add(this.mesh(this.box,m,0,.5,0,1.9,1,1));for(let x of [-.72,.72])g.add(this.mesh(this.box,this.trim,x,.5,.52,.14,.94,.06));for(let y of [.1,.9])g.add(this.mesh(this.box,this.wood,0,y,.54,1.9,.1,.07));
 }else if(type==='barrel'){
  let b=this.mesh(new T.CylinderGeometry(.62,.68,1.25,14),m,0,.63,0);b.rotation.z=Math.PI/2;g.add(b);for(let x of [-.42,.42]){let band=this.mesh(new T.TorusGeometry(.64,.055,6,16),this.dark,x,.63,0);band.rotation.y=Math.PI/2;g.add(band)}
 }else if(type==='driftwood'){
  let log=this.mesh(new T.CylinderGeometry(.25,.34,2.05,9),m,0,.34,0);log.rotation.z=Math.PI/2;g.add(log);for(let x of [-.72,.65]){let branch=this.mesh(new T.CylinderGeometry(.07,.11,.62,7),m,x,.53,0);branch.rotation.z=x<0?-.65:.75;g.add(branch)}
 }else if(type==='net'){
  for(const side of [-1,1])g.add(this.mesh(new T.CylinderGeometry(.075,.09,2.5,8),this.wood,side,.98,0));g.add(this.mesh(this.box,m,0,1.82,0,2.05,.62,.09));for(let x=-.75;x<=.75;x+=.5)g.add(this.mesh(this.box,this.dark,x,1.82,.06,.025,.60,.025));
 }else if(type==='crab'){
  g.add(this.mesh(new T.SphereGeometry(.62,16,10),m,0,.42,0,1,.55,.72));for(const side of [-1,1]){for(let i=0;i<3;i++){let leg=this.mesh(new T.CylinderGeometry(.035,.055,.48,6),m,side*(.42+i*.12),.28,(i-1)*.18);leg.rotation.z=side*.9;g.add(leg)}g.add(this.mesh(new T.SphereGeometry(.22,10,7),m,side*.72,.58,0,1,.65,1));g.add(this.mesh(new T.SphereGeometry(.09,10,7),this.dark,side*.22,.67,-.40))}
 }else if(type==='coin'){let c=this.mesh(this.coinGeo,m,0,1,0);c.rotation.x=Math.PI/2;g.add(c);let inset=this.mesh(this.box,this.trim,0,1,.065,.12,.24,.025);g.add(inset)}else{const icon=powerIcon(type);icon.position.y=1.2;g.add(icon)}
 const obstacle=['low','arch','wall','barrel','driftwood','net','crab'].includes(type);g.position.set(lane*2.5,0,z);this.scene.add(g);this.items.push({type,lane,z,mesh:g,obstacle,moving:moving||type==='crab',movePhase:Math.random()*Math.PI*2,currentX:lane*2.5,moveMin:lane*2.5,moveMax:lane*2.5});return this.items[this.items.length-1]}
 row(speed,distance){const level=difficulty(distance);let safe=Math.floor(Math.random()*3)-1;let other=[-1,0,1].filter(l=>l!==safe);let count=this.rows<3?1:(Math.random()<level.doubleChance?2:1);const early=['low','arch','wall','barrel'],full=['low','arch','wall','barrel','driftwood','net','crab'],types=distance<90?early:full;const row=[];for(let i=0;i<count;i++){let type=types[Math.floor(Math.random()*types.length)];row.push(this.spawn(type,other[i],-115,this.rows>=3&&Math.random()<level.movingChance))}this.limitRowMotion(row,safe);for(let i=0;i<5;i++)this.spawn('coin',safe,-115-i*1.35);if(this.rows%6===3)this.spawn(['shield','magnet','double','speed'][Math.floor(Math.random()*4)],safe,-124);this.rows++;this.until=speed*level.rowSeconds+Math.random()*3.2}
 // Give each obstacle its own disjoint horizontal region, including its full
 // visible geometry (legs/claws/posts). Adjacent rows retain their z spacing.
 limitRowMotion(row,safe){
  for(const o of row){
   const x=o.lane*2.5, bounds=new T.Box3().setFromObject(o.mesh);
   const halfWidth=Math.max(x-bounds.min.x,bounds.max.x-x), gap=.16;
   let left=-4.2,right=4.2;
   for(const neighbor of row){if(neighbor===o)continue;const split=(x+neighbor.lane*2.5)/2;if(neighbor.lane<o.lane)left=Math.max(left,split);else right=Math.min(right,split)}
   // Keep the coin lane clear for the entire oscillation, not only at spawn.
   if(safe<o.lane)left=Math.max(left,safe*2.5+.8);else right=Math.min(right,safe*2.5-.8);
   o.moveMin=Math.max(x-2.15,left+halfWidth+gap);
   o.moveMax=Math.min(x+2.15,right-halfWidth-gap);
   if(o.moveMin>o.moveMax)o.moveMin=o.moveMax=x;
  }
 }
 update(dt,speed,active,player=null,magnet=false,moveScenery=true,distance=0){let dz=dt*speed;if(moveScenery)this.scenery.update(dt,speed);if(!active)return;if((this.until-=dz)<=0)this.row(speed,distance);
 for(let o of this.items){o.oldZ=o.z;
  if(o.type==='coin'&&magnet&&player&&o.z>-12&&o.z<1.5&&!o.attracting){o.attracting=true;o.fly=0;o.from=o.mesh.position.clone()}
  if(o.attracting&&player){o.fly=Math.min(1,o.fly+dt/.32);const a=o.fly*o.fly*(3-2*o.fly);o.mesh.position.set(o.from.x+(player.x-o.from.x)*a,(player.y-.15)*a+Math.sin(o.fly*Math.PI)*.55,o.from.z*(1-a));o.z=o.mesh.position.z;o.arrived=o.fly===1;}
  else{o.z+=dz;o.mesh.position.z=o.z}
  if(o.moving){o.movePhase+=dt*(1.6+Math.min(2.4,distance/600));o.currentX=(o.moveMin+o.moveMax)/2+Math.sin(o.movePhase)*(o.moveMax-o.moveMin)/2;o.mesh.position.x=o.currentX;if(o.type==='crab')o.mesh.position.y=.04+Math.abs(Math.sin(o.movePhase*2))*.07}
  else o.currentX=o.mesh.position.x;
  if(o.type==='coin')o.mesh.rotation.y+=dt*2;
  else if(!o.obstacle)o.mesh.rotation.y=Math.sin(o.z*.08)*.18;
 }
 for(let i=this.items.length-1;i>=0;i--)if(this.items[i].z>8){this.scene.remove(this.items[i].mesh);this.items.splice(i,1)}}
 remove(o){this.scene.remove(o.mesh);this.items.splice(this.items.indexOf(o),1)}
}
