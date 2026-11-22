// New avatar (version 2): an elbow test on one side (owner, 22 November 2026):
// the upper arm, the elbow ball and the forearm of the separated original-limb
// avatar pressed together the clay way, then bent to see how the clay moulds.
//
// Two ways of placing the pieces, shown side by side:
//  - 'touch' (the owner's idea): with no ball, the two limbs' rounded ends
//    touch; the ball is put exactly where they touch, and it carves its
//    sockets into both limbs without the limbs moving. The ball then sits as
//    deep as its own radius in each limb (half of it inside each).
//  - 'golden': the ball sinks into each limb by its radius divided by the
//    golden ratio (61.8% of its radius), so the limbs stay a little apart.
// In both, the ball keeps its approved size and place between the limbs'
// lines (the upper arm stays where it is; only the forearm moves along its
// own line), the sockets keep the usual 6 mm gap and soft edges, and before
// the sockets are pressed the inner side of the elbow is shaped so the forearm
// folds forward to ELBOW_TEST_BEND without touching the upper arm (the clay
// giving way where the bent limbs would meet), keeping each limb's round,
// cylinder shape everywhere else.
import {separatedOriginalBody,limbLine} from './original-body.js';
import {makeSocket,refineNear,softEdge,SOCKET_GAP,SOCKET_EDGE} from './sockets.js';
import {shapeForBend,clearanceAt,HINGE,LIMB_SOFT} from './body-sockets.js';

export const GOLDEN=(1+Math.sqrt(5))/2;
/** Deepest bend the test shapes for (degrees; the skeleton allows 150 at the elbow). */
export const ELBOW_TEST_BEND=120;
/** The bends shown on the page (degrees). */
export const ELBOW_TEST_POSES=[0,90,120];
const FRONT=[0,0,1];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const moved=(p,v)=>({...p,positions:p.positions.map((x,i)=>x+v[i%3]),...(p.centre?{centre:add(p.centre,v)}:{})});
/** Points turned about `axis` through `pivot` (Rodrigues). */
function turned(positions,pivot,axis,degrees){
 const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a),[x,y,z]=axis,out=new Array(positions.length);
 for(let i=0;i<positions.length;i+=3){const v=[positions[i]-pivot[0],positions[i+1]-pivot[1],positions[i+2]-pivot[2]],d=v[0]*x+v[1]*y+v[2]*z,cr=[y*v[2]-z*v[1],z*v[0]-x*v[2],x*v[1]-y*v[0]];
  for(let k=0;k<3;k++)out[i+k]=pivot[k]+v[k]*c+cr[k]*s+axis[k]*d*(1-c);}
 return out;
}

/** One elbow, made one way ('touch' or 'golden'). */
export function elbowTest(mode,bodyId='boy',{softWidth=null,shape=true}={}){
 const body=separatedOriginalBody(bodyId),get=n=>body.parts.find(p=>p.name===n&&p.side==='left');
 const upper0=get('upper-arm'),ball0=get('ball-elbow'),fore0=get('forearm'),r=ball0.radius,R=r+SOCKET_GAP,soft=softWidth??Math.max(softEdge(r),LIMB_SOFT);
 const U=limbLine(upper0.positions),F=limbLine(fore0.positions);
 // How deep the ball sits in each limb: its whole radius when the tips touch at its centre; r / golden ratio otherwise.
 const depth=mode==='touch'?r:r/GOLDEN;
 // The upper arm stays put: the ball's centre sits on its line, `depth` back inside it from its bottom tip.
 // The ball's top (C - dir*r) is `depth` inside the upper arm from its tip, so the centre is (r - depth) past the tip.
 const upperTip=add(U.centre,scale(U.dir,U.end)),C=add(upperTip,scale(U.dir,r-depth));
 // The forearm moves along its own line so its top tip is `depth` inside the ball too, on its line through the centre.
 const foreTip=add(F.centre,scale(F.dir,F.start)),wantTip=add(C,scale(F.dir,r-depth)),fore=moved(fore0,sub(wantTip,foreTip));
 const ball=moved(ball0,sub(C,ball0.centre));
 // Room to fold forward first (the clay giving way where the bent limbs would meet), then the sockets, so their soft
 // edges round off where they meet the shaped faces.
 const plain={near:{positions:upper0.positions,index:upper0.index},far:{positions:fore.positions,index:fore.index},restBend:NaN};
 const shaped=shape?shapeForBend(plain.near,plain.far,C,HINGE,scale(U.dir,-1),F.dir,FRONT,ELBOW_TEST_BEND,soft,R):plain;
 const upper=makeSocket(shaped.near,C,R,soft,SOCKET_EDGE),forearm=makeSocket(shaped.far,C,R,soft,SOCKET_EDGE);
 // Bend test: both limbs sampled densely near the elbow.
 const dense=m=>refineNear(m,C,.35,.012).positions,uD=dense(upper),fD=dense(forearm);
 const clearance=deg=>clearanceAt(uD,fD,C,HINGE,-deg);
 /** The three pieces with the forearm folded forward by `degrees`. */
 const pose=degrees=>[{name:'upper-arm',...upper},{name:'ball-elbow',...ball},{name:'forearm',positions:turned(forearm.positions,C,HINGE,-degrees),index:forearm.index}];
 return {mode,depth,radius:r,centre:C,restBend:shaped.restBend,upper,forearm,ball,pose,clearance,before:{upper:upper0,forearm:fore0,forearmPlaced:fore},soft,forearmMoved:Math.hypot(...sub(wantTip,foreTip))};
}
