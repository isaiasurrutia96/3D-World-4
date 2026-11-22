// New avatar (version 2): the complete avatar, every joint pressed together the
// same way as the approved shoulders (owner, 22 November 2026): the joint ball is
// hard, the parts around it are clay, and they are pressed toward each other so
// the ball leaves a snug socket with soft edges in each part. One general joint
// step does every joint; hinges (elbows, knees) and two-way joints (wrists,
// ankles) then get room to bend with the doll-maker's flat inner faces, sized by
// the skeleton's own bend limits and checked degree by degree.
//
// Methods (each chosen by comparing the alternatives, see the notes):
//  - How deep a ball sits: a ray from the ball's centre straight into the part
//    (Möller–Trumbore ray–triangle test) gives the exact distance to the part's
//    surface on the actual mesh, so the move that gives the wanted depth is a
//    single subtraction. (Alternatives: a search over positions, which only
//    approximates; or a formula for one shape, which does not work for the
//    hand, foot or torso.)
//  - What moves: a joint presses its ball toward the part above, and everything
//    below the ball follows, then the part below presses up onto the ball (a
//    chain, like the bones of a skeleton), so no gap opens anywhere else.
//  - The sockets themselves: sockets.js (refine near the ball, press, round the
//    edge, keep a thin layer over the ball where a part would fold).
//  - Room to bend: sockets.js flattenForBend, exact for a hinge around the
//    ball's centre (the faces meet only at the deepest bend).
import {makeSocket,stamp,pointNormals,flattenForBend,rotateAbout,closestBetween,refineNear,shoulderSocketPreview,mirrorPart,softEdge,SOCKET_GAP,SOCKET_EDGE,SOCKET_SKIN,
 TORSO_SOCKET_DEPTH} from './sockets.js';

const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>scale(a,1/Math.hypot(...a));

/** How deep each ball sits in the limb, hand or foot below or above it (share of its radius; owner: "more in"). */
export const LIMB_SOCKET_DEPTH=.5;
/** Clay kept over the ball where a limb's wall faces away from it (share of its radius). Measured: a layer of 0.25 changed the rims by only 2° but flared the limb ends outward like barrels, changing the approved limbs, so none. */
export const LIMB_SKIN=0;
/** Smallest soft edge for the new limb sockets (metres); the approved shoulders keep theirs. Measured sharpest rim: 3 cm 54°, 4 cm 52°, 5 cm 46° (the foot 64° to 44°). */
export const LIMB_SOFT=.05;

/** How deep the neck ball sits in the head (share of its radius). */
export const HEAD_SOCKET_DEPTH=.5;
/** Radius of the rounded rim where the neck socket meets the torso's top, as a multiple of the soft edge. */
export const NECK_FILLET=1.5;
/** Deepest bends the shaped inner faces allow (degrees). The skeleton allows 150° at the elbow and knee; 120° keeps the flat faces small (owner saw 120° at the elbow). */
export const ELBOW_BEND=120,KNEE_BEND=120;
/** How far forward the thigh must swing cleanly, with shaped faces (0: no shaping). Plain hip sockets swing cleanly to about 82° (walking, running, most driving poses). Shaping for 100° measured: half-and-half cut 6.4 cm into the approved belly; giving the thigh 85% flattened most of its front. Left for the owner to decide. */
export const HIP_BEND=0;
/** Share of the hip's bend room given to the torso's face (the rest to the thigh's). Measured at 100°: a half cut 6.4 cm into the approved torso's belly; 0.85 cuts 3 mm and the thigh takes the flat face (clean to 108°). */
export const HIP_TORSO_SHARE=.85;

/**
 * Distance along a ray to the first triangle it hits (Möller–Trumbore), or
 * Infinity. Both sides of a triangle count, so it works from inside or outside.
 */
export function rayHit({positions:P,index:I},origin,dir){
 let best=Infinity;
 for(let t=0;t<I.length;t+=3){
  const a=3*I[t],b=3*I[t+1],c=3*I[t+2];
  const e1=[P[b]-P[a],P[b+1]-P[a+1],P[b+2]-P[a+2]],e2=[P[c]-P[a],P[c+1]-P[a+1],P[c+2]-P[a+2]],h=cross(dir,e2),det=dot(e1,h);
  if(Math.abs(det)<1e-14)continue;
  const f=1/det,s=[origin[0]-P[a],origin[1]-P[a+1],origin[2]-P[a+2]],u=f*dot(s,h);if(u<0||u>1)continue;
  const q=cross(s,e1),v=f*dot(dir,q);if(v<0||u+v>1)continue;
  const d=f*dot(e2,q);if(d>1e-12&&d<best)best=d;
 }
 return best;
}

