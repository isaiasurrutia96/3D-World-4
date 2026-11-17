// Smooth only the small thumb/palm transition after the digit extension.
export function softenThumbRoot(g,side){
 const p=g.attributes.position,idx=g.index.array,weights=new Float32Array(p.count),near=new Map();
 for(let i=0;i<p.count;i++){const x=p.getX(i)*side/.0008+244,y=p.getY(i)/.0008+285;const w=Math.exp(-Math.pow((x-174)/28,2)-Math.pow((y-255)/34,2));if(w>.025){weights[i]=w;near.set(i,new Set());}}
 for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2];if(near.has(a))near.get(a).add(b).add(c);if(near.has(b))near.get(b).add(a).add(c);if(near.has(c))near.get(c).add(a).add(b);}
 const original=p.array.slice();let values=p.array.slice();const adjacency=[...near].map(([i,set])=>[i,[...set]]);
 for(let step=0;step<10;step++){const next=values.slice();for(const [i,list] of adjacency){for(let d=0;d<3;d++){let sum=0;for(const j of list)sum+=values[j*3+d];next[i*3+d]+=.45*weights[i]*(sum/list.length-values[i*3+d]);}}values=next;}
 let max=0;for(const [i] of adjacency){const k=i*3,dx=values[k]-original[k],dy=values[k+1]-original[k+1],dz=values[k+2]-original[k+2],distance=Math.hypot(dx,dy,dz),f=distance>.0015?.0015/distance:1;p.setXYZ(i,original[k]+f*dx,original[k+1]+f*dy,original[k+2]+f*dz);max=Math.max(max,distance*f);}
 g.userData.thumbRootSmoothing=max;return g;
}
