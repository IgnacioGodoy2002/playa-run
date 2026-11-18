import * as T from './three.module.js';
const templates=new Map();
const material=c=>new T.MeshStandardMaterial({color:c,roughness:.35,metalness:.15,emissive:c,emissiveIntensity:.12});
// Reusable, readable 3D symbols. All instances share geometry/materials.
export function powerIcon(type){if(templates.has(type))return templates.get(type).clone(true);const g=new T.Group(),white=material('#f5ffff'),red=material('#ef4860'),gold=material('#ffd04d'),blue=material('#44c7ee');
 const mesh=(geo,m,x=0,y=0,z=0)=>{const a=new T.Mesh(geo,m);a.position.set(x,y,z);g.add(a);return a};
 const bar=(x,y,w,h,m,angle=0)=>{const a=mesh(new T.BoxGeometry(w,h,.15),m,x,y,.06);a.rotation.z=angle;return a};
 if(type==='magnet'){mesh(new T.TorusGeometry(.32,.105,8,20,Math.PI),red).rotation.z=Math.PI;bar(-.32,.20,.21,.4,red);bar(.32,.20,.21,.4,red);bar(-.32,.42,.21,.15,white);bar(.32,.42,.21,.15,white)}
 else if(type==='shield'){const s=new T.Shape();s.moveTo(-.43,.45);s.lineTo(.43,.45);s.lineTo(.38,-.12);s.quadraticCurveTo(.25,-.40,0,-.55);s.quadraticCurveTo(-.25,-.40,-.38,-.12);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth:.13,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:2,steps:1}),blue);bar(0,0,.12,.66,white);bar(0,.12,.5,.12,white)}
 else if(type==='double'){bar(-.35,0,.45,.105,white,Math.PI/4);bar(-.35,0,.45,.105,white,-Math.PI/4);const c=material('#c3a1ff');for(const [x,y,w,h] of [[.27,.4,.46,.10],[.49,.2,.10,.4],[.27,0,.46,.10],[.05,-.2,.10,.4],[.27,-.4,.46,.10]])bar(x,y,w,h,c)}
 else{const s=new T.Shape();s.moveTo(.1,.55);s.lineTo(-.35,-.06);s.lineTo(-.02,-.06);s.lineTo(-.13,-.55);s.lineTo(.37,.12);s.lineTo(.08,.12);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false}),gold)}
 templates.set(type,g);return g.clone(true)}