/** A part moved by v (its points and any centre, top or pivot it carries). */
export function moved(part,v){
 const out={...part,positions:part.positions.map((x,i)=>x+v[i%3])};
 for(const key of ['centre','top','pivot'])if(part[key])out[key]=add(part[key],v);
 return out;
}

/**
 * One joint pressed together, the shoulder way.
 *  near: the part above the ball (already final; stays put).
 *  ball: {centre, radius, positions, index}.
 *  chain: the parts below the ball, the first one is pressed, the rest follow it.
 *  into: unit direction from the ball into `near`; along: unit direction from
 *  the ball toward chain[0].
 *  moveBall: false keeps the ball where it is (the neck ball, approved in place).
 *  nearStamp: the ball's centre lies on the part above, so its socket is stamped straight in.
 * Returns the pressed near part, the moved ball, the moved and pressed chain,
 * and how far each moved.
 */
export function pressJoint({near,ball,chain,into,along,depthNear,depthFar,nearSkin=0,farSkin=0,moveBall=true,nearStamp=false,softMin=0,shape=null}){
 const r=ball.radius,R=r+SOCKET_GAP,soft=Math.max(softEdge(r),softMin);
 // 1. The ball moves along `into` until its leading side is depthNear inside `near`: one subtraction on the exact hit distance.
 let ballMove=0;
 if(moveBall){const hit=rayHit(near,ball.centre,into);if(!isFinite(hit))throw Error(`${ball.name}: no surface found toward the part above`);ballMove=hit-(r-depthNear);}
 const v1=scale(into,ballMove),b=moved(ball,v1);let rest=chain.map(p=>moved(p,v1));
 // 2. The part below (and everything under it) moves toward the ball until the ball sits depthFar inside it.
 const back=scale(along,-1),hitFar=rayHit(rest[0],b.centre,along);if(!isFinite(hitFar))throw Error(`${chain[0].name}: no surface found below the ball`);
 const farMove=hitFar-(r-depthFar),v2=scale(back,farMove);rest=rest.map(p=>moved(p,v2));
 // 3. Room to bend first (flat inner faces), so the sockets pressed next round their rims against those faces:
 // the socket's soft edge is the last thing shaped, and no corner is left where the two meet.
 let nearShaped=near,restBend=NaN,halfNear=NaN;
 // The clay layer decides 'facing the ball or away' from the surface as it was before any cutting, so the
 // flat faces cut next do not confuse it: the directions are taken now and carried through the shaping.
 if(shape&&nearSkin&&!near.normals)near={...near,normals:pointNormals(near)};
 if(shape&&farSkin&&!rest[0].normals)rest[0]={...rest[0],normals:pointNormals(rest[0])};
 if(shape){const s=shape(near,rest[0],b.centre,R,soft);nearShaped=s.near;rest[0]=s.far;restBend=s.restBend;halfNear=s.halfNear;}
 near=nearShaped;
 // 4. The sockets: each part takes the ball's shape with the gap and soft edges.
 const keep=p=>({...p});
 // A ball whose centre lies on the part above (nearStamp) is stamped straight in along `into` instead (see sockets.js stamp).
 const nearOut=nearStamp?{...keep(near),...stamp(refineNear(near,b.centre,R+2*NECK_FILLET*soft+SOCKET_EDGE,SOCKET_EDGE),b.centre,into,R,NECK_FILLET*soft)}
  :{...keep(near),...makeSocket(near,b.centre,R,soft,SOCKET_EDGE,nearSkin*r)};
 rest[0]={...rest[0],...makeSocket(rest[0],b.centre,R,soft,SOCKET_EDGE,farSkin*r)};
 return {near:nearOut,ball:b,chain:rest,ballMove,farMove,R,soft,restBend,halfNear};
}

/**
 * Puts back onto the socket any point closer to the ball's centre than R
 * (straight out from the centre). Splitting triangles inside a finished socket
 * puts new points on straight edges, a fraction of a millimetre inside the
 * round cup; this restores them. Points at or beyond R do not move.
 */
export function keepOutside(part,centre,R){
 const P=[...part.positions];
 for(let i=0;i<P.length;i+=3){const d=[P[i]-centre[0],P[i+1]-centre[1],P[i+2]-centre[2]],l=Math.hypot(...d);
  if(l<R&&l>0)for(let k=0;k<3;k++)P[i+k]=centre[k]+d[k]/l*R;}
 return {...part,positions:P};
}

