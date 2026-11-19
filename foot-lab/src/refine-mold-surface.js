import * as T from 'three';

// Conforming local refinement: split shared edges once, then retriangulate
// their incident faces. Original vertices remain an exact prefix; no T seams.
export function refineMoldSurface(geometry,cx,cz){
 const p=geometry.attributes.position,vertices=Array.from(p.array);let faces=Array.from(geometry.index.array);
 const key=(a,b)=>a<b?a+','+b:b+','+a;
 for(let pass=0;pass<3;pass++){
  const splits=new Map();
  for(let i=0;i<faces.length;i+=3)for(let j=0;j<3;j++){
   const a=faces[i+j],b=faces[i+(j+1)%3],id=key(a,b);if(splits.has(id))continue;
   const x=(vertices[a*3]+vertices[b*3])/2,y=(vertices[a*3+1]+vertices[b*3+1])/2,z=(vertices[a*3+2]+vertices[b*3+2])/2;
   if(y<.10||Math.hypot(x-cx,z-cz)>.14)continue;
   if(Math.hypot(vertices[a*3]-vertices[b*3],vertices[a*3+2]-vertices[b*3+2])<=.002)continue;
   splits.set(id,vertices.length/3);vertices.push(x,y,z);
  }
  if(!splits.size)break;
  const next=[];
  for(let i=0;i<faces.length;i+=3){
   const [a,b,c]=faces.slice(i,i+3),ab=splits.get(key(a,b)),bc=splits.get(key(b,c)),ca=splits.get(key(c,a));
   const count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);
   if(count===0)next.push(a,b,c);
   else if(count===3)next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
   else if(count===1){if(ab!==undefined)next.push(a,ab,c,ab,b,c);else if(bc!==undefined)next.push(b,bc,a,bc,c,a);else next.push(c,ca,b,ca,a,b);}
   else if(ca===undefined)next.push(b,bc,ab,a,ab,c,ab,bc,c);
   else if(ab===undefined)next.push(c,ca,bc,b,bc,a,bc,ca,a);
   else next.push(a,ab,ca,c,ca,b,ca,ab,b);
  }
  faces=next;
 }
 p.copy(new T.Float32BufferAttribute(vertices,3));geometry.setIndex(faces);
 geometry.deleteAttribute('normal');geometry.computeVertexNormals();
}
