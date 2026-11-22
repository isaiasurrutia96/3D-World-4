// New avatar (version 2): parts to choose from and the chosen parts, in tabs.
//  - Elbow test: one elbow pressed together two ways, straight and bent (avatar-v2/elbow-test.js);
//  - Original limbs: the athletic torso, approved head, hands and feet with the original avatar's limbs, separated, a ball at every joint (avatar-v2/original-body.js);
//  - Avatar: the complete avatar, every joint pressed into snug sockets (avatar-v2/body-sockets.js);
//  - Shoulder sockets: torso, shoulder balls and upper arms pressed together (avatar-v2/sockets.js);
//  - Full body: every approved piece put together, still separate (avatar-v2/assembly.js);
//  - Leg: thigh, knee ball, calf, ankle ball and the chosen foot, before and longer (avatar-v2/assembly.js);
//  - Wrist: forearm, wrist ball and the chosen hand (avatar-v2/assembly.js);
//  - Hands & feet: the owner's original hand and foot and four gentle variations
//    (avatar-v2/hands-feet.js);
//  - Assembly: the chosen parts put together (avatar-v2/assembly.js), boy and
//    girl, with the shoulder and hip balls at the joints or resting on the
//    torso; the chosen base face is pressed onto the head (DecalGeometry);
//  - Torsos / Arms / Legs: the chosen boy's part and the girl's version.
// Each tab has its own row; "Compare all" frames that row, and each item's
// button moves the camera in on it and hides the rest. The approved avatar is
// not used here.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {DecalGeometry} from 'three/addons/geometries/DecalGeometry.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import torso from '../avatar-v2/torso.json' with {type:'json'};
import {CHOSEN_ARM,GIRL_ARM,CHOSEN_LEG,GIRL_LEG,buildArmSet,buildLegSet} from '../avatar-v2/limb-options.js';
import {WOMEN_OPTIONS,CHOSEN_TORSO,CHOSEN_GIRL_TORSO,makeTorsoOption} from '../avatar-v2/torso-variants.js';
import {drawFace} from '../avatar-v2/face.js';
import {assemble,shoulderPreview,wristPreview,legPreview,fullBodyPreview,BODIES} from '../avatar-v2/assembly.js';
import {shoulderSocketPreview} from '../avatar-v2/sockets.js';
import {socketedBody} from '../avatar-v2/body-sockets.js';
import {separatedOriginalBody,pressedPreviewBody,limbsOnlyBody,torsoShoulderBalls,pushShoulderBalls,softenShoulderRims,SHOULDER_RIM_ROUND} from '../avatar-v2/original-body.js';
import {elbowTest,ELBOW_TEST_POSES,CLOSER_DEPTHS,CLAY_LIP} from '../avatar-v2/elbow-test.js';
import {HAND_FOOT_OPTIONS,buildHandFoot} from '../avatar-v2/hands-feet.js';
import {buildTorsoSurface} from '../avatar-v2/torso-shape.js';

const GAP=.3;// metres of space between items, left to right
const stage=document.querySelector('#stage');
const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;stage.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#405363');
const material=new T.MeshStandardMaterial({color:new T.Color().setRGB(...torso.color),roughness:torso.roughness});

/** A small label (a rounded tag) that always faces the camera. */
function label(text){
 const canvas=document.createElement('canvas'),g=canvas.getContext('2d'),font='600 64px system-ui,sans-serif';g.font=font;
 const w=Math.max(128,Math.ceil(g.measureText(text).width)+64);canvas.width=w;canvas.height=128;
 g.fillStyle='rgba(255,255,255,.92)';g.beginPath();g.roundRect(4,8,w-8,112,56);g.fill();
 g.fillStyle='#343b40';g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,68);
 const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas)}));sprite.scale.set(.11*w/128,.11,1);return sprite;
}

