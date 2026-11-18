import * as T from 'three';

// The torso in two pieces (owner's choice, 18 Nov 2026): a chest and a
// pelvis joined by a ball-and-socket waist, in the same style as the
// avatar's other joints, so the chest can turn on the hips (throwing,
// swinging, running). The outer shape stays the approved torso's, except
// for a thin seam at the waist.
//
// How it is made, from the approved torso surface (a lathe: one profile
// turned around the vertical axis):
//   Pelvis: the approved surface up to the waist, a small rounded lip, then
//           a bowl-shaped socket hollowed into its top, with a flat floor
//           well above the hip sockets underneath.
//   Chest:  the approved surface down to just above the lip, a rounded
//           underside, then a ball hanging below it that sits in the bowl
//           with 2 mm of clearance.
// Both bowl and ball are centred on the waist pivot, so turning the chest
// about that point keeps the ball in its socket. Turning (twist) is free;
// leaning is kept very small for now, because the chest's rim meets the
// pelvis rim when it tilts.

/** Waist geometry, in the torso's own space (metres; y up). */
export const WAIST = {
 split: 0.10,      // the pelvis's outer surface ends here
 lip: 0.012,       // radius of the rounded rims on both pieces
 seam: 0.004,      // gap between the pelvis lip and the chest underside
 wall: 0.02,       // pelvis wall thickness at the rim, inside the lip
 depth: 0.04,      // ball centre below the rim
 clearance: 0.002, // between ball and bowl
 floor: -0.02,     // flat floor of the bowl (the hip sockets are below)
 ballCut: 0.02,    // the hidden bottom of the ball is flat here
};

/** Replace the one-piece torso with a chest and a pelvis. Returns the pieces and the waist pivot. */
export function splitTorso(rig){
 const torso=rig.torso.children.find(o=>o.name==='socket-torso');
 if(!torso)throw Error('No one-piece torso to split');
 const g=torso.geometry,P=g.attributes.position;
 // The approved lathe: 161 columns around, 241 points up the profile.
 const COLS=161,ROWS=P.count/COLS;
 if(!Number.isInteger(ROWS))throw Error('Unexpected torso layout');
 const at=(i,j)=>new T.Vector3().fromBufferAttribute(P,i*ROWS+j);
 const profileY=j=>at(0,j).y,radius=j=>Math.hypot(at(0,j).x,at(0,j).z);
 const phi=i=>i/(COLS-1)*Math.PI*2;
 const ring=(r,y)=>Array.from({length:COLS},(_,i)=>new T.Vector3(r*Math.sin(phi(i)),y,r*Math.cos(phi(i))));
 const W=WAIST;

 // ---- Pelvis ----
 let js=0;while(js+1<ROWS&&profileY(js+1)<=W.split)js++;
 const ys=profileY(js),rs=radius(js),yTop=ys+W.lip,rRim=rs-W.lip-W.wall,yc=yTop-W.depth;
 const Rs=Math.hypot(rRim,W.depth),Rb=Rs-W.clearance;
 const pelvisRows=[];
 for(let j=0;j<=js;j++)pelvisRows.push(Array.from({length:COLS},(_,i)=>at(i,j)));
 for(let k=1;k<=8;k++){const a=k/8*Math.PI/2;pelvisRows.push(ring(rs-W.lip+W.lip*Math.cos(a),ys+W.lip*Math.sin(a)));}     // rounded lip
 for(let k=1;k<=3;k++)pelvisRows.push(ring(rs-W.lip-(rs-W.lip-rRim)*k/3,yTop));                                            // top of the rim
 // The bowl: a sphere around the waist pivot, from the rim down to the flat floor.
 const aRim=Math.acos(W.depth/Rs),aFloor=Math.acos((W.floor-yc)/Rs),rFloor=Rs*Math.sin(aFloor);
 for(let k=1;k<=12;k++){const a=aRim+(aFloor-aRim)*k/12;pelvisRows.push(ring(Rs*Math.sin(a),yc+Rs*Math.cos(a)));}
 for(let k=1;k<=4;k++)pelvisRows.push(ring(rFloor*(1-k/4),W.floor));                                                       // flat floor
 // ---- Chest ----
 const yu=yTop+W.seam;let jc=js;while(jc<ROWS-1&&profileY(jc)<yu+W.lip)jc++;
 const yc0=profileY(jc),rc0=radius(jc),L2=yc0-yu;
 // The ball: a sphere around the waist pivot, from its hidden flat bottom up to the underside.
 const bCut=Math.acos((W.ballCut-yc)/Rb),bTop=Math.acos((yu-yc)/Rb),rCut=Rb*Math.sin(bCut),rTopBall=Rb*Math.sin(bTop);
 const chestRows=[];
 for(let k=0;k<=4;k++)chestRows.push(ring(rCut*k/4,W.ballCut));
 for(let k=1;k<=14;k++){const b=bCut+(bTop-bCut)*k/14;chestRows.push(ring(Rb*Math.sin(b),yc+Rb*Math.cos(b)));}
 for(let k=1;k<=3;k++)chestRows.push(ring(rTopBall+(rc0-L2-rTopBall)*k/3,yu));                                              // underside
 for(let k=1;k<=7;k++){const a=-Math.PI/2+k/8*Math.PI/2;chestRows.push(ring(rc0-L2+L2*Math.cos(a),yu+L2+L2*Math.sin(a)));} // rounded rim
 for(let j=jc;j<ROWS;j++)chestRows.push(Array.from({length:COLS},(_,i)=>at(i,j)));

 const pelvis=new T.Mesh(gridGeometry(pelvisRows),torso.material),chest=new T.Mesh(gridGeometry(chestRows),torso.material);
 pelvis.name='pelvis';chest.name='chest';
 for(const m of [pelvis,chest]){m.position.copy(torso.position);m.quaternion.copy(torso.quaternion);m.scale.copy(torso.scale);m.castShadow=torso.castShadow;m.receiveShadow=torso.receiveShadow;}
 const parent=torso.parent;parent.add(pelvis,chest);torso.removeFromParent();g.dispose();
 return {pelvis,chest,pivotLocal:new T.Vector3(0,yc,0),ballRadius:Rb,socketRadius:Rs};
}

/** A closed lathe-style surface from rows of points (bottom to top), columns around. */
function gridGeometry(rows){
 const R=rows.length,C=rows[0].length,pos=new Float32Array(R*C*3),index=[];
 for(let i=0;i<C;i++)for(let j=0;j<R;j++)rows[j][i].toArray(pos,(i*R+j)*3);
 for(let i=0;i<C-1;i++)for(let j=0;j<R-1;j++){const a=i*R+j,b=(i+1)*R+j,c=b+1,d=a+1;index.push(a,b,d,c,d,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();
 // The first and last columns are the same seam: share their normals.
 const n=g.attributes.normal;
 for(let j=0;j<R;j++){const a=j,b=(C-1)*R+j,v=new T.Vector3().fromBufferAttribute(n,a).add(new T.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);}
 g.computeBoundingBox();g.computeBoundingSphere();return g;
}
