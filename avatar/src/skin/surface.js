import * as T from 'three';
import {VOXEL,FIELD_BOUNDS} from './field.js';

// A consistent Freudenthal tetrahedral subdivision has no ambiguous cube
// faces. Shared grid-edge vertices make a single conforming surface.
const TETS=[[0,1,3,7],[0,3,2,7],[0,2,6,7],[0,6,4,7],[0,4,5,7],[0,5,1,7]];
export function extractSurface(field,{voxel=VOXEL,bounds=FIELD_BOUNDS,onProgress=()=>{}}={}){
 const nx=Math.ceil(bounds.maxX/voxel)+1,ny=Math.ceil((bounds.maxY-bounds.minY)/voxel)+1,nz=Math.ceil((bounds.maxZ-bounds.minZ)/voxel)+1;
 const total=nx*ny*nz; if(total>60000000)throw Error('Skin grid exceeds authoring budget');
 const F=new Float32Array(total),index=(x,y,z)=>(y*nz+z)*nx+x;
 const point=i=>{const x=i%nx,z=Math.floor(i/nx)%nz,y=Math.floor(i/(nx*nz));return [x*voxel,bounds.minY+y*voxel,bounds.minZ+z*voxel];};
 for(let y=0;y<ny;y++){
  for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)F[index(x,y,z)]=field.distance(x*voxel,bounds.minY+y*voxel,bounds.minZ+z*voxel);
  if(y%32===0)onProgress({stage:'sample',row:y,rows:ny});
 }
 const P=[],N=[],I=[],edges=new Map();
 function gradient(i){
  const x=i%nx,z=Math.floor(i/nx)%nz,y=Math.floor(i/(nx*nz));
  const dx=x===0?0:F[index(Math.min(nx-1,x+1),y,z)]-F[index(x-1,y,z)];
  const dy=F[index(x,Math.min(ny-1,y+1),z)]-F[index(x,Math.max(0,y-1),z)];
  const dz=F[index(x,y,Math.min(nz-1,z+1))]-F[index(x,y,Math.max(0,z-1))];
  return [dx,dy,dz];
 }
 function vertex(a,b){
  if(a>b)[a,b]=[b,a];const key=a*total+b;if(edges.has(key))return edges.get(key);
  const t=F[a]/(F[a]-F[b]),p=point(a),q=point(b),u=gradient(a),v=gradient(b);
  const id=P.length/3;for(let k=0;k<3;k++)P.push(p[k]+(q[k]-p[k])*t);
  const normal=u.map((x,k)=>x+(v[k]-x)*t),length=Math.hypot(...normal)||1;N.push(...normal.map(x=>x/length));edges.set(key,id);return id;
 }
 function triangle(a,b,c,out){
  const ax=P[3*b]-P[3*a],ay=P[3*b+1]-P[3*a+1],az=P[3*b+2]-P[3*a+2],bx=P[3*c]-P[3*a],by=P[3*c+1]-P[3*a+1],bz=P[3*c+2]-P[3*a+2];
  const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
  if(nx*out[0]+ny*out[1]+nz*out[2]<0)[b,c]=[c,b];
  I.push(a,b,c);
 }
 for(let y=0;y<ny-1;y++)for(let z=0;z<nz-1;z++)for(let x=0;x<nx-1;x++){
  const base=index(x,y,z),corners=[base,base+1,base+nx*nz,base+nx*nz+1,base+nx,base+nx+1,base+nx*nz+nx,base+nx*nz+nx+1];
  let mask=0;for(let k=0;k<8;k++)if(F[corners[k]]<0)mask|=1<<k;if(mask===0||mask===255)continue;
  for(const tet of TETS){const inside=[],outside=[];for(const k of tet)(F[corners[k]]<0?inside:outside).push(corners[k]);
   if(!inside.length||!outside.length)continue;
   const out=[0,0,0];for(const i of outside){const p=point(i);for(let k=0;k<3;k++)out[k]+=p[k]/outside.length;}for(const i of inside){const p=point(i);for(let k=0;k<3;k++)out[k]-=p[k]/inside.length;}
   if(inside.length===1||outside.length===1){const a=inside.length===1?inside[0]:outside[0],b=inside.length===1?outside:inside;triangle(vertex(a,b[0]),vertex(a,b[1]),vertex(a,b[2]),out);}
   else{const a=vertex(inside[0],outside[0]),b=vertex(inside[0],outside[1]),c=vertex(inside[1],outside[1]),d=vertex(inside[1],outside[0]);triangle(a,b,c,out);triangle(a,c,d,out);}
  }
 }
 onProgress({stage:'mirror',vertices:P.length/3});
 const halfCount=P.length/3,halfTriangles=I.length,mirror=new Uint32Array(halfCount);
 for(let i=0;i<halfCount;i++){
  if(Math.abs(P[3*i])<1e-10){mirror[i]=i;P[3*i]=0;N[3*i]=0;}
  else{mirror[i]=P.length/3;P.push(-P[3*i],P[3*i+1],P[3*i+2]);N.push(-N[3*i],N[3*i+1],N[3*i+2]);}
 }
 for(let i=0;i<halfTriangles;i+=3)I.push(mirror[I[i]],mirror[I[i+2]],mirror[I[i+1]]);
 // Float32 can identify two very close grid-edge crossings. Weld those exact
 // positions, remove collapsed faces and retain one normal at each vertex.
 const raw=Float32Array.from(P),normals=Float32Array.from(N),unique=new Map(),remap=new Uint32Array(raw.length/3),positions=[],normalOut=[];
 for(let i=0;i<remap.length;i++){
  const key=raw[3*i]+','+raw[3*i+1]+','+raw[3*i+2];let j=unique.get(key);
  if(j===undefined){j=positions.length/3;unique.set(key,j);positions.push(raw[3*i],raw[3*i+1],raw[3*i+2]);normalOut.push(normals[3*i],normals[3*i+1],normals[3*i+2]);}remap[i]=j;
 }
 const indices=[];for(let i=0;i<I.length;i+=3){const a=remap[I[i]],b=remap[I[i+1]],c=remap[I[i+2]];if(a!==b&&b!==c&&a!==c)indices.push(a,b,c);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normalOut,3));geometry.setIndex(indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return {geometry,stats:{voxel,grid:[nx,ny,nz],samples:total,vertices:positions.length/3,triangles:indices.length/3}};
}