// Everything on show: each item is a set of parts (geometry and height), with
// its centre and width for framing the camera.
const geometryOf=({positions,index,normals})=>{
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(index);
 if(normals)g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));else g.computeVertexNormals();
 return g;
};
const ARM_TOP=1.3,LEG_TOP=.84;// heights of the top ends: about the shoulder and the hip
const partsOf=(set,keys,names,top)=>keys.map((key,i)=>({name:names[i],geometry:geometryOf(set[key]),y:top+set[key].y}));
const armItem=(option,id,label,tag)=>{const set=buildArmSet(option);
 return {id,label,tag,note:`${option.note} Ball ${(set.size.ball*200).toFixed(1)} cm wide; upper arm ${(set.size.upper*100).toFixed(1)} cm, forearm ${(set.size.fore*100).toFixed(1)} cm.`,
  parts:partsOf(set,['upper','ball','fore'],['upper-arm','ball-elbow','forearm'],ARM_TOP)};};
const legItem=(option,id,label,tag)=>{const set=buildLegSet(option);
 return {id,label,tag,note:`${option.note} Knee ball ${(set.size.ball*200).toFixed(1)} cm wide; thigh ${(set.size.thigh*100).toFixed(1)} cm, calf ${(set.size.calf*100).toFixed(1)} cm.`,
  parts:partsOf(set,['thigh','ball','calf'],['thigh','ball-knee','calf'],LEG_TOP)};};
const boyTorso=makeTorsoOption(torso.shape,CHOSEN_TORSO),girlTorso=makeTorsoOption(torso.shape,CHOSEN_GIRL_TORSO,WOMEN_OPTIONS);
const torsoPart=shape=>({name:'torso',geometry:geometryOf(buildTorsoSurface(shape)),y:0});
// A painted face: drawn on a canvas, then pressed onto the front of the head.
function paintFace(group,head,face){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;drawFace(canvas.getContext('2d'),512,face);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const sphere=head.geometry.boundingSphere,r=sphere.radius,centre=head.localToWorld(sphere.center.clone());
 const geometry=new DecalGeometry(head,centre.clone().add(new T.Vector3(0,0,r)),new T.Euler(),new T.Vector3(2*r,2*r,r));
 geometry.applyMatrix4(group.matrixWorld.clone().invert());// decal is built in world space; keep it with its item
 const decal=new T.Mesh(geometry,new T.MeshStandardMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,roughness:.6}));
 decal.name='face';group.add(decal);
}
const GROUPS=[
];
const LATER_GROUPS=[// kept in code, not shown (owner: show only the shoulder for now)
 {id:'assembly',label:'Assembly',intro:'The chosen parts put together, boy and girl. "At the joints": shoulder and hip balls sit where the skeleton turns the limbs, partly inside the torso. "Resting": pushed out until they just clear the torso (wider shoulders, longer legs). Hands and feet come next.',
  items:Object.keys(BODIES).flatMap(bodyId=>['joints','resting'].map(placement=>{const a=assemble(bodyId,placement),name=BODIES[bodyId].label;
   return {id:`${bodyId}-${placement}`,label:`${name} · ${placement==='joints'?'At the joints':'Resting'}`,tag:`${name} ${placement==='joints'?'A':'B'}`,face:a.face,
    note:`${name}, shoulder and hip balls ${placement==='joints'?'centred on the skeleton\'s joints (partly inside the torso)':'pushed out to just clear the torso'}. Upper arm ${(a.parts.find(p=>p.name==='upper-arm').length*100).toFixed(1)} cm, thigh ${(a.parts.find(p=>p.name==='thigh').length*100).toFixed(1)} cm.`,
    parts:a.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))};}))},
 {id:'torsos',label:'Torsos',intro:'The chosen torsos: the boy\'s Athletic (light) and the girl\'s W5 Gymnast.',
  items:[{id:'torso-boy',label:'Torso · Boy',tag:'Boy',note:CHOSEN_TORSO.note,parts:[torsoPart(boyTorso)]},{id:'torso-girl',label:'Torso · Girl',tag:'Girl',note:CHOSEN_GIRL_TORSO.note,parts:[torsoPart(girlTorso)]}]},
 {id:'arms',label:'Arms',intro:'The chosen Athletic arm (boy) and the girl\'s version, 8% slimmer.',
  items:[armItem(CHOSEN_ARM,'arm-boy','Arm · Boy','Boy'),armItem(GIRL_ARM,'arm-girl','Arm · Girl','Girl')]},
 {id:'legs',label:'Legs',intro:'The chosen Strong legs (boy) and the girl\'s version, 8% slimmer.',
  items:[legItem(CHOSEN_LEG,'leg-boy','Leg · Boy','Boy'),legItem(GIRL_LEG,'leg-girl','Leg · Girl','Girl')]},
];
const full=fullBodyPreview('boy');
GROUPS.push({id:'full',label:'Full body',intro:'Every approved piece put together, still separate: every arm and leg piece 15% bigger (hands then 10% smaller), feet 3 inches longer than the head; torso, neck and head unchanged.',
 items:[{id:'full-boy',label:'Boy · all pieces',tag:'Boy',face:full.face,note:`All ${full.parts.length} pieces, separate with small gaps. Each foot ${(full.footLength*100).toFixed(1)} cm long (the head is ${(full.headHeight*100).toFixed(1)} cm). He stands ${(full.height*100).toFixed(0)} cm tall (your original avatar: about 189 cm), before sockets. Hip balls sit 2 cm below the torso, like the shoulders.`,
  parts:full.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))}]});
