// Sample the actual original foot, including its asymmetric dome. Smooth
// source normals give the tangent of that rounded surface at the contact.
export function originalSurface(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,index=geometry.index.array,grid=new Map(),cell=.015;
 for(let i=0;i<index.length;i+=3){
  const ids=Array.from(index.slice(i,i+3)),v=ids.map(j=>[p.getX(j),p.getY(j),p.getZ(j)]),[a,b,c]=v;
  const det=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);if(Math.abs(det)<1e-13)continue;
  const face={ids,v,det};
  for(let x=Math.floor(Math.min(a[0],b[0],c[0])/cell);x<=Math.floor(Math.max(a[0],b[0],c[0])/cell);x++)for(let z=Math.floor(Math.min(a[2],b[2],c[2])/cell);z<=Math.floor(Math.max(a[2],b[2],c[2])/cell);z++){
   const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(face);
  }
 }
 return (x,z)=>{
  let height=-Infinity,nx=0,ny=0,nz=0;
  for(const {ids,v:[a,b,c],det} of grid.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[]){
   const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/det;
   const v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/det,w=1-u-v;
   if(Math.min(u,v,w)<-1e-7)continue;
   const y=u*a[1]+v*b[1]+w*c[1];if(y<=height)continue;height=y;
   nx=u*n.getX(ids[0])+v*n.getX(ids[1])+w*n.getX(ids[2]);
   ny=u*n.getY(ids[0])+v*n.getY(ids[1])+w*n.getY(ids[2]);
   nz=u*n.getZ(ids[0])+v*n.getZ(ids[1])+w*n.getZ(ids[2]);
  }
  return Number.isFinite(height)?{height,nx,ny,nz}:null;
 };
}

// A rolling-circle fillet: its center stays one fillet radius below the outer
// foot and exactly (ball radius + fillet radius) from the ankle-ball center.
// Its upper arc therefore joins both surfaces tangentially, like a cube bevel.
export function createSocketRoundover(geometry,mold,sample=originalSurface(geometry),anchorCount=256){
 if(!Number.isInteger(anchorCount)||anchorCount<8||anchorCount%8)throw Error('Rounded rim anchors must be a positive multiple of eight');
 const f=mold.filletRadius,R=mold.ballRadius,cy=mold.center[1],cache=new Map();let anchors=null;
 function profileAt(theta){
  theta=((theta%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
  if(cache.has(theta))return cache.get(theta);
  const dx=Math.cos(theta),dz=Math.sin(theta);
  function contact(r){
   const s=sample(mold.center[0]+dx*r,mold.center[2]+dz*r);if(!s||s.ny<=1e-6)return null;
   const slope=-(s.nx*dx+s.nz*dz)/s.ny,scale=Math.hypot(1,slope);
   const centerR=r+f*slope/scale,centerY=s.height-f/scale;
   return {outerR:r,outerY:s.height,slope,centerR,centerY,error:Math.hypot(centerR,centerY-cy)-(R+f)};
  }
  let lo=0,hi=.04,p;
  if(anchors){
   const u=theta/(Math.PI*2)*anchors.length,i=Math.floor(u),t=u-i;
   const guess=anchors[i%anchors.length].outerR*(1-t)+anchors[(i+1)%anchors.length].outerR*t;
   lo=guess-.002;hi=guess+.002;
  }
  p=contact(hi);
  while(p&&p.error<0&&hi<.155){lo=hi;hi+=.002;p=contact(hi);}
  if(!p||p.error<0)throw Error('Rounded socket edge does not fit inside the foot');
  let left=contact(lo);if(!left||left.error>0){lo=0;left=contact(0);}
  let right=p;
  for(let i=0;i<32;i++){
   const fraction=left.error/(left.error-right.error);
   const mid=lo+(hi-lo)*Math.max(.05,Math.min(.95,fraction)),q=contact(mid);if(!q)throw Error('Rounded socket edge left the foot');
   p=q;if(Math.abs(q.error)<1e-11)break;
   if(q.error>0){hi=mid;right=q;}else{lo=mid;left=q;}
  }
  if(Math.abs(p.error)>1e-8)throw Error('Rounded rim did not converge');
  const innerR=p.centerR*R/(R+f),innerY=cy+(p.centerY-cy)*R/(R+f);
  if(p.centerY>=cy||innerR>=p.outerR)throw Error('Rounded rim needs a different ball seat');
  const profile={...p,innerR,innerY,theta};cache.set(theta,profile);return profile;
 }
 function surfaceAt(r,profile){
  if(r<=profile.innerR)return cy-Math.sqrt(R*R-r*r);
  if(r>=profile.outerR)return null;
  return profile.centerY+Math.sqrt(Math.max(0,f*f-(r-profile.centerR)**2));
 }
 // Cardinal and diagonal sections are also exposed for geometric verification.
 anchors=Array.from({length:anchorCount},(_,i)=>profileAt(i*Math.PI*2/anchorCount));
 const sections=anchors.filter((_,i)=>i%(anchorCount/8)===0);
 return {profileAt,surfaceAt,sections};
}
