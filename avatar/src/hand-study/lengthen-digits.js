// Extend along the existing digit directions, with a smooth stationary root.
export function lengthenDigits(geometry,side){
 const axes=[
  [225,199,260,79,46],[300,214,353,92,46],
  [350,242,410,154,43],[371,287,438,249,37],
  [162,267,131,190,45],
 ].map(([x,y,tx,ty,r])=>{const length=Math.hypot(tx-x,ty-y);return{x,y,ux:(tx-x)/length,uy:(ty-y)/length,length,r};});
 const p=geometry.attributes.position,before=p.array.slice();let changed=0;
 const byDigit=[0,0,0,0,0];
 for(let i=0;i<p.count;i++){
  const px=p.getX(i)*side/.0008+244,py=p.getY(i)/.0008+285;
  if(py>=300)continue;
  let weightSum=0,dx=0,dy=0,best=-1,bestWeight=0;
  for(let j=0;j<axes.length;j++){
   const a=axes[j],t=(px-a.x)*a.ux+(py-a.y)*a.uy,q=Math.max(0,Math.min(a.length,t));
   const score=((px-a.x-q*a.ux)**2+(py-a.y-q*a.uy)**2)/(a.r*a.r),weight=Math.exp(-8*score);
   const positive=Math.max(0,t),extension=(j===4?.30:.22)*positive*positive/(positive+18);
   dx+=weight*a.ux*extension;dy+=weight*a.uy*extension;weightSum+=weight;
   if(weight>bestWeight&&t>0){bestWeight=weight;best=j;}
  }
  if(weightSum<1e-8)continue;
  dx/=weightSum;dy/=weightSum;
  if(Math.hypot(dx,dy)<1e-7)continue;
  p.setX(i,p.getX(i)+dx*.0008*side);p.setY(i,p.getY(i)+dy*.0008);
  changed++;if(best>=0)byDigit[best]++;
 }
 let palmMovement=0;for(let i=0;i<p.count;i++){if(before[i*3+1]/.0008+285>=300)palmMovement=Math.max(palmMovement,Math.hypot(p.getX(i)-before[i*3],p.getY(i)-before[i*3+1],p.getZ(i)-before[i*3+2]));}
 geometry.userData.lengtheningAffectedVertices=changed;geometry.userData.changedByDigit=byDigit;geometry.userData.palmDisplacement=palmMovement;
 return geometry;
}
