// Builds the Torso sockets tab's shapes once (the same steps the page used to run on every load) and packs them into
// dist/new-avatar/torso-sockets.bin for the page to load. Run by new-avatar/build.mjs.
import {separatedOriginalBody,pressedPreviewBody,pushShoulderBalls,softenShoulderRims,pushBallsIn,closerHipBalls,limbSockets,elbowKneeSockets,wristAnkleSockets,assembledSockets,cylinderNeck,longerLegs,splitTorsoAtWaist,threePieceTorso} from '../avatar-v2/original-body.js';
import {packTorsoSockets} from './torso-sockets-file.js';

// Shading directions for a shape that has none (the balls): each point's triangles' directions weighted by their
// areas, the same as three.js computeVertexNormals, which the page used for them before.
function withNormals(p){
 if(p.normals)return p;const P=p.positions,I=p.index,N=new Float64Array(P.length);
 for(let t=0;t<I.length;t+=3){const [a,b,c]=[I[t],I[t+1],I[t+2]].map(i=>3*i),u=[0,1,2].map(k=>P[b+k]-P[a+k]),v=[0,1,2].map(k=>P[c+k]-P[a+k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  for(const i of [a,b,c])for(let k=0;k<3;k++)N[i+k]+=n[k];}
 for(let i=0;i<N.length;i+=3){const l=Math.hypot(N[i],N[i+1],N[i+2])||1;N[i]/=l;N[i+1]/=l;N[i+2]/=l;}
 return {...p,normals:Array.from(N)};
}
export function bakeTorsoSockets(){
 const together=pressedPreviewBody('boy'),mix=separatedOriginalBody('boy');
 // Exactly the steps (and owner requests) recorded in docs/HANDOFF.md items 62 to 70.
 const shoulderSoft=softenShoulderRims(pushShoulderBalls('boy',together,{apart:mix}));
 const plainTorso=mix.parts.find(p=>p.name==='torso'),hipsApart=softenShoulderRims(pushShoulderBalls('boy',{...together,parts:together.parts.map(p=>p.name==='torso'?plainTorso:p)},{apart:mix})),hipBalls=mix.parts.filter(p=>p.name==='ball-hip');
 const closerHips=closerHipBalls('boy',undefined,{pressed:together}),hipSockets=softenShoulderRims(pushBallsIn(hipsApart.torso,closerHips.inBalls,closerHips.outBalls));
 const limbs=limbSockets('boy',{apart:mix,hips:closerHips}),elbowsKnees=elbowKneeSockets('boy',{apart:mix,hips:closerHips,limbs}),wristsAnkles=wristAnkleSockets('boy',{apart:mix,hips:closerHips});
 const assembled=assembledSockets({torso:hipSockets.torso,shoulderIn:together.parts.find(p=>p.name==='ball-shoulder'&&p.side==='left'),hipIn:closerHips.inBalls.find(b=>b.side==='left'),limbs,elbowsKnees,wristsAnkles});
 const base=[...hipSockets.parts.slice(0,1),...hipsApart.parts.slice(1),...hipSockets.parts.slice(1)];
 const items={
  'torso-sockets-boy':shoulderSoft.parts,
  'torso-hips-apart':[...hipsApart.parts,...hipBalls],
  'torso-hip-sockets':base,
  'torso-limb-sockets':[...base,...limbs.map(l=>l.part)],
  'torso-elbow-knee-sockets':[...base,...elbowsKnees.map(l=>l.part),...elbowsKnees.map(l=>l.ball)],
  'torso-wrist-ankle-sockets':[...base,...elbowsKnees.map(l=>l.part),...elbowsKnees.map(l=>l.ball),...wristsAnkles.map(l=>l.part)],
  // Then the plain cylinder neck and the head where they sit put together (owner: "add a regular cylinder neck and the head").
  'torso-assembled':[...assembled,cylinderNeck(together),together.parts.find(p=>p.name==='head')]};
 // Side by side: him now, and with longer legs at 6 ft 4 in (owner: "make him 6'4" ... the thighs slightly more ... put him next to our new avatar").
 // The 6 ft 4 in version also gets the smoothed forearm on finer rings (polish list item 1), on it only so the owner can
 // compare: the same steps with a separated body whose forearms are smoothed (the upper arms, elbows and everything
 // else are the same).
 const mixSmooth=separatedOriginalBody('boy',{smoothForearm:true}),wristsSmooth=wristAnkleSockets('boy',{apart:mixSmooth,hips:closerHips});
 const assembledSmooth=[...assembledSockets({torso:hipSockets.torso,shoulderIn:together.parts.find(p=>p.name==='ball-shoulder'&&p.side==='left'),hipIn:closerHips.inBalls.find(b=>b.side==='left'),limbs,elbowsKnees,wristsAnkles:wristsSmooth}),cylinderNeck(together),together.parts.find(p=>p.name==='head')];
 const tall=longerLegs(assembledSmooth);
 // And its torso split at the waist into a chest and a pelvis, only the line showing (owner: "can we not see the ball
 // joint thats supposed to be in the middle just the lines"): at the navel, height divided by the golden ratio.
 let floor=Infinity;for(const p of tall.parts)for(let i=1;i<p.positions.length;i+=3)floor=Math.min(floor,p.positions[i]);
 const waist=splitTorsoAtWaist(tall.parts.find(p=>p.name==='torso'),{y:floor+tall.height/((1+Math.sqrt(5))/2)});
 items['legs-6ft4']=tall.parts.flatMap(p=>p.name==='torso'?[waist.chest,waist.pelvis]:[p]);
 // The base avatar is the 6 ft 4 in one; changes go on a separate avatar beside it, and the 6 ft 1 in one is no longer
 // shown (owner, 23 November 2026: "only ... use now the 6'4" model and keep that as a base ... the torso and the spine
 // ... that's going to be a separate avatar right next to the normal 6'4" one. The 6'1" guy ... delete him").
 // Beside it: the same avatar with a spine, its torso in three pieces (chest, belly, pelvis) on two imaginary balls.
 const ballOf=p=>{const P=p.positions,n=P.length/3,c=[0,0,0];for(let i=0;i<P.length;i++)c[i%3]+=P[i]/n;let r=0;for(let i=0;i<P.length;i+=3)r=Math.max(r,Math.hypot(P[i]-c[0],P[i+1]-c[1],P[i+2]-c[2]));return {centre:c,radius:r};};
 const spine=threePieceTorso(tall.parts.find(p=>p.name==='torso'),{waistY:waist.y,hip:ballOf(tall.parts.find(p=>p.name==='ball-hip'&&p.side==='left'))});
 items['legs-6ft4-spine']=tall.parts.flatMap(p=>p.name==='torso'?[spine.chest,spine.belly,spine.pelvis]:[p]);
 for(const id in items)items[id]=items[id].map(p=>({...withNormals(p),name:p.side==='centre'?p.name:p.name+'.'+p.side}));
 const facts={shoulderDisplaced:shoulderSoft.displaced,shoulderRemoved:shoulderSoft.removed,closerGap:closerHips.gap,hipDisplaced:hipSockets.displaced,
  thighLonger:tall.thighLonger,calfLonger:tall.calfLonger,spineLines:spine.joints.map(j=>j.y),spineBalls:spine.joints.map(j=>j.radius),floor,limbArm:limbs[0].cut.displaced,limbThigh:limbs[2].cut.displaced,ekArm:elbowsKnees[0].cut.displaced,ekThigh:elbowsKnees[2].cut.displaced};
 return packTorsoSockets(items,facts);
}
