import * as T from './three.module.js';
export const CHARACTERS=[
 {id:'toucan',name:'Tucán',color:'#ffb62c',caption:'Pico grande. Aventura gigante.'},
 {id:'capybara',name:'Capibara',color:'#ff9d63',caption:'Toda la calma. Toda la velocidad.'},
 {id:'raccoon',name:'Mapache',color:'#38d7d0',caption:'El explorador de la costa.'},
 {id:'suri',name:'Suri',color:'#a7e92f',caption:'El camaleón de la costa.'}
];
export const PALETTES={
 raccoon:{fur:'#a0a8ac',dark:'#29323c',cream:'#efe6cf',accent:'#f3a04a',coat:'#269b94',shoe:'#e3b862'},
 toucan:{fur:'#202c3c',dark:'#14202e',cream:'#fff3c9',accent:'#ffae26',coat:'#23374c',shoe:'#efa42f'},
 capybara:{fur:'#a87a50',dark:'#4d3b2c',cream:'#c59a70',accent:'#b89959',coat:'#846345',shoe:'#45382e'},
 suri:{fur:'#7ecb2a',dark:'#244b1d',cream:'#b0e45a',accent:'#74cf32',coat:'#4b9f2d',shoe:'#27332c'}
};
// Small deterministic color variation gives fur and feathers texture without external files.
export function animalSurface(type,color){
 const data=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){
  const hash=(x*374761393+y*668265263)>>>0;
  const grain=((hash^(hash>>>13))*1274126177)>>>0;
  const strand=(x*3+y*11)%17<2?-8:0;
  const value=Math.max(145,Math.min(255,245+(grain%17)-8+strand));const k=(y*64+x)*4;
  data[k]=value;data[k+1]=value;data[k+2]=value;data[k+3]=255;
 }
 const tex=new T.DataTexture(data,64,64,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2,2);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;
 return new T.MeshStandardMaterial({color,roughness:type==='toucan'?.89:1,map:tex});
}
// Bespoke smooth 3D anatomy, using the shared animated rider rig.
export function buildAnimalHead(type,h,add,sphere,box,materials){
 const {fur,dark,cream,orange,black,white}=materials;
 const material=c=>new T.MeshStandardMaterial({color:c,roughness:.8});
 const eyes=[],ears=[];
 const eye=(x,y,z,sx=.085,sy=.10)=>{
  const g=new T.Group();g.position.set(x,y,z);h.add(g);
  add(g,sphere,white,0,0,0,sx,sy,.046);
  add(g,sphere,material('#775438'),0,-.008,-.041,sx*.63,sy*.68,.023);
  add(g,sphere,black,0,-.008,-.059,sx*.37,sy*.52,.018);
  add(g,sphere,white,-.015,.025,-.074,.014,.018,.008);eyes.push(g);
 };
 if(type==='toucan'){
  add(h,sphere,fur,0,0,0,.34,.34,.32);
  add(h,sphere,cream,0,-.12,-.225,.26,.245,.14);
  const ring=material('#40c9bd');
  for(const side of [-1,1]){add(h,sphere,ring,side*.225,.075,-.235,.112,.128,.052);{const g=new T.Group();g.position.set(side*.225,.08,-.278);h.add(g);add(g,sphere,white,0,0,0,.069,.082,.046);add(g,sphere,black,0,0,-.037,.0345,.0525,.021);add(g,sphere,white,-.015,.025,-.055,.015,.019,.008);eyes.push(g)}}
  // A deep, curved bill with an orange upper shell and charcoal tip.
  const bill=new T.SphereGeometry(1,24,14);
  for(let i=0;i<bill.attributes.position.count;i++){
   const z=bill.attributes.position.getZ(i);bill.attributes.position.setX(i,bill.attributes.position.getX(i)*(1-.22*Math.max(0,-z)));
  }bill.computeVertexNormals();
  add(h,bill,orange,0,-.01,-.48,.205,.225,.47);
  add(h,sphere,material('#f07c27'),0,-.09,-.61,.178,.10,.33);
  add(h,sphere,black,0,-.025,-.872,.123,.145,.095);
  add(h,box,dark,0,-.105,-.58,.27,.017,.52);
  for(const side of [-1,1])add(h,sphere,dark,side*.145,.07,-.39,.026,.02,.019);
 }else if(type==='capybara'){
  // Squared, elongated skull and blunt continuous muzzle define a capybara.
  const rounded=(sx,sy,sz)=>{const g=new T.SphereGeometry(1,32,20),p=g.attributes.position;for(let i=0;i<p.count;i++){const shape=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);p.setXYZ(i,shape(p.getX(i),.72)*sx,shape(p.getY(i),.75)*sy,shape(p.getZ(i),.70)*sz)}g.computeVertexNormals();return g};
  add(h,rounded(.43,.32,.52),fur,0,0,.045);
  add(h,rounded(.34,.17,.36),fur,0,-.13,-.43);
  add(h,rounded(.315,.092,.19),cream,0,-.215,-.66);
  add(h,rounded(.21,.065,.045),dark,0,-.115,-.807);
  for(const side of [-1,1]){
   const ear=new T.Group();ear.position.set(side*.30,.29,.105);h.add(ear);
   add(ear,sphere,fur,0,0,0,.085,.10,.07);add(ear,sphere,dark,0,.005,-.052,.048,.058,.019);ears.push(ear);
   const gaze=new T.Group();gaze.position.set(side*.30,.14,-.37);h.add(gaze);
   add(gaze,sphere,dark,0,0,0,.047,.052,.034);add(gaze,sphere,white,-.012,.02,-.03,.008,.01,.005);eyes.push(gaze);
   add(h,sphere,black,side*.135,-.107,-.845,.026,.025,.012);
  }
  add(h,sphere,dark,0,-.25,-.83,.075,.018,.015);
 }else{
  // Suri: rounded chameleon skull, raised eye turrets and a short broad snout.
  add(h,sphere,fur,0,0,.035,.375,.34,.355);
  add(h,sphere,cream,0,-.17,-.22,.28,.17,.19);
  add(h,sphere,fur,0,-.125,-.37,.25,.13,.24);
  add(h,sphere,dark,0,-.17,-.593,.042,.03,.023);
  for(const side of [-1,1]){
   add(h,sphere,fur,side*.19,.12,-.245,.145,.15,.13);
   const gaze=new T.Group();gaze.position.set(side*.19,.125,-.353);h.add(gaze);
   add(gaze,sphere,cream,0,0,0,.096,.107,.049);
   add(gaze,sphere,black,-side*.008,-.012,-.045,.057,.069,.023);
   add(gaze,sphere,white,-side*.029,.024,-.067,.018,.022,.008);eyes.push(gaze);
   const brow=add(h,sphere,dark,side*.19,.238,-.319,.105,.027,.057);brow.rotation.z=-side*.13;
   add(h,sphere,dark,side*.11,-.11,-.575,.015,.018,.011);
  }
  const smile=new T.CatmullRomCurve3([new T.Vector3(-.17,-.205,-.49),new T.Vector3(0,-.245,-.552),new T.Vector3(.17,-.205,-.49)]);
  add(h,new T.TubeGeometry(smile,16,.007,5,false),dark,0,0,0);
  const band=new T.TorusGeometry(.37,.042,8,32,Math.PI);add(h,band,dark,0,.03,.02);
  for(const side of [-1,1]){
   add(h,new T.CylinderGeometry(.16,.16,.09,20).rotateZ(Math.PI/2),dark,side*.35,-.015,.02);
   add(h,new T.CylinderGeometry(.127,.127,.025,20).rotateZ(Math.PI/2),orange,side*.405,-.015,.02);
   add(h,new T.CylinderGeometry(.075,.075,.029,16).rotateZ(Math.PI/2),dark,side*.422,-.015,.02);
  }
  const spots=material('#4f9c20');
  add(h,sphere,fur,0,.31,.11,.17,.15,.22);
  for(const side of [-1,1])for(let i=0;i<4;i++)add(h,sphere,spots,side*(.065+i*.067),.32-i*.017,.05+i*.05,.026,.015,.026);
  for(const side of [-1,1])for(let i=0;i<3;i++)add(h,sphere,spots,side*(.25+i*.024),-.15-i*.04,-.16+i*.03,.018,.018,.01);
 }
 return {eyes,ears};
}
export function buildAnimalTail(type,parent,add,sphere,materials){
 const {fur,dark,orange}=materials;
 if(type==='capybara')return; // Capybaras do not have an externally visible tail.
 if(type==='toucan'){
  for(let i=-1;i<=1;i++){const feather=add(parent,sphere,dark,i*.075,-.13,.25,.075,.075,.38);feather.rotation.x=.3;add(parent,sphere,orange,i*.075,-.22,.52,.07,.04,.1)}
 }else{
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.12,-.16,.32),new T.Vector3(.32,-.10,.65),new T.Vector3(.43,.20,.88),new T.Vector3(.44,.61,.86),new T.Vector3(.36,.88,.64),new T.Vector3(.24,.91,.49)]);
  const geometry=new T.TubeGeometry(curve,40,.15,12,false),pos=geometry.attributes.position,colors=[];
  const base=new T.Color('#79bd22'),spot=new T.Color('#508b1b');
  for(let i=0;i<pos.count;i++){
   const step=Math.floor(i/13),u=step/40,center=curve.getPointAt(u),scale=1-.94*Math.pow(u,1.8);
   pos.setXYZ(i,center.x+(pos.getX(i)-center.x)*scale,center.y+(pos.getY(i)-center.y)*scale,center.z+(pos.getZ(i)-center.z)*scale);
   const angle=(i%13)/12,du=((u*8)%1)-.5,da=((angle*3+Math.floor(u*8)*.4)%1)-.5;
   const c=du*du/.10+da*da/.13<1?spot:base;colors.push(c.r,c.g,c.b);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  add(parent,geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.85}),0,0,0);
  for(let i=0;i<4;i++){const point=curve.getPointAt(.18+i*.14);add(parent,new T.ConeGeometry(.055,.13,7),fur,point.x,point.y+.10,point.z).rotation.z=-.5}

 }
}
