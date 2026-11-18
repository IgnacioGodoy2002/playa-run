import * as T from './three.module.js';
import {addCoast} from './coast.js';
const material=(color)=>new T.MeshStandardMaterial({color,roughness:.9,flatShading:true});
// Shared geometries and instancing keep the tropical corridor inexpensive on phones.
export class Scenery {
 constructor(scene){this.scene=scene;this.offset=0;this.batches=[];this.dummy=new T.Object3D();this.unit=new T.BoxGeometry();this.stone=material('#e9d3a2');this.sand=material('#f1c875');this.rock=material('#bd6943');this.grass=material('#74a83a');this.leaf=material('#329843');this.trunk=material('#99703e');this.setup()}
 batch(geometry,mat,records){const mesh=new T.InstancedMesh(geometry,mat,records.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;this.scene.add(mesh);this.batches.push({mesh,records});return mesh}
 record(x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){return {x,y,z,sx,sy,sz,rx,ry,rz}}
 solid(geometry,mat,x,y,z,sx,sy,sz){let mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.receiveShadow=true;this.scene.add(mesh);return mesh}
 setup(){
 // Fine sand grain is generated once, stays tiny, and has no external texture request.
 let pixels=new Uint8Array(64*64*4);for(let i=0;i<64*64;i++){const v=222+Math.random()*32;pixels.set([v,v,v,255],i*4)}const sandTex=new T.DataTexture(pixels,64,64);sandTex.wrapS=sandTex.wrapT=T.RepeatWrapping;sandTex.repeat.set(5,110);sandTex.magFilter=T.LinearFilter;sandTex.needsUpdate=true;this.sand.map=sandTex;
 this.solid(this.unit,this.sand,0,-.16,-93,8.5,.3,240);
 this.solid(this.unit,material('#eddbad'),-8,-.43,-93,8,.7,240);
 this.solid(this.unit,this.grass,8,-.15,-93,7,.6,240);
 this.solid(this.unit,this.rock,19,1,-93,16,3,240);
 const oceanMat=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; uniform float time; void main(){vUv=uv;vec3 p=position;p.z+=sin(p.x*.2+time)*.035;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',fragmentShader:'varying vec2 vUv; uniform float time; void main(){float ripple=pow(max(0.,sin(vUv.y*750.+sin(vUv.x*110.+time)*2.+time*1.5)),22.);vec3 c=mix(vec3(.03,.48,.70),vec3(.14,.75,.79),vUv.x);gl_FragColor=vec4(c+ripple*.15,1.);}'});
 let water=this.solid(new T.PlaneGeometry(180,320,1,20),oceanMat,-100,-.58,-95,1,1,1);water.rotation.x=-Math.PI/2;this.water=water;
 let curbs=[],grass=[],trunks=[],leaves=[],rocks=[],flowers=[],foam=[],marks=[];
 // Palm fronds have a central ridge and drooping tip, rather than cone-shaped trees.
 const frond=new T.BufferGeometry();frond.setAttribute('position',new T.Float32BufferAttribute([0,0,0, -.52,.10,1.4, 0,.3,1.5, .52,.1,1.4, 0,-.65,3.1],3));frond.setIndex([0,1,2,0,2,3,1,4,2,2,4,3]);frond.computeVertexNormals();this.leaf.side=T.DoubleSide;this.leaf.shadowSide=T.DoubleSide;
 for(let i=0;i<48;i++){let z=14-i*5;for(let side of [-1,1])curbs.push(this.record(side*4.4,.03,z,.36,.20,4.8));if(i%2===0)marks.push(this.record(0,.002,z,7.9,.008,.035));foam.push(this.record(-12.2,-.55,z,1.1,.02,3.7));
 if(i%2===0){let side=i%4===0?-1:1;let x=side*(6.3+Math.random()*2),h=4.5+Math.random()*2.4;trunks.push(this.record(x,h/2,z,.31,h,.31,0,0,side*-.10));for(let k=0;k<7;k++)leaves.push(this.record(x+side*.10*h/2,h-.15,z,1,1,1,0,k*Math.PI*2/7,.08));
 for(let k=0;k<3;k++)grass.push(this.record(side*(5.3+Math.random()),.25,z+k, .65,.55,.8,0,Math.random()*6,0));}
 if(i%3===0){rocks.push(this.record(11+Math.random()*3,1.5,z,3,2.3,3.5,0,Math.random(),0));grass.push(this.record(11.5,3.3,z,3.8,.7,3.8));}
 if(i%4===0){for(let j=0;j<3;j++)flowers.push(this.record(5.5+Math.random()*1.4,.45,z+j*.25,.15,.24,.15));}
 }
 this.batch(this.unit,this.stone,curbs);this.batch(new T.CylinderGeometry(.7,1,1,7),this.trunk,trunks);this.batch(frond,this.leaf,leaves);this.batch(new T.IcosahedronGeometry(1,0),this.grass,grass);this.batch(new T.DodecahedronGeometry(1,0),this.rock,rocks);this.batch(new T.IcosahedronGeometry(1),material('#f7bd3f'),flowers);this.batch(this.unit,material('#b9eee8'),foam);this.batch(this.unit,material('#e0b56a'),marks);
 // Far islands and clouds give depth without moving toward the camera.
 const island=material('#429682');for(let i=0;i<5;i++)this.solid(new T.ConeGeometry(1,1,7),island,-65+i*17,2+Math.random()*3,-185-Math.random()*15,12+Math.random()*15,13+Math.random()*15,15);
 const white=material('#ffffff');const puff=new T.SphereGeometry(1,7,5);for(let i=0;i<9;i++){let x=-95+i*24,z=-130-Math.random()*65,y=23+Math.random()*13;for(let j=0;j<3;j++){const c=this.solid(puff,white,x+j*3,y+(j===1?1.5:0),z,3.6,2.2+j%2,2);c.receiveShadow=false;}}
 // Small sandstone ruins preserve the lost-temple identity.
 const ruin=material('#e9b77c');for(let side of [-1,1]){this.solid(this.unit,ruin,side*9,4.5,-165,3,9,3);this.solid(this.unit,this.stone,side*9,9,-165,4,1,4)}this.solid(this.unit,ruin,0,9.9,-165,22,1.1,3);
 addCoast(this);
 this.update(0,0);
 }
 update(dt,speed){this.offset=(this.offset+dt*speed)%240;this.water.material.uniforms.time.value+=dt;const t=this.water.material.uniforms.time.value;for(const b of this.birds){b.rz=b.side*(.25+Math.sin(t*3+b.phase)*.5);b.rx=.12;}for(const {mesh,records} of this.batches){records.forEach((r,i)=>{const z=((r.z+this.offset+226)%240+240)%240-226;this.dummy.position.set(r.x+(r.side?r.side*.31:0),r.y+(r.side?Math.sin(t*.9+r.phase)*.25:0),z);this.dummy.scale.set(r.sx,r.sy,r.sz);this.dummy.rotation.set(r.rx,r.ry,r.rz);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix)});mesh.instanceMatrix.needsUpdate=true}}
}