// Only the upper arms, forearms, thighs and calves (owner, 22 November 2026: "take away every part minus the upper
// arm, forearm, thighs and calves"), each exactly where and how it is when he is put together.
// Next to them, his torso and both shoulder balls side by side, not pressed together (owner, 22 November 2026: "get
// the torso and the ball next to each other but not together, u can do both sides").
// Then both balls pushed into the clay torso and pulled back out, leaving the sockets they made (owner: "push the ball
// in and let it form the sockets naturally ... once you push the ball in pull it back out and leave it").
const pressed=pressedPreviewBody('boy'),together=limbsOnlyBody('boy',pressed),mix=separatedOriginalBody('boy'),shoulderPair=torsoShoulderBalls('boy',{pressed,apart:mix}),pushedIn=pushShoulderBalls('boy',pressed,{apart:mix}),softened=softenShoulderRims(pushedIn);
GROUPS.push({id:'together',label:'Put together',intro:'Only his upper arms, forearms, thighs and calves, each exactly where and how it is when he is put together. Next to them, his torso and both shoulder balls, side by side but not pressed together, then the same balls pushed into the clay torso and pulled back out, leaving the sockets they made, and last those sockets with their rims chiselled and softened.',
 items:[{id:'together-boy',label:'Boy · limbs only',tag:'Boy',note:`His ${together.parts.length} limb pieces, in their places. ${(together.height*100).toFixed(0)} cm from the bottom of the calves to the top of the upper arms.`,
  parts:together.parts.map(p=>({name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))},
  {id:'torso-shoulders',label:'Torso · shoulder balls',tag:'Torso',note:`His torso, exactly as when he is put together, and both shoulder balls (${(shoulderPair.balls[0].radius*200).toFixed(1)} cm, their usual size and height) beside it, not pressed in: each ${(shoulderPair.clear*100).toFixed(1)} cm clear of the torso.`,
  parts:shoulderPair.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))},
  {id:'torso-shoulders-pushed',label:'Torso · sockets left by the balls',tag:'Sockets',note:`Both shoulder balls were pushed straight into the clay torso, to where they sit when he is put together, then pulled straight back out to where they started. The sockets are exactly what the balls left (the ball plus the usual 6 mm gap; ${Math.round(pushedIn.displaced/2*1e6)} cm³ of clay each). Nothing smoothed or rounded.`,
  parts:pushedIn.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))},
  {id:'torso-shoulders-softened',label:'Torso · rims chiselled and softened',tag:'Softened',note:`The same sockets with the thin sliver of clay over the top chiselled away and every rim rounded: a ${Math.round(SHOULDER_RIM_ROUND*1000)} mm ball rolled along the inside of the clay, and whatever it could not reach was cut off (${softened.removed*1e6>=1?Math.round(softened.removed*1e6):(softened.removed*1e6).toFixed(1)} cm³ of clay). Nothing else changed.`,
  parts:softened.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))}]});