/**
 * Room for a joint that folds about `axis` through the ball's centre: the part
 * above and the part below get flat inner faces on the `fold` side, for the
 * deepest bend `bend` (degrees), counting any bend the joint already rests in.
 * Used before the joint's sockets are pressed, so the sockets' soft edges round
 * off where they meet these faces.
 *  nearLine: unit direction from the joint along the part above; farLine: along the part below.
 */
export function shapeForBend(near,far,centre,axis,nearLine,farLine,fold,bend,soft,R,nearWidth=Infinity,nearShare=.5){
 const flat=d=>unit(sub(d,scale(axis,dot(d,axis))));
 const restBend=180-Math.acos(Math.max(-1,Math.min(1,dot(flat(nearLine),flat(farLine)))))*180/Math.PI;
 // The two faces' angles add up to the room left at the deepest bend; `nearShare` of it goes to the part above
 // (more for the part above means a smaller face on it: the torso keeps its approved shape, the limb gives way).
 const room=(180-restBend-bend)*Math.PI/180,halfNear=room*nearShare,halfFar=room-halfNear;
 if(!(halfNear>0&&halfFar>0))throw Error('bend too deep for a flat face');
 // Fine sampling only as far as the face actually reaches: a trial flattening of the part as it is shows which
 // points move, and the finely sampled area ends a few triangles past the farthest of them (a fixed estimate
 // reached from the elbow all the way down to the wrist and clashed with the wrist's socket).
 const fine=(m,half,line,f)=>{const trial=flattenForBend(m,centre,axis,line,f,half,SOCKET_GAP,soft,0);let far=0;
  for(let i=0;i<m.positions.length;i+=3)if(trial.positions[i]!==m.positions[i]||trial.positions[i+1]!==m.positions[i+1]||trial.positions[i+2]!==m.positions[i+2])
   far=Math.max(far,Math.hypot(m.positions[i]-centre[0],m.positions[i+1]-centre[1],m.positions[i+2]-centre[2]));
  return refineNear(m,centre,far+3*.016,.016);};
 const foldNear=flat(sub(fold,scale(nearLine,dot(fold,nearLine)))),foldFar=flat(sub(fold,scale(farLine,dot(fold,farLine))));
 // Shaped before the sockets are pressed (the press then sets every point near the ball), so no ball clearance here (0).
 return {near:{...near,...flattenForBend(fine(near,halfNear,nearLine,foldNear),centre,axis,nearLine,foldNear,halfNear,SOCKET_GAP,soft,0,nearWidth)},
  far:{...far,...flattenForBend(fine(far,halfFar,farLine,foldFar),centre,axis,farLine,foldFar,halfFar,SOCKET_GAP,soft,0)},restBend,halfNear};
}

/**
 * Closest distance between two groups of points while the lower group turns by
 * `degrees` about `axis` through `pivot` (sign: which way the joint folds).
 */
export function clearanceAt(fixedPositions,movingPositions,pivot,axis,degrees){
 return closestBetween(rotateAbout(movingPositions,pivot,axis,degrees*Math.PI/180),fixedPositions);
}

/** How far the thigh reaches sideways from the hip ball's centre (along the hinge line): the width the torso must give way over. */
const thighReach=(thigh,c)=>{let w=0;for(let i=0;i<thigh.positions.length;i+=3)w=Math.max(w,Math.abs(thigh.positions[i]-c[0]));return w;};

/** The hinge axis of the elbows and knees, and of the wrists' and ankles' main bend (skeleton: all bend about the body's x axis). */
export const HINGE=[1,0,0];
const FRONT=[0,0,1],BACK=[0,0,-1],UP=[0,1,0];
const mirrorPoint=p=>[-p[0],p[1],p[2]];

/**
 * The complete avatar: every approved piece of the full body, with every joint
 * pressed into snug sockets the shoulder way. Order, top down so each part
 * above a joint is final before the joint is made:
 *  1. shoulders: exactly the approved shoulder sockets (torso, balls, upper arms);
 *  2. neck: the ball stays where it was approved; the torso and the head take sockets;
 *  3. elbows, then wrists, along each arm;
 *  4. hips (into the torso, like the shoulders), then knees, then ankles.
 * The right side is the exact mirror of the left. Returns the parts and, for
 * each joint, its centre, ball size and how far the pieces moved.
 */
