import * as T from './three.module.js';
// Continuous sculpted surfaces replace stacked spheres; vertex colors need no texture downloads.
export function headGeometry(){const g=new T.SphereGeometry(1,48,32),p=g.attributes.position,colors=[];const grey=new T.Color('#90969a'),light=new T.Color('#d9d4c8'),mask=new T.Color('#343c42');
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const cheek=1+.15*Math.exp(-Math.pow((y+.25)*4,2));const nose=Math.exp(-(x*x*18+(y+.30)**2*15))*Math.max(0,-z);p.setXYZ(i,x*.38*cheek,y*.33,z*.29-nose*.18);let c=grey.clone();if(z<-.42&&y<-.15)c.lerp(light,.86);if(z<-.45){const band=Math.exp(-Math.pow((y-.065)*6.5,4));c.lerp(mask,band*.96)}const grain=(Math.sin(x*137+y*193+z*71)*Math.sin(y*247-z*127))*.025;c.multiplyScalar(1+grain);colors.push(c.r,c.g,c.b)}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g}
export function torsoGeometry(){return new T.LatheGeometry([new T.Vector2(.22,-.08),new T.Vector2(.29,0),new T.Vector2(.31,.17),new T.Vector2(.30,.34),new T.Vector2(.32,.46),new T.Vector2(.23,.55),new T.Vector2(.15,.59)],24)}
export function tailGeometry(){
 const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.04,.08,.25),new T.Vector3(.08,.18,.55),new T.Vector3(.04,.23,.86)]);
 const g=new T.TubeGeometry(curve,40,.17,14,false),p=g.attributes.position,colors=[];
 const dark=new T.Color('#30373a'),silver=new T.Color('#aeb1ae');
 for(let i=0;i<p.count;i++){
  const t=Math.floor(i/15)/40,center=curve.getPointAt(t),v=new T.Vector3().fromBufferAttribute(p,i);
  const taper=.20+.95*Math.sin(Math.PI*(t*.85+.05));v.sub(center).multiplyScalar(taper).add(center);
  p.setXYZ(i,v.x,v.y,v.z);
  const band=Math.floor(t*8)%2;const c=(band?silver:dark).clone().multiplyScalar(1+.035*Math.sin(i*23));colors.push(c.r,c.g,c.b);
 }
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