const elbowItems=[];
for(const share of CLOSER_DEPTHS){const e=elbowTest(share,'boy',{lip:CLAY_LIP}),name=`${Math.round(share*100)}% deep`;
 for(const deg of ELBOW_TEST_POSES)elbowItems.push({id:`elbow-${Math.round(share*100)}-${deg}`,label:`${name} · ${deg?deg+'°':'straight'}`,tag:`${Math.round(share*100)}% ${deg}°`,
  note:`${name}: the ball sits ${(e.depth*100).toFixed(1)} cm into each limb (its radius is ${(e.radius*100).toFixed(1)} cm), with thick clay wrapped around it. ${deg?'Forearm folded forward '+deg+'°.':'Straight.'} Sockets snug (6 mm); folds to 120° without touching.`,
  parts:e.pose(deg).map(p=>({name:p.name,geometry:geometryOf(p),y:0}))});}
GROUPS.push({id:'elbow-test',label:'Elbow test',intro:'One elbow (his left), the limbs pressed closer with thick clay around the hard ball, three depths: the ball sits 70%, 80% or 90% of its radius into each limb, the clay staying thick around it like pushed clay. Each shown straight, bent 90° and bent 120°.',items:elbowItems});
GROUPS.push({id:'original',label:'Original limbs',intro:'Your athletic torso, head, hands and feet with the original avatar\'s limbs (each 10% longer, calves 50 cm), every piece separated and the original neck removed, with a ball at every joint: as thick as the ends it joins (shoulders, neck and hips 10% bigger, wrists and ankles 10% smaller), 300 triangles each.',
 items:[{id:'original-boy',label:'Boy · pieces and joint balls',tag:'Boy',face:mix.face,ground:true,note:`Balls: neck ${(mix.balls['ball-neck'].radius*200).toFixed(1)} cm (approved size), shoulders ${(mix.balls['ball-shoulder'].radius*200).toFixed(1)}, elbows ${(mix.balls['ball-elbow'].radius*200).toFixed(1)}, wrists ${(mix.balls['ball-wrist'].radius*200).toFixed(1)}, hips ${(mix.balls['ball-hip'].radius*200).toFixed(1)}, knees ${(mix.balls['ball-knee'].radius*200).toFixed(1)}, ankles ${(mix.balls['ball-ankle'].radius*200).toFixed(1)} cm. Balls 2 cm from the torso, every other piece 6 mm from its ball. ${(mix.height*100).toFixed(0)} cm tall with everything apart.`,
  parts:mix.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))}]});
const avatar=socketedBody('boy');
GROUPS.push({id:'avatar',label:'Avatar',intro:'The complete avatar: every joint pressed together the same way as the shoulders. Each ball sits snug in a socket on both sides, with soft edges, and every joint bends through its range without parts touching.',
 items:[{id:'avatar-boy',label:'Boy · complete',tag:'Boy',face:avatar.face,note:`All ${avatar.parts.length} pieces in snug sockets (6 mm gap). Elbows fold to 120° and knees to 120°; wrists, ankles and neck through their full ranges; hips swing forward cleanly to about 80°. He stands ${(avatar.height*100).toFixed(0)} cm tall.`,
  parts:avatar.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))}]});
const sockets=shoulderSocketPreview('boy');
GROUPS.unshift({id:'shoulder-sockets',label:'Shoulder sockets',intro:'The torso, both shoulder balls and both upper arms pressed together like clay around a hard ball: each ball sits snug in a socket in the torso and in the top of the upper arm, with soft edges. Nothing else changed.',
 items:[{id:'shoulder-sockets-boy',label:'Torso · shoulders · upper arms',tag:'Boy',note:`Each ball (${(sockets.ball.radius*200).toFixed(1)} cm) sinks ${(sockets.torsoDepth*100).toFixed(1)} cm into the torso and ${(sockets.depth*100).toFixed(1)} cm into the upper arm, with a ${(sockets.gap*1000).toFixed(0)} mm gap all round, so they never touch. The balls moved ${(sockets.inward*100).toFixed(1)} cm in and the upper arms ${(sockets.armUp*100).toFixed(1)} cm up. Where the ball rises above the torso's shoulder, a thin layer of the torso wraps over it.`,
  parts:sockets.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))}]});
// Hand, head and foot side by side, exactly as they are on the full body (not resized): each one
// only moved so it stands on the floor in a row.
const standing=(part,name)=>{const P=part.positions;let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];
 for(let i=0;i<P.length;i+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],P[i+k]);hi[k]=Math.max(hi[k],P[i+k]);}
 const c=[(lo[0]+hi[0])/2,lo[1],(lo[2]+hi[2])/2];
 return {name,geometry:geometryOf({positions:P.map((v,i)=>v-c[i%3]),index:part.index}),y:0,size:hi.map((h,k)=>h-lo[k])};};
