import * as T from './three.module.js';
import {Character} from './character.js';
import {CHARACTERS} from './animal-models.js';
export class CharacterPreview{
 constructor(canvas){
  this.canvas=canvas;this.renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
  this.scene=new T.Scene();this.scene.add(new T.HemisphereLight('#e6fcff','#48626a',1.9));
  const light=new T.DirectionalLight('#fff0cc',2.6);light.position.set(-3,5,4);this.scene.add(light);
  const rim=new T.DirectionalLight('#70e9ee',1.2);rim.position.set(3,3,-3);this.scene.add(rim);
  this.camera=new T.PerspectiveCamera(34,1,.1,30);this.camera.position.set(2.6,2.45,4.3);this.camera.lookAt(0,1.12,0);
  this.pose={x:0,y:0,lane:0,vy:0,slideBlend:0};this.models=new Map();
  this.renderer.setSize(250,250,false);
  for(const c of CHARACTERS){
   const model=new Character(c.id);this.models.set(c.id,model);this.scene.add(model);model.animate(this.pose,.8,'menu',0);model.rotation.y=-2.91;
   this.renderer.render(this.scene,this.camera);
   const img=document.querySelector(`[data-character="${c.id}"] img`);if(img)img.src=canvas.toDataURL('image/png');
   this.scene.remove(model);
  }
  const stage=new T.Mesh(new T.CylinderGeometry(.97,1.08,.13,48),new T.MeshStandardMaterial({color:'#116374',roughness:.65}));stage.position.y=-.10;this.scene.add(stage);
  const ring=new T.Mesh(new T.TorusGeometry(.98,.025,6,48),new T.MeshBasicMaterial({color:'#b4ed4a'}));ring.rotation.x=Math.PI/2;ring.position.y=-.029;this.scene.add(ring);
  this.setCharacter('suri');this.resize();
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);
 }
 setCharacter(id){if(this.model)this.scene.remove(this.model);this.model=this.models.get(id)||this.models.get('suri');this.scene.add(this.model)}
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(w<1||h<1)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()}
 draw(t){if(!this.model)return;this.model.animate(this.pose,t,'menu',0);this.model.rotation.y=-2.91+Math.sin(t*.55)*.13;this.renderer.render(this.scene,this.camera)}
}
