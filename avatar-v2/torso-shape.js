// New avatar (version 2): the torso as one continuous shape defined by numbers.
//
// The shape is a stack of horizontal rings, bottom to top. Each ring has a
// height and one radius per direction around the body (direction 0 points to
// the avatar's left, +x, then turns toward the front, +z). A rounded cap closes
// the bottom and the top. Changing the numbers changes the torso; there is no
// separate mesh to keep in step. Used by the builder (fit-torso.mjs) and by the
// New avatar page, so both always draw the same shape.

/** Direction (x, z) for segment s of n around the body. */
export function direction(s,n){const a=s/n*Math.PI*2;return [Math.cos(a),Math.sin(a)];}

/**
 * Builds the torso surface.
 * shape: {center:[x,z], segments, rings:[{y, r:[radius per segment]}] (bottom
 * to top), bottom:{y}, top:{y}, capRings}
 * Returns {positions, index} (plain arrays). Every ring shares its vertices
 * with its neighbours, so the surface has no seams or gaps.
 */
export function buildTorsoSurface(shape){
 const {center:[cx,cz],segments:n,rings,bottom,top}=shape,caps=shape.capRings??4;
 if(rings.length<2)throw Error('A torso needs at least two rings');
 for(const ring of rings)if(ring.r.length!==n)throw Error('Each ring needs '+n+' radii');
 for(let i=1;i<rings.length;i++)if(!(rings[i].y>rings[i-1].y))throw Error('Rings must go upward');
 if(!(bottom.y<rings[0].y&&top.y>rings.at(-1).y))throw Error('Caps must lie beyond the end rings');
 // Cap rings: a quarter ellipse from the end ring to the pole, so the ends are
 // rounded instead of flat.
 const capRings=(end,pole,count)=>Array.from({length:count},(_,k)=>{
  const t=(k+1)/(count+1),angle=t*Math.PI/2;
  return {y:end.y+(pole.y-end.y)*Math.sin(angle),r:end.r.map(r=>r*Math.cos(angle))};
 });
 const all=[...capRings(rings[0],bottom,caps).reverse(),...rings,...capRings(rings.at(-1),top,caps)];
 const positions=[],index=[];
 positions.push(cx,bottom.y,cz);// vertex 0: bottom pole
 for(const ring of all)for(let s=0;s<n;s++){const [dx,dz]=direction(s,n);positions.push(cx+dx*ring.r[s],ring.y,cz+dz*ring.r[s]);}
 const topPole=positions.length/3;positions.push(cx,top.y,cz);
 const at=(ring,s)=>1+ring*n+(s%n);
 // Winding gives outward-facing triangles (counter-clockwise seen from outside).
 for(let s=0;s<n;s++)index.push(0,at(0,s),at(0,s+1));
 for(let ring=0;ring<all.length-1;ring++)for(let s=0;s<n;s++){
  const a=at(ring,s),b=at(ring,s+1),c=at(ring+1,s),d=at(ring+1,s+1);
  index.push(a,d,b,a,c,d);
 }
 const last=all.length-1;
 for(let s=0;s<n;s++)index.push(topPole,at(last,s+1),at(last,s));
 return {positions,index};
}

/**
 * The same builder under a general name: any smooth shape made of stacked
 * rings with rounded caps (the torso, the limbs). Kept as one function so a
 * fix to it fixes every part.
 */
export const buildRingSurface=buildTorsoSurface;
