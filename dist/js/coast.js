import * as T from './three.module.js';

// All near-coast props share the scenery's 240 m recycling loop. No colliders.
// Geometry/material batches keep the richer scenery affordable on mobile.
export function addCoast(s) {
 const box=s.unit, cylinder=new T.CylinderGeometry(1,1,1,8), cone=new T.ConeGeometry(1,1,8);
 const sphere=new T.SphereGeometry(1,8,6), roof=new T.CylinderGeometry(0,1,1,4);
 const colors={wood:'#ad7848',white:'#fff3d6',teal:'#22b5b7',coral:'#f37a54',blue:'#298bc0',yellow:'#ffd15b',glass:'#24596b',green:'#498957'};
 const groups=new Map();
 function add(geo,color,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){
  const key=geo.uuid+color;
  if(!groups.has(key))groups.set(key,{geo,mat:new T.MeshStandardMaterial({color:colors[color]||color,roughness:.88,flatShading:true}),records:[]});
  groups.get(key).records.push(s.record(x,y,z,sx,sy,sz,rx,ry,rz));
 }
 function umbrella(x,z,color){
  add(cylinder,'wood',x,1.25,z,.055,2.5,.055);
  add(cone,color,x,2.55,z,1.45,.6,1.45);
  add(sphere,'white',x,2.89,z,.09,.09,.09);
  for(const dx of [-.7,.7]){
   add(box,'white',x+dx,.22,z+1.65,.59,.1,1.35);
   add(box,color,x+dx,.46,z+1.12,.53,.08,.67,-.65);
   for(const dz of [1.2,2.1])add(box,'wood',x+dx,.1,z+dz,.48,.2,.09);
  }
 }
 // Three distinct beach pockets alternate with open stretches of shoreline.
 for(const [z,color] of [[-8,'coral'],[-24,'yellow'],[-87,'teal'],[-104,'blue'],[-170,'yellow'],[-189,'coral']])umbrella(-8.8,z,color);
 // Towels, surfboards and tiny beachside tables.
 for(const z of [-16,-94,-181]){
  add(box,'teal',-6.1,-.06,z,1.05,.035,1.8);
  add(box,'white',-6.1,-.035,z+.5,1.05,.02,.09);
  add(cylinder,'wood',-10.4,.4,z,.43,.08,.43);
  add(cylinder,'white',-10.4,.17,z,.055,.44,.055);
  add(sphere,'coral',6.0,1.08,z,.34,1.22,.09,0,0,-.18);
  add(box,'white',6.0,1.08,z+.1,.065,1.75,.03,0,0,-.18);
 }
 // Raised, colorful seaside cabins on the inland side, beyond the palms.
 for(let i=0;i<7;i++){
  const z=-12-i*31, x=9.1, color=['teal','coral','yellow','blue'][i%4];
  add(box,'wood',x,.45,z,4.3,.22,4.5);
  for(const dx of [-1.65,1.65])for(const dz of [-1.7,1.7])add(box,'wood',x+dx,.17,z+dz,.18,.8,.18);
  add(box,color,x,1.9,z,3.7,2.7,3.7);
  add(roof,'coral',x,3.8,z,3.15,1.35,3.15,0,Math.PI/4);
  // Doors/windows face the running path, not the hidden back of each cabin.
  add(box,'glass',x-1.86,1.47,z,.04,1.8,.85);
  for(const dz of [-1.2,1.2]){
   add(box,'white',x-1.9,2.1,z+dz,.08,.95,.75);
   add(box,'glass',x-1.95,2.1,z+dz,.025,.71,.52);
  }
  add(box,'white',x-2.2,2.95,z,.9,.14,4.1);
  for(const dz of [-1.9,1.9])add(box,'wood',x-2.5,1.7,z+dz,.12,2.5,.12);
  add(box,'wood',x-2.45,.22,z,1,.22,1.2);
 }
 // Two small striped refreshment stands give the inland path a promenade feel.
 for(const z of [-64,-145]){
  add(box,'coral',6.65,.72,z,1.6,1.3,2.35);
  add(box,'wood',6.65,1.42,z,1.9,.15,2.55);
  for(const dz of [-1.08,1.08])add(box,'white',6.85,2.03,z+dz,.09,1.3,.09);
  for(let i=0;i<6;i++)add(box,i%2?'white':'teal',6.65,2.73,z-1.1+i*.44,2.25,.18,.44);
  for(const dz of [-.7,0,.7])add(cylinder,'yellow',6.25,1.62,z+dz,.085,.25,.085);
 }
 // A timber pier and its mooring posts extend out into the water.
 const pierZ=-132;
 add(box,'wood',-18,-.05,pierZ,13,.2,2.8);
 for(let i=0;i<9;i++){
  const x=-12.1-i*1.55;
  add(box,'white',x,.065,pierZ,.035,.025,2.8);
  for(const dz of [-1.55,1.55])add(cylinder,'wood',x,.13,pierZ+dz,.1,1.65,.1);
 }
 for(const dz of [-1.55,1.55])add(box,'white',-18,.75,pierZ+dz,13,.07,.07);
 // Boats are outside the running area; their hulls and sails are opaque.
 const sail=new T.BufferGeometry();sail.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,4,0,2.5,.2,0],3));sail.setIndex([0,1,2,2,1,0]);sail.computeVertexNormals();
 for(const [x,z,color] of [[-24,-47,'yellow'],[-29,-138,'coral'],[-20,-209,'teal']]){
  add(sphere,color,x,-.18,z,1.05,.52,2.6);
  add(box,'wood',x,.2,z,1.35,.12,3.2);
  add(cylinder,'wood',x,2.15,z,.055,4.5,.055);
  add(sail,'white',x,.55,z,1,1,1,0,-.55);
  add(sail,color,x,.6,z,.58,.72,1,0,Math.PI-.55);
 }
 // A lighthouse further inland provides a tall recurring landmark.
 const lx=15,lz=-96;
 for(let i=0;i<5;i++)add(cylinder,i%2?'coral':'white',lx,3.6+i*1.15,lz,1.0-i*.08,1.15,1.0-i*.08);
 add(cylinder,'wood',lx,8.9,lz,1.3,.18,1.3);
 add(cylinder,'glass',lx,9.5,lz,.65,1.05,.65);
 add(cone,'coral',lx,10.25,lz,1.1,.65,1.1);
 for(const g of groups.values())s.batch(g.geo,g.mat,g.records);
 // One instanced flock. Wing motion is independent of forward recycling.
 const birds=[];for(let i=0;i<9;i++)for(const side of [-1,1])birds.push({...s.record(-13-(i%3)*4,8+(i%3)*1.2,-18-i*23,.7,.045,.18),side,phase:i*1.7});
 const flock=s.batch(box,new T.MeshStandardMaterial({color:'#fff9df',roughness:1}),birds);
 flock.castShadow=false;
 s.birds=birds;
}