const bodyCache=new Map();
/** Built once per body and option set, then reused (treat the result as read-only). */
export function socketedBody(bodyId='boy',options={}){
 const key=bodyId+JSON.stringify(options);
 if(!bodyCache.has(key))bodyCache.set(key,buildSocketedBody(bodyId,options));
 return bodyCache.get(key);
}
/** shapeBends: false leaves out the shaped inner faces (only for the checks, to prove they are needed). */
function buildSocketedBody(bodyId,{shapeBends=true,limbSoft=LIMB_SOFT}={}){
 const sh=shoulderSocketPreview(bodyId),f=sh.full,L=n=>f.parts.find(p=>p.name===n&&p.side==='left'),C=n=>f.parts.find(p=>p.name===n&&p.side==='centre');
 const joints={};
 // 1. Shoulders (approved): torso, shoulder balls, upper arms.
 let torso={name:'torso',side:'centre',...sh.parts.find(p=>p.name==='torso')};
 let upper=sh.parts.find(p=>p.name==='upper-arm'&&p.side==='left');const shoulderBall=sh.parts.find(p=>p.name==='ball-shoulder'&&p.side==='left');
 joints.shoulder={centre:shoulderBall.centre,radius:shoulderBall.radius,moved:sh.inward};
 // 2. Neck: the torso and the head press onto the neck ball (which stays in place).
 let j=pressJoint({near:torso,ball:C('ball-neck'),chain:[C('head')],into:scale(UP,-1),along:UP,depthNear:0,depthFar:HEAD_SOCKET_DEPTH*C('ball-neck').radius,moveBall:false,nearStamp:true,farSkin:LIMB_SKIN});
 torso=j.near;const neckBall=j.ball,head=j.chain[0];joints.neck={centre:neckBall.centre,radius:neckBall.radius,headMoved:j.farMove};
 // 3. Arm: the rest of the arm first follows the upper arm's move from the shoulder socket.
 let [elbowBall,forearm,wristBall,hand]=['ball-elbow','forearm','ball-wrist','hand'].map(n=>moved(L(n),sh.armShift));
 const dU=upper.direction,dF=forearm.direction,depth=r=>LIMB_SOCKET_DEPTH*r;
 j=pressJoint({near:upper,ball:elbowBall,chain:[forearm,wristBall,hand],into:scale(dU,-1),along:dF,depthNear:depth(elbowBall.radius),depthFar:depth(elbowBall.radius),nearSkin:LIMB_SKIN,farSkin:LIMB_SKIN,
  shape:shapeBends?(n,f,c,R,soft)=>shapeForBend(n,f,c,HINGE,scale(dU,-1),dF,FRONT,ELBOW_BEND,soft,R):null,softMin:limbSoft});
 upper=j.near;elbowBall=j.ball;[forearm,wristBall,hand]=j.chain;
 joints.elbow={centre:elbowBall.centre,radius:elbowBall.radius,ballMoved:j.ballMove,limbMoved:j.farMove,restBend:j.restBend,bend:ELBOW_BEND,fold:FRONT};
 j=pressJoint({near:forearm,ball:wristBall,chain:[hand],into:scale(dF,-1),along:dF,depthNear:depth(wristBall.radius),depthFar:depth(wristBall.radius),nearSkin:LIMB_SKIN,softMin:limbSoft});
 forearm=j.near;wristBall=j.ball;hand=j.chain[0];joints.wrist={centre:wristBall.centre,radius:wristBall.radius,ballMoved:j.ballMove,limbMoved:j.farMove};
 // 4. Leg: hip ball up into the torso (like the shoulders), then knee and ankle down the leg.
 let [hipBall,thigh,kneeBall,calf,ankleBall,foot]=['ball-hip','thigh','ball-knee','calf','ball-ankle','foot'].map(L);
 const dT=thigh.direction,dC=calf.direction;
 // Room to swing the thigh forward (sitting, driving; plain hip sockets let it touch the torso at 82°), shaped
 // before the sockets: the torso's flat faces for both hips (the right one mirrored) and the thigh's.
 const hipShape=(n,f,c,R,soft)=>{const width=thighReach(f,c),sh=shapeForBend(n,f,c,HINGE,UP,dT,FRONT,HIP_BEND,soft,R,width,HIP_TORSO_SHARE),c2=mirrorPoint(c);
  const reach=R*1.25/Math.tan(sh.halfNear)+soft;
  return {...sh,near:{...sh.near,...flattenForBend(refineNear(sh.near,c2,reach,.016),c2,HINGE,UP,FRONT,sh.halfNear,SOCKET_GAP,soft,0,width)}};};
 j=pressJoint({near:torso,ball:hipBall,chain:[thigh,kneeBall,calf,ankleBall,foot],into:UP,along:dT,depthNear:TORSO_SOCKET_DEPTH*hipBall.radius,depthFar:depth(hipBall.radius),
  nearSkin:SOCKET_SKIN,farSkin:LIMB_SKIN,shape:shapeBends&&HIP_BEND?hipShape:null,softMin:limbSoft});
 hipBall=j.ball;[thigh,kneeBall,calf,ankleBall,foot]=j.chain;
 // The torso's other hip socket: the mirror image of the first.
 torso={...j.near,...makeSocket(j.near,mirrorPoint(hipBall.centre),j.R,j.soft,SOCKET_EDGE,SOCKET_SKIN*hipBall.radius)};
 joints.hip={centre:hipBall.centre,radius:hipBall.radius,ballMoved:j.ballMove,limbMoved:j.farMove,restBend:j.restBend,bend:HIP_BEND,fold:FRONT};
 j=pressJoint({near:thigh,ball:kneeBall,chain:[calf,ankleBall,foot],into:scale(dT,-1),along:dC,depthNear:depth(kneeBall.radius),depthFar:depth(kneeBall.radius),nearSkin:LIMB_SKIN,farSkin:LIMB_SKIN,
  shape:shapeBends?(n,f,c,R,soft)=>shapeForBend(n,f,c,HINGE,scale(dT,-1),dC,BACK,KNEE_BEND,soft,R):null,softMin:limbSoft});
 thigh=j.near;kneeBall=j.ball;[calf,ankleBall,foot]=j.chain;
 joints.knee={centre:kneeBall.centre,radius:kneeBall.radius,ballMoved:j.ballMove,limbMoved:j.farMove,restBend:j.restBend,bend:KNEE_BEND,fold:BACK};
 j=pressJoint({near:calf,ball:ankleBall,chain:[foot],into:scale(dC,-1),along:dC,depthNear:depth(ankleBall.radius),depthFar:depth(ankleBall.radius),nearSkin:LIMB_SKIN,softMin:limbSoft});
 calf=j.near;ankleBall=j.ball;foot=j.chain[0];joints.ankle={centre:ankleBall.centre,radius:ankleBall.radius,ballMoved:j.ballMove,limbMoved:j.farMove};
 // Final pass: every part is set back outside every ball it touches (gap kept). Later steps split triangles in
 // sockets made earlier (the elbow's fine sampling reaches the shoulder socket), which puts new points a
 // fraction of a millimetre inside; this restores them without moving anything that is already clear.
 const clear=(part,...balls)=>balls.reduce((p,bl)=>keepOutside(p,bl.centre,bl.radius+SOCKET_GAP),part);
 upper=clear(upper,shoulderBall,elbowBall);forearm=clear(forearm,elbowBall,wristBall);hand=clear(hand,wristBall);
 thigh=clear(thigh,hipBall,kneeBall);calf=clear(calf,kneeBall,ankleBall);foot=clear(foot,ankleBall);
 torso=clear(torso,shoulderBall,{centre:mirrorPoint(shoulderBall.centre),radius:shoulderBall.radius},hipBall,{centre:mirrorPoint(hipBall.centre),radius:hipBall.radius});
 const headClear=clear(head,neckBall);
 // Assemble: centre parts once, every side part on both sides.
 const clean=p=>{const {normals,...rest}=p;return rest;};
 const left=[{...shoulderBall},{...upper,name:'upper-arm'},{...elbowBall,name:'ball-elbow'},{...forearm,name:'forearm'},{...wristBall,name:'ball-wrist'},{...hand,name:'hand'},
  {...hipBall,name:'ball-hip'},{...thigh,name:'thigh'},{...kneeBall,name:'ball-knee'},{...calf,name:'calf'},{...ankleBall,name:'ball-ankle'},{...foot,name:'foot'}].map(p=>clean({...p,side:'left'}));
 const parts=[clean({...torso,name:'torso',side:'centre'}),clean({...neckBall,name:'ball-neck',side:'centre'}),clean({...headClear,name:'head',side:'centre'})];
 for(const p of left){parts.push(p);parts.push({...mirrorPart(p),name:p.name});}
 let sole=Infinity;for(let i=1;i<foot.positions.length;i+=3)sole=Math.min(sole,foot.positions[i]);
 let top=-Infinity;for(let i=1;i<head.positions.length;i+=3)top=Math.max(top,head.positions[i]);
 return {body:bodyId,parts,joints,face:f.face,height:top-sole,before:f,shoulder:sh};
}