const pick=(n,side)=>full.parts.find(p=>p.name===n&&p.side===side);
const hhf=[['hand',standing(pick('hand','left'),'hand'),1],['head',standing(pick('head','centre'),'head'),1],['foot',standing(pick('foot','left'),'foot'),2]];
GROUPS.unshift({id:'hhf',label:'Hand · head · foot',intro:'The hand, head and foot side by side, exactly the sizes they are on the full body (nothing resized).',
 items:hhf.map(([n,part,axis])=>({id:'hhf-'+n,label:n[0].toUpperCase()+n.slice(1),tag:n[0].toUpperCase()+n.slice(1),...(n==='head'?{face:full.face}:{}),
  note:`${n[0].toUpperCase()+n.slice(1)}: ${(part.size[axis]*100).toFixed(1)} cm ${n==='foot'?'heel to toe':n==='hand'?'wrist end to fingertips':'tall'}.`,parts:[part]}))});
const legBefore=legPreview('boy',{lengthen:1,ankleBallScale:1}),legLonger=legPreview('boy');
const legNote=(l,what)=>`${what} Thigh ${(l.thigh.length*100).toFixed(1)} cm, calf ${(l.calf.length*100).toFixed(1)} cm, knee ball ${(l.kneeBall*200).toFixed(1)} cm, ankle ball ${(l.ankleBall*200).toFixed(1)} cm. Hip to sole ${(l.hipToSole*100).toFixed(1)} cm (your original avatar: ${(l.originalHipToSole*100).toFixed(1)} cm, before sockets).`;
GROUPS.push({id:'leg',label:'Leg',intro:'The whole leg, one side: thigh, knee ball, calf, ankle ball and your chosen foot. Left: as it was. Right: thigh and calf 10% longer and the ankle ball 10% bigger. Same shapes, only longer.',
 items:[{id:'leg-before',label:'Before',tag:'Before',note:legNote(legBefore,'The leg as it was.'),parts:legBefore.parts.map(p=>({name:p.name,geometry:geometryOf(p),y:0}))},
  {id:'leg-longer',label:'Longer · bigger ankle',tag:'Longer',note:legNote(legLonger,'Thigh and calf 10% longer, ankle ball 10% bigger.'),parts:legLonger.parts.map(p=>({name:p.name,geometry:geometryOf(p),y:0}))}]});
const wrist=wristPreview('boy');
GROUPS.push({id:'wrist',label:'Wrist',intro:'The wrist joint, one side: the forearm, the wrist ball and your chosen hand (option 2), separate with small gaps. Nothing reshaped.',
 items:[{id:'wrist-boy',label:'Forearm · wrist · hand',tag:'Boy',note:`Forearm at its approved ${(wrist.forearm.length*100).toFixed(1)} cm; wrist ball ${(wrist.wristBall*200).toFixed(1)} cm wide, the same size as the bottom edge of the forearm; your chosen hand one gap below it, unchanged. Keeping every length puts the wrist ${(wrist.wristMovedBy*100).toFixed(1)} cm further down the arm than before.`,
  parts:wrist.parts.map(p=>({name:p.name,geometry:geometryOf(p),y:0}))}]});
GROUPS.push({id:'handsfeet',label:'Hands & feet',intro:'Your original hand and foot (option 1) and four gentle variations of them. Each keeps every finger and toe detail; the wrist and ankle stay put. Tap one to look closely.',
 items:HAND_FOOT_OPTIONS.map((option,i)=>{const r=buildHandFoot(option);
  return {id:option.id,label:option.label,tag:String(i+1),note:option.note,parts:[{name:'hand',geometry:geometryOf(r.hand),y:0},{name:'foot',geometry:geometryOf(r.foot),y:0}]};})});
