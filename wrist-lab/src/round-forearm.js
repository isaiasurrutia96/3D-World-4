import * as T from 'three';

// The accepted forearm's authored cylinder begins at y=-55 mm. Keep that
// cylinder and elbow cap exactly; replace only the older wrist recess.
export const FOREARM_JOIN_Y=-.055;

export function roundForearmEnd(forearm){
 const source=forearm.geometry,p=source.attributes.position,n=source.attributes.normal,index=source.index.array;
 source.computeBoundingBox();const bottom=source.boundingBox.min.y,join=FOREARM_JOIN_Y,height=join-bottom;
 if(height<=0)throw Error('Forearm end has no room for its rounded cap');
 const faces=[],used=new Set();
 for(let i=0;i<index.length;i+=3){const face=Array.from(index.slice(i,i+3));if(face.every(j=>p.getY(j)>=join-1e-7)){faces.push(...face);for(const j of face)used.add(j);}}
 const originalIds=[...used].sort((a,b)=>a-b),map=new Map(originalIds.map((id,i)=>[id,i])),positions=[],normals=[];
 for(const id of originalIds){positions.push(p.getX(id),p.getY(id),p.getZ(id));normals.push(n.getX(id),n.getY(id),n.getZ(id));}
 const upperFaces=faces.map(id=>map.get(id)),rim=originalIds.filter(id=>Math.abs(p.getY(id)-join)<1e-7),segments=rim.length;
 if(segments!==128)throw Error('The accepted forearm shaft ring changed');
 const rx=Math.max(...rim.map(i=>Math.abs(p.getX(i)))),rz=Math.max(...rim.map(i=>Math.abs(p.getZ(i))));
 const joinIds=Array(segments);
 for(const id of rim){const angle=(Math.atan2(p.getX(id)/rx,p.getZ(id)/rz)+2*Math.PI)%(2*Math.PI),j=Math.round(angle/(2*Math.PI)*segments)%segments;joinIds[j]=map.get(id);}
 if(joinIds.filter(Number.isInteger).length!==segments)throw Error('Incomplete original forearm shaft ring');
 const pole=positions.length/3;positions.push(0,bottom,0);normals.push(0,-1,0);
 const rings=[];
 for(let k=1;k<48;k++){
  const angle=k/48*Math.PI/2,ring=[];
  for(let j=0;j<segments;j++){
   const phi=j/segments*2*Math.PI,x=rx*Math.sin(angle)*Math.sin(phi),z=rz*Math.sin(angle)*Math.cos(phi),y=join-height*Math.cos(angle);
   const nx=x/(rx*rx),ny=(y-join)/(height*height),nz=z/(rz*rz),length=Math.hypot(nx,ny,nz);
   ring.push(positions.length/3);positions.push(x,y,z);normals.push(nx/length,ny/length,nz/length);
  }
  rings.push(ring);
 }
 rings.push(joinIds);const next=upperFaces;
 for(let j=0;j<segments;j++)next.push(pole,rings[0][(j+1)%segments],rings[0][j]);
 for(let k=0;k<rings.length-1;k++)for(let j=0;j<segments;j++){
  const a=rings[k][j],b=rings[k][(j+1)%segments],c=rings[k+1][j],d=rings[k+1][(j+1)%segments];next.push(a,b,c,b,d,c);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(next);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.roundedEnd={bottom,join,height,rx,rz,pole,sourceUpperIds:originalIds,upperCount:originalIds.length};
 forearm.geometry=geometry;source.dispose();return forearm;
}
