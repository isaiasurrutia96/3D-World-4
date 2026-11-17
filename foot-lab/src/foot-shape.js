import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Measure the same sphere and mesh scale used by the approved foot, including
// its sampled silhouette, rather than assuming an ideal sphere's bounds.
const original=new T.SphereGeometry(.172,14,12);original.computeBoundingBox();
const originalSize=original.boundingBox.getSize(new T.Vector3()).multiply(new T.Vector3(.82,.58,1.44));original.dispose();
export const FOOT_SIZE=Object.freeze({width:originalSize.x,height:originalSize.y,length:originalSize.z});
const signedPower=(x,p)=>Math.sign(x)*Math.pow(Math.abs(x),p);

export function createFootShape(material=new T.MeshStandardMaterial({color:'#b9b2a6',roughness:.78,metalness:0})){
 const source=new T.SphereGeometry(1,128,96),p=source.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const length=signedPower(z,.80),worldZ=.09+length*FOOT_SIZE.length/2;
  const forefoot=.86+.14*T.MathUtils.smoothstep(length,-.35,.7);
  const innerArch=x<0?1-.04*Math.exp(-Math.pow(worldZ/.085,2))*Math.abs(x):1;
  const worldX=signedPower(x,.84)*FOOT_SIZE.width/2*forefoot*innerArch;
  // Flatten a broad contact patch; a quadratic fillet meets the curved
  // side continuously, instead of chopping a sharp edge into the sole.
  const raw=y+.75,blend=.28;
  const soleRise=raw<=0?0:raw<blend?raw*raw/(2*blend):raw-blend/2;
  const dome=.145*soleRise/1.61;
  const ankle=.05*Math.exp(-Math.pow((worldZ+.035)/.12,2))*Math.pow(Math.max(0,y),2);
  p.setXYZ(i,worldX,dome+ankle,worldZ);
 }
 source.computeBoundingBox();
 const size=source.boundingBox.getSize(new T.Vector3());
 source.scale(FOOT_SIZE.width/size.x,FOOT_SIZE.height/size.y,FOOT_SIZE.length/size.z);
 source.computeBoundingBox();
 source.translate(-source.boundingBox.getCenter(new T.Vector3()).x,-source.boundingBox.min.y,.09-source.boundingBox.getCenter(new T.Vector3()).z);
 source.deleteAttribute('normal');source.deleteAttribute('uv');
 const geometry=mergeVertices(source,1e-6),faces=[];
 for(let i=0;i<geometry.index.count;i+=3){const a=geometry.index.array[i],b=geometry.index.array[i+1],c=geometry.index.array[i+2];if(a!==b&&b!==c&&c!==a)faces.push(a,b,c);}
 geometry.setIndex(faces);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();source.dispose();
 const position=geometry.attributes.position;let minSoleZ=Infinity,maxSoleZ=-Infinity,soleVertices=0;
 for(let i=0;i<position.count;i++)if(position.getY(i)<1e-7){minSoleZ=Math.min(minSoleZ,position.getZ(i));maxSoleZ=Math.max(maxSoleZ,position.getZ(i));soleVertices++;}
 const foot=new T.Mesh(geometry,material);foot.name='draft-rounded-foot';foot.castShadow=true;foot.receiveShadow=false;
 foot.userData={
  size:{...FOOT_SIZE},forward:'+Z',soleY:0,soleVertices,
  contacts:{heel:[0,0,T.MathUtils.lerp(minSoleZ,.09,.25)],ball:[0,0,T.MathUtils.lerp(.09,maxSoleZ,.6)],toe:[0,0,T.MathUtils.lerp(.09,maxSoleZ,.85)]},
  suggestedAnklePivot:[0,.15,-.035],
 };
 return foot;
}