const preview=shoulderPreview('boy');
GROUPS.push({id:'shoulder',label:'Shoulders',intro:'The boy\'s torso with a shoulder ball and the upper arm on both sides (arms 10% thicker for the boy). The balls are separated from the torso by a clear gap, never touching it.',
 items:[{id:'shoulder-boy',label:'Torso · shoulders · upper arms',tag:'Boy',note:`Shoulder balls ${(preview.shoulderBall*200).toFixed(1)} cm wide, the size of a shoulder (5% bigger than the upper arm's thickest point), separated from the torso by a 2 cm gap. Upper arms 10% thicker than approved, same shape and the approved length (${(preview.upper.length*100).toFixed(1)} cm).`,
  parts:preview.parts.map(p=>({name:p.side==='centre'?p.name:p.name+'.'+p.side,geometry:geometryOf(p),y:0}))}]});

// The newest work opens first: the original limbs, then the complete avatar, then the shoulder sockets.
GROUPS.unshift(...GROUPS.splice(GROUPS.findIndex(g=>g.id==='shoulder-sockets'),1));
GROUPS.unshift(...GROUPS.splice(GROUPS.findIndex(g=>g.id==='avatar'),1));
GROUPS.unshift(...GROUPS.splice(GROUPS.findIndex(g=>g.id==='original'),1));
GROUPS.unshift(...GROUPS.splice(GROUPS.findIndex(g=>g.id==='elbow-test'),1));
GROUPS.unshift(...GROUPS.splice(GROUPS.findIndex(g=>g.id==='together'),1));

// Lay out each tab's row, centred on x = 0; only the active tab's row shows.
let widest=0;
for(const group of GROUPS){
 group.row=new T.Group();group.row.name='row-'+group.id;scene.add(group.row);let x=0;
 group.options=group.items.map((item,i)=>{
  const g=new T.Group();g.name='item-'+item.id;
  for(const part of item.parts){const mesh=new T.Mesh(part.geometry,material);mesh.name=part.name;mesh.position.y=part.y;mesh.castShadow=true;g.add(mesh);}
  // Anything that reaches below the floor is raised to stand on it (display only; the parts are unchanged).
  // The box below already includes that lift, so the label and the centre allow for it.
  const below=new T.Box3().setFromObject(g).min.y;if(below<0||item.ground)g.position.y=-below;// `ground`: stand on the floor even if slightly above it
  const box=new T.Box3().setFromObject(g),width=box.max.x-box.min.x,height=box.max.y-box.min.y;
  if(i>0)x+=GAP;x+=width/2;g.position.x=x;x+=width/2;
  const tag=label(item.tag);tag.position.set(0,box.min.y-g.position.y-.1,0);g.add(tag);group.row.add(g);
  return {...item,group:g,mesh:g.children[0],width,height,centre:box.getCenter(new T.Vector3()).add(new T.Vector3(g.position.x,0,0)),triangles:item.parts.reduce((n,p)=>n+p.geometry.index.count/3,0)};
 });
 group.row.position.x=-x/2;for(const o of group.options)o.centre.x-=x/2;
 // Faces are pressed on once every item is in its final place.
 scene.updateMatrixWorld(true);
 for(const o of group.options)if(o.face){const head=o.group.children.find(m=>m.name==='head');head.geometry.computeBoundingSphere();paintFace(o.group,head,o.face);o.triangles+=o.group.children.find(m=>m.name==='face').geometry.attributes.position.count/3;}
 group.width=x;group.centre=new T.Box3().setFromObject(group.row).getCenter(new T.Vector3());widest=Math.max(widest,x);
}

