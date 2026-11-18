// Presentation only: every road vertex and rail endpoint comes from the checked track.
import * as T from 'three';
import {APPEARANCE as A} from '../../racing-core/track/index.ts';
export function createCheckedTrackView(track){
 const root=new T.Group();root.name=track.name;
 const mesh=(positions,material,colors=null)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return new T.Mesh(g,material);};
 const strip=(kind,side=0)=>{const positions=[],colors=[];
  for(const s of track.segments){
   if(kind==='curb'&&!s.curbVisible[side<0?0:1])continue;
   let quad,order=[0,2,1,0,3,2],height=0;
   if(kind==='curb'){const i=side<0?0:3,j=side<0?1:2;quad=[s.innerCorners[i],s.innerCorners[j],s.corners[j],s.corners[i]];height=A.curbHeight;if(side<0)order=[0,1,2,0,2,3];}
   else{quad=s.corners;if(kind==='bottom')height=-track.roadThickness;}
   const color=new T.Color(Math.floor(s.sourceDistance/A.curbStripeLength)%2?A.curbs[0]:A.curbs[1]);
   for(const i of order){const p=quad[i];positions.push(p.x,p.y+height,p.z);if(kind==='curb')colors.push(color.r,color.g,color.b);}
  }return {positions,colors};
 };
 const asphalt=new T.MeshLambertMaterial({color:A.asphalt,side:T.DoubleSide}),curb=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const top=strip('road'),base=strip('bottom'),sides=[];
 for(const s of track.segments)for(const [i,j] of [[0,1],[3,2]]){const a=s.corners[i],b=s.corners[j],quad=[a,b,{...b,y:b.y-track.roadThickness},{...a,y:a.y-track.roadThickness}];for(const k of [0,1,2,0,2,3])sides.push(quad[k].x,quad[k].y,quad[k].z);}
 const road=mesh(top.positions,asphalt),bottom=mesh(base.positions,new T.MeshLambertMaterial({color:A.underside,side:T.DoubleSide})),edges=mesh(sides,new T.MeshLambertMaterial({color:A.sides,side:T.DoubleSide}));road.receiveShadow=true;
 root.add(road);if(track.id==='original')root.add(edges,bottom);else root.add(bottom,edges);
 for(const side of [-1,1]){const s=strip('curb',side);root.add(mesh(s.positions,curb,s.colors));}
 const access=track.access,p=track.placement,world=(x,y,z)=>new T.Vector3(x*Math.cos(p.yaw)+z*Math.sin(p.yaw)+p.x,y+p.y,z*Math.cos(p.yaw)-x*Math.sin(p.yaw)+p.z);
 const dummy=new T.Object3D();
 if(access){
 const bridge=new T.Mesh(new T.BoxGeometry(access.maxX-access.minX,track.roadThickness,access.maxZ-access.minZ),asphalt);bridge.position.copy(world((access.minX+access.maxX)/2,access.height-track.roadThickness/2,(access.minZ+access.maxZ)/2));bridge.rotation.y=p.yaw;bridge.receiveShadow=true;root.add(bridge);
 if(track.id==='original'){
  for(const side of [-1,1])for(let x=128;x<136;x+=2){const c=new T.Mesh(new T.BoxGeometry(2,.06,.9),new T.MeshLambertMaterial({color:(x/2)%2?A.curbs[0]:A.curbs[1]}));c.position.copy(world(x+1,.03,-150+side*9.55));c.rotation.y=p.yaw;root.add(c);}
 }else{
  const alongZ=access.axis==='z',start=alongZ?access.railStartZ:access.railStartX,end=alongZ?access.railEndZ:access.maxX;
  const curbs=new T.InstancedMesh(new T.BoxGeometry(1,.06,.9),new T.MeshLambertMaterial({color:'#ffffff'}),Math.ceil((end-start)/3)*2);let index=0;
  for(const side of [-1,1])for(let at=start;at<end;at+=3){const width=Math.min(3,end-at);dummy.position.copy(alongZ?world(side<0?access.minX+.45:access.maxX-.45,.03,at+width/2):world(at+width/2,.03,side<0?access.minZ+.45:access.maxZ-.45));dummy.rotation.set(0,p.yaw+(alongZ?Math.PI/2:0),0);dummy.scale.set(width,1,1);dummy.updateMatrix();curbs.setMatrixAt(index,dummy.matrix);curbs.setColorAt(index++,new T.Color(Math.floor((at-start)/3)%2?A.curbs[1]:A.curbs[0]));}
  curbs.count=index;curbs.instanceMatrix.needsUpdate=true;root.add(curbs);
 }
 }
 const material=new T.MeshLambertMaterial({color:A.railColor}),beams=new T.InstancedMesh(new T.BoxGeometry(A.railBeamSize,A.railBeamSize,1),material,track.rails.length*2),posts=new T.InstancedMesh(new T.BoxGeometry(A.railPostSize,A.railPostHeight,A.railPostSize),material,Math.ceil(track.rails.length/3)),axis=new T.Vector3(0,0,1);let beam=0,post=0;
 for(let i=0;i<track.rails.length;i++){const r=track.rails[i],a=new T.Vector3(r.a.x,r.a.y,r.a.z),b=new T.Vector3(r.b.x,r.b.y,r.b.z),delta=b.clone().sub(a);
  for(const h of A.railBeamHeights){dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.position.y+=h;dummy.quaternion.setFromUnitVectors(axis,delta.clone().normalize());dummy.scale.set(1,1,delta.length()+A.railBeamOverlap);dummy.updateMatrix();beams.setMatrixAt(beam++,dummy.matrix);}
  if(i%3===0){dummy.position.copy(a);dummy.position.y+=A.railPostCenter;dummy.quaternion.identity();dummy.scale.set(1,1,1);dummy.updateMatrix();posts.setMatrixAt(post++,dummy.matrix);}
 }
 posts.count=post;beams.instanceMatrix.needsUpdate=true;posts.instanceMatrix.needsUpdate=true;root.add(beams,posts);
 root.updateMatrixWorld(true);
 function dispose(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
 return {root,road,dispose};
}
export function createStartLine(track){
 const node=new T.Group(),g=track.gates[0];node.position.set(g.center.x,g.center.y,g.center.z);node.rotation.y=Math.atan2(g.forward.x,g.forward.z);node.name='Start / finish';
 const positions=[],colors=[],white=new T.Color('#f4f2e8'),dark=new T.Color('#182235');
 for(let i=0;i<26;i++)for(let row=0;row<3;row++){const x=i-13,z=row-1.5,quad=[[x,.025,z],[x+1,.025,z],[x+1,.025,z+1],[x,.025,z+1]],color=(i+row)%2?white:dark;for(const index of [0,2,1,0,3,2]){positions.push(...quad[index]);colors.push(color.r,color.g,color.b);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));node.add(new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true})));return node;
}
