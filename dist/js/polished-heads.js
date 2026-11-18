import * as T from './three.module.js';
// Rounded, continuous faces sized for the existing articulated scooter rig.
export function polishedHead(type,h,add,sphere,box,m){
 const {fur,dark,cream,orange,black,white}=m,eyes=[],ears=[];
 const mat=(color,roughness=.65)=>new T.MeshStandardMaterial({color,roughness});
 const pupil=mat('#101a20',.2),shine=mat('#ffffff',.18);
 const line=(parent,points,radius,material)=>add(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,radius,6,false),material,0,0,0);
 const smooth=(sx,sy,sz,power=.82)=>{const g=new T.SphereGeometry(1,32,22),p=g.attributes.position;for(let i=0;i<p.count;i++){const f=v=>Math.sign(v)*Math.pow(Math.abs(v),power);p.setXYZ(i,f(p.getX(i))*sx,f(p.getY(i))*sy,f(p.getZ(i))*sz)}g.computeVertexNormals();return g};
 const eye=(x,y,z,sx=.095,sy=.118,irisColor='#794c28',turn=0)=>{
  const g=new T.Group();g.position.set(x,y,z);g.rotation.y=turn;h.add(g);
  add(g,sphere,dark,0,.003,.018,sx*1.12,sy*1.09,.053);
  add(g,sphere,white,0,0,0,sx,sy,.047);
  add(g,sphere,mat(irisColor,.32),0,-.008,-.041,sx*.64,sy*.73,.028);
  add(g,sphere,pupil,0,-.006,-.065,sx*.40,sy*.55,.018);
  add(g,sphere,shine,-sx*.25,sy*.32,-.081,sx*.19,sy*.16,.008);
  add(g,sphere,shine,sx*.23,-sy*.25,-.08,sx*.085,sy*.075,.005);
  eyes.push(g);return g;
 };
 if(type==='raccoon'){
  const gray=mat('#a0a8ac'),ivory=mat('#eee8dc'),mask=mat('#29323c');
  add(h,smooth(.405,.335,.32,.87),gray,0,.015,.03);
  // Short cheek tufts flow out of the silhouette, rather than a bead necklace.
  for(const side of [-1,1]){
   for(let i=0;i<3;i++){const tuft=add(h,sphere,i===2?ivory:gray,side*(.335+i*.014),-.085-i*.055,-.075-i*.035,.108-i*.008,.055,.16);tuft.rotation.z=side*(.25+i*.13)}
   const ear=new T.Group();ear.position.set(side*.31,.29,.015);h.add(ear);
   const eg=smooth(.122,.174,.08,.90);add(ear,eg,mask,0,0,0);add(ear,sphere,ivory,0,.009,-.065,.074,.115,.023);add(ear,sphere,mat('#c4aaa5'),0,.004,-.083,.039,.072,.008);ears.push(ear);
   const band=add(h,sphere,mask,side*.181,.055,-.258,.195,.152,.100);band.rotation.z=-side*.16;
   eye(side*.168,.072,-.352,.088,.108,'#9c6b39',side*.09);
   add(h,sphere,ivory,side*.21,-.155,-.269,.19,.135,.107);
   const brow=add(h,sphere,gray,side*.19,.215,-.286,.126,.038,.047);brow.rotation.z=side*.13;
  }
  add(h,smooth(.168,.10,.117,.83),ivory,0,-.15,-.383);
  add(h,sphere,pupil,0,-.102,-.502,.068,.047,.039);add(h,sphere,shine,-.018,-.087,-.533,.016,.008,.003);
  line(h,[[0,-.143,-.504],[0,-.195,-.481]],.006,mask);
  line(h,[[-.10,-.209,-.433],[0,-.242,-.459],[.10,-.209,-.433]],.008,mask);
  for(const side of [-1,1])for(let i=0;i<3;i++)add(h,sphere,mask,side*(.10+i*.028),-.145-i*.021,-.461+i*.01,.007,.007,.004);
  // Backwards orange cap keeps the mask and both ears exposed.
  const cap=add(h,new T.SphereGeometry(1,32,18,0,Math.PI*2,0,Math.PI/2),orange,0,.266,.078,.272,.174,.266);
  add(h,sphere,orange,0,.278,.319,.195,.029,.13);
  line(h,[[-.25,.27,-.035],[0,.277,-.18],[.25,.27,-.035]],.013,mat('#f5b25f'));
  line(h,[[0,.439,.08],[0,.385,-.09],[0,.283,-.186]],.006,mat('#d78435'));
  add(h,sphere,orange,0,.44,.08,.027,.014,.028);
 }else if(type==='toucan'){
  add(h,sphere,fur,0,.025,.05,.34,.355,.325);
  add(h,sphere,cream,0,-.13,-.212,.263,.24,.137);
  // Eyes sit high and wide, wholly above the top of the bill's root.
  for(const side of [-1,1]){
   add(h,sphere,mat('#55c9be'),side*.24,.15,-.201,.115,.141,.068);
   eye(side*.238,.155,-.267,.078,.104,'#386e71',side*.22);
  }
  // Continuous curved yellow bill, widening at the root and tapering to a hook.
  const g=new T.SphereGeometry(1,40,26),p=g.attributes.position,colors=[];
  const yellow=new T.Color('#ffd04c'),warm=new T.Color('#f49b2e'),tip=new T.Color('#182631');
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),u=(1-z)/2;
   p.setXYZ(i,x*.235*(1-.38*u),y*.195*(1-.15*u)-.012-.09*u*u,-.27-u*.62);
   const c=yellow.clone().lerp(warm,T.MathUtils.clamp((-y+.1)*.32,0,.50));if(u>.72)c.lerp(tip,T.MathUtils.smoothstep(u,.72,.80));colors.push(c.r,c.g,c.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();add(h,g,new T.MeshStandardMaterial({vertexColors:true,roughness:.44}),0,0,0);
  for(const side of [-1,1]){
   line(h,[[side*.222,-.06,-.35],[side*.190,-.081,-.52],[side*.132,-.113,-.74],[side*.074,-.137,-.844]],.0065,mat('#6f4920'));
   add(h,sphere,mat('#87591e'),side*.203,.025,-.365,.014,.010,.009);
  }
  for(let i=0;i<2;i++){const tuft=add(h,sphere,fur,(i-.5)*.056,.36,.11+i*.025,.045,.11,.10);tuft.rotation.x=-.35}
 }else if(type==='capybara'){
  // Keep the approved barrel-shaped skull and blunt muzzle.
  add(h,smooth(.43,.32,.52,.72),fur,0,0,.045);
  add(h,smooth(.34,.17,.36,.73),fur,0,-.13,-.43);
  add(h,smooth(.315,.092,.19,.75),cream,0,-.215,-.66);
  for(const side of [-1,1]){
   const ear=new T.Group();ear.position.set(side*.30,.29,.105);h.add(ear);add(ear,sphere,fur,0,0,0,.089,.104,.070);add(ear,sphere,mat('#896247'),0,.007,-.056,.052,.063,.016);ears.push(ear);
   eye(side*.31,.13,-.376,.058,.066,'#57381e',side*.24);
   const brow=add(h,sphere,fur,side*.308,.213,-.345,.081,.031,.045);brow.rotation.z=side*.10;
   add(h,sphere,mat('#604733'),side*.142,-.115,-.790,.039,.025,.016);
   add(h,sphere,black,side*.141,-.113,-.804,.019,.015,.007);
  }
  line(h,[[-.175,-.237,-.80],[0,-.261,-.837],[.175,-.237,-.80]],.0075,mat('#705038'));
 }else{
  add(h,smooth(.37,.34,.335,.9),fur,0,.035,.035);
  add(h,sphere,cream,0,-.165,-.24,.29,.155,.19);
  add(h,smooth(.255,.126,.19,.87),fur,0,-.09,-.354);
  for(const side of [-1,1]){
   add(h,sphere,fur,side*.211,.15,-.225,.149,.163,.139);
   eye(side*.209,.156,-.342,.102,.12,'#466c25',side*.08);
   const brow=add(h,sphere,mat('#438723'),side*.207,.294,-.28,.116,.033,.057);brow.rotation.z=side*.12;
   add(h,sphere,mat('#3f791e'),side*.12,-.067,-.546,.013,.016,.006);
  }
  line(h,[[-.185,-.172,-.453],[0,-.221,-.514],[.185,-.172,-.453]],.009,mat('#3b7720'));
  // Curved crest and spots echo the provided Suri mascot.
  add(h,sphere,fur,0,.335,.13,.139,.17,.21);
  const spots=mat('#509d20');for(const side of [-1,1])for(let i=0;i<4;i++)add(h,sphere,spots,side*(.045+i*.055),.43-i*.031,.06+i*.028,.027,.016,.033);
  for(const side of [-1,1])for(let i=0;i<3;i++)add(h,sphere,spots,side*(.295+i*.016),-.12-i*.037,-.162+i*.026,.024,.021,.013);
  const headset=mat('#24362e'),pad=mat('#314b35'),lime=mat('#94dc2c');
  add(h,new T.TorusGeometry(.36,.029,8,32,Math.PI),headset,0,.025,.105);
  for(const side of [-1,1]){
   add(h,new T.CylinderGeometry(.148,.148,.09,24).rotateZ(Math.PI/2),pad,side*.36,.035,.065);
   add(h,new T.CylinderGeometry(.126,.126,.034,24).rotateZ(Math.PI/2),lime,side*.415,.035,.065);
   add(h,new T.CylinderGeometry(.090,.090,.012,20).rotateZ(Math.PI/2),fur,side*.438,.035,.065);
  }
  line(h,[[.419,-.03,.03],[.40,-.13,-.15],[.285,-.208,-.338]],.013,headset);add(h,sphere,mat('#f1c461'),.278,-.209,-.352,.039,.023,.025);
 }
 return {eyes,ears};
}