const slab=new T.Mesh(new T.BoxGeometry(widest+1.6,.6,3),new T.MeshStandardMaterial({color:'#8f9295',roughness:1}));slab.position.y=-.3;slab.receiveShadow=true;scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff,0xb6b2aa,2));
const key=new T.DirectionalLight(0xffffff,2.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(2048,1024);
Object.assign(key.shadow.camera,{left:-2,right:2,top:2,bottom:-1,near:.2,far:14});key.shadow.bias=-.0002;key.target.position.set(0,.9,0);scene.add(key,key.target);
const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(4,2,-3);scene.add(fill);

// Camera: "focus" is null (compare all) or an option's index. View buttons
// work around whatever is in focus. Moves glide over about a third of a second.
const camera=new T.PerspectiveCamera(36,1,.01,60),controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.25;controls.maxDistance=12;
const directions={front:[0,.04,1],side:[1,.04,0],back:[0,.04,-1],top:[0,1,.0004],angled:[.5,.2,.85]};
let active=GROUPS[0],options=active.options,focus=null,viewName='front',glide=null;
function distance(){// close enough to fill the screen with one item (its width and its height), or with all of them
 const half=Math.tan(camera.fov*Math.PI/360),across=focus===null?active.width+.4:Math.max(options[focus].width*1.7,.75);
 const wide=(across/2)/(half*Math.min(1,camera.aspect)),tall=((focus===null?Math.max(...options.map(o=>o.height)):options[focus].height)*1.2/2)/half;// the tallest item fits too (leaves room for the view buttons)
 return Math.max(focus===null?.9:.45,wide,tall)*1.05;
}
function frame(){
 const centre=focus===null?active.centre:options[focus].centre,dir=new T.Vector3(...directions[viewName]).normalize();
 // Aim a little below the middle so the bottom of the item (feet) clears the view buttons over the stage.
 const tallest=focus===null?Math.max(...options.map(o=>o.height)):options[focus].height,target=centre.clone();if(viewName!=='top')target.y-=tallest*.08;
 glide={fromPos:camera.position.clone(),fromTarget:controls.target.clone(),toTarget:target.clone(),toPos:target.clone().add(dir.multiplyScalar(distance())),t:0};
}
function setFocus(index){
 focus=index;
 // Looking at one: the others are hidden so no neighbour blocks the side views.
 options.forEach((o,i)=>{o.group.visible=index===null||i===index;});
 frame();
 for(const b of document.querySelectorAll('[data-option]'))b.setAttribute('aria-pressed',String(b.dataset.option===(index===null?'all':options[index].id)));
 const o=index===null?null:options[index];
 document.querySelector('#note').textContent=o?o.note:active.intro;
 document.querySelector('#info').textContent=o?o.triangles.toLocaleString()+' triangles':options.map(o=>o.triangles.toLocaleString()).join(' · ')+' triangles';
}
function view(name){viewName=name;frame();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}

// Tabs (one per group) and, for the active tab, one button per item plus "Compare all".
const list=document.querySelector('#options'),tabs=document.querySelector('#groups');
const button=(parent,data,id,text)=>{const b=document.createElement('button');b.dataset[data]=id;b.textContent=text;b.setAttribute('aria-pressed','false');parent.append(b);return b;};
function setGroup(id){
 active=GROUPS.find(g=>g.id===id)??GROUPS[0];options=active.options;
 for(const g of GROUPS)g.row.visible=g===active;
 for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.group===active.id));
 list.replaceChildren();button(list,'option','all','Compare all').onclick=()=>setFocus(null);
 options.forEach((o,i)=>{button(list,'option',o.id,o.label).onclick=()=>setFocus(i);});
 setFocus(null);
}
for(const g of GROUPS)button(tabs,'group',g.id,g.label).onclick=()=>setGroup(g.id);
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
controls.addEventListener('start',()=>{glide=null;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed','false');});

function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.fov=camera.aspect<.7?46:36;camera.updateProjectionMatrix();renderer.setSize(width,height);}
new ResizeObserver(resize).observe(stage);resize();
setGroup(GROUPS[0].id);view('front');
camera.position.copy(glide.toPos);controls.target.copy(glide.toTarget);glide=null;controls.update();// start in place
installTestLabScene({scene,camera,renderer,floors:[slab],getTarget:()=>controls.target,updateControls:()=>controls.update()});

// Light enough to draw every frame (keeps a phone's graphics chip awake).
let last=0;
renderer.setAnimationLoop(ms=>{
 const dt=Math.min(1/30,last?(ms-last)/1000:0);last=ms;
 if(glide){glide.t=Math.min(1,glide.t+dt/.35);const k=glide.t*glide.t*(3-2*glide.t);
  camera.position.lerpVectors(glide.fromPos,glide.toPos,k);controls.target.lerpVectors(glide.fromTarget,glide.toTarget,k);if(glide.t>=1)glide=null;}
 controls.update();renderer.render(scene,camera);
});
window.newAvatarLab={scene,camera,controls,renderer,groups:GROUPS,get options(){return options;},setGroup,setFocus,view,torso,getFocus:()=>focus,getGroup:()=>active.id};
document.querySelector('#loading').hidden=true;window.newAvatarReady=true;
