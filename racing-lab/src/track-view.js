import * as T from 'three';
export function createTrackView(track){
 const root=new T.Group();root.name=track.name;
 const road=[],bottom=[],sides=[];
 const add=(array,p,dy=0)=>array.push(p.x,p.y+dy,p.z);
 for(const segment of track.segments){
  for(const triangle of segment.triangles)for(const point of triangle){add(road,point);add(bottom,point,-.6);}
  for(const [a,b] of [[segment.corners[0],segment.corners[1]],[segment.corners[3],segment.corners[2]]])for(const [p,dy] of [[a,0],[b,0],[b,-.6],[a,0],[b,-.6],[a,-.6]])add(sides,p,dy);
 }
 const mesh=(positions,color)=>{const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();const value=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide}));root.add(value);return value;};
 const top=mesh(road,'#eeeae2'),base=mesh(bottom,'#777b7d'),edges=mesh(sides,'#8b8e8e');top.name='physics road triangles';
 const rails=new T.InstancedMesh(new T.BoxGeometry(.16,.75,1),new T.MeshStandardMaterial({color:'#737b80',roughness:.9}),track.rails.length),dummy=new T.Object3D(),delta=new T.Vector3(),forward=new T.Vector3(0,0,1);
 track.rails.forEach((rail,i)=>{delta.set(rail.b.x-rail.a.x,rail.b.y-rail.a.y,rail.b.z-rail.a.z);dummy.position.set((rail.a.x+rail.b.x)/2,(rail.a.y+rail.b.y)/2+.5,(rail.a.z+rail.b.z)/2);dummy.quaternion.setFromUnitVectors(forward,delta.clone().normalize());dummy.scale.set(1,1,delta.length()+.02);dummy.updateMatrix();rails.setMatrixAt(i,dummy.matrix);});rails.instanceMatrix.needsUpdate=true;root.add(rails);
 const line=new T.Mesh(new T.BoxGeometry(track.outer*2,.035,1),new T.MeshStandardMaterial({color:'#454b4f'}));line.position.set(track.start.x,track.start.y+.025,track.start.z);line.rotation.y=track.start.yaw;root.add(line);
 function dispose(){root.traverse(object=>{if(!object.isMesh)return;object.geometry.dispose();const list=Array.isArray(object.material)?object.material:[object.material];for(const material of list)material.dispose();});}
 return {root,obstacles:[top,base,edges],dispose};
}
export function createKartView(color){
 const group=new T.Group(),bodyMaterial=new T.MeshStandardMaterial({color,roughness:.85}),dark=new T.MeshStandardMaterial({color:'#363c40',roughness:1});
 const body=new T.Mesh(new T.BoxGeometry(1.35,.35,1.8),bodyMaterial);body.position.y=.45;group.add(body);
 const seat=new T.Mesh(new T.BoxGeometry(.65,.38,.6),dark);seat.position.set(0,.78,-.2);group.add(seat);
 const wheelGeometry=new T.CylinderGeometry(.24,.24,.22,10);for(const x of [-.78,.78])for(const z of [-.57,.57]){const wheel=new T.Mesh(wheelGeometry,dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.24,z);group.add(wheel);}
 const arrow=new T.ArrowHelper(new T.Vector3(0,0,1),new T.Vector3(0,1,.1),.85,0x343b3f,.25,.22);group.add(arrow);return group;
}
