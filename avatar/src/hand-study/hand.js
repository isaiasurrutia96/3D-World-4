import * as T from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {refineSurface} from './surface.js';
import {lengthenDigits} from './lengthen-digits.js';
import {softenThumbRoot} from './soften-thumb.js';
import {easeDigitSweep} from './ease-digit-sweep.js';
import {poseRestingDigits} from './resting-digits.js';
import {outline} from './reference-outline.js';
// Use the source image's silhouette rather than approximated finger capsules.
export function createEmojiHand(material,side){
 const bytes=Uint8Array.from(atob(outline.data),c=>c.charCodeAt(0)),samples=new Int16Array(bytes.buffer);
 const sample=(px,py,values=samples,scale=outline.divisor/.0008)=>{const u=(px-outline.x0)/outline.stride,v=(py-outline.y0)/outline.stride;if(u<0||v<0||u>=outline.width-1||v>=outline.height-1)return-.1;const i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,k=j*outline.width+i;return ((values[k]*(1-a)+values[k+1]*a)*(1-b)+(values[k+outline.width]*(1-a)+values[k+outline.width+1]*a)*b)/scale;};
 const depthBytes=Uint8Array.from(atob(outline.depth),c=>c.charCodeAt(0)),depthSamples=new Uint16Array(depthBytes.buffer);
 const n=160,domain=.22,mc=new MarchingCubes(n,material,false,false,150000);mc.isolation=.0016;
 // Precompute the image-space profile for each XY grid location.
 const distance=new Float32Array(n*n),depth=new Float32Array(n*n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const x=(i/n*2-1)*domain*side,y=(j/n*2-1)*domain,px=x/.0008+244,py=y/.0008+285;
  distance[j*n+i]=sample(px,py);depth[j*n+i]=Math.max(0,sample(px,py,depthSamples,100000));
 }
 for(let k=0;k<n;k++){const z=Math.abs((k/n*2-1)*domain);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const q=j*n+i;mc.field[k*n*n+q]=Math.min(distance[q],depth[q]-z);}}
 mc.update();const source=mc.geometry,count=source.drawRange.count;let geometry=new T.BufferGeometry();
 for(const name of ['position','normal']){const attr=source.getAttribute(name);geometry.setAttribute(name,new T.BufferAttribute(attr.array.slice(0,count*3),3));}
 geometry.scale(domain,domain,domain);geometry.deleteAttribute('normal');geometry=mergeVertices(geometry,.00002);
 // Gentle, non-shrinking surface fairing removes sampling ridges while
 // limiting every vertex to 1.5 mm from the established shape.
 const pos=geometry.attributes.position,idx=geometry.index.array;
 const adjacent=Array.from({length:pos.count},()=>new Set());
 for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];adjacent[a].add(b).add(c);adjacent[b].add(a).add(c);adjacent[c].add(a).add(b);}
 const original=pos.array.slice(),neighbors=adjacent.map(s=>Array.from(s));let coordinates=Float32Array.from(pos.array);
 function relax(weight){const next=coordinates.slice();for(let i=0;i<pos.count;i++){const near=neighbors[i];if(!near.length)continue;for(let d=0;d<3;d++){let sum=0;for(const j of near)sum+=coordinates[j*3+d];next[i*3+d]+=weight*(sum/near.length-coordinates[i*3+d]);}}coordinates=next;}
 for(let pass=0;pass<5;pass++){relax(.45);relax(-.47);}
 let maxMove=0;for(let i=0;i<pos.count;i++){const k=i*3,dx=coordinates[k]-original[k],dy=coordinates[k+1]-original[k+1],dz=coordinates[k+2]-original[k+2],distance=Math.hypot(dx,dy,dz),factor=distance>.0015?.0015/distance:1;pos.setXYZ(i,original[k]+dx*factor,original[k+1]+dy*factor,original[k+2]+dz*factor);maxMove=Math.max(maxMove,distance*factor);}
 geometry.userData.maxSmoothingDisplacement=maxMove;
 geometry=refineSurface(geometry);
 const digitBindPositions=geometry.attributes.position.array.slice();
 geometry=lengthenDigits(geometry,side);
 geometry=softenThumbRoot(geometry,side);
 geometry=easeDigitSweep(geometry,side);
 geometry=poseRestingDigits(geometry,side,digitBindPositions);
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const hand=new T.Mesh(geometry,material);hand.name='emoji-hand';hand.userData={digits:5,reference:'image-extracted-outline',wristRemoved:true,surfaceSmoothed:true};return hand;
}
