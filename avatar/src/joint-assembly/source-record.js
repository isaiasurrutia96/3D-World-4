import * as T from 'three';
export function geometryRecord(g){return {attributes:Object.fromEntries(Object.entries(g.attributes).map(([name,a])=>[name,{array:a.array.slice(),itemSize:a.itemSize,normalized:a.normalized}])),index:g.index.array.slice(),userData:structuredClone(g.userData)};}
export function meshRecord(p,matrix){return {geometry:geometryRecord(p.geometry),position:p.position.toArray(),quaternion:p.quaternion.toArray(),scale:p.scale.toArray(),...(matrix?{matrix:matrix.toArray()}:{}),userData:structuredClone(p.userData),material:{color:p.material.color.getHex(),roughness:p.material.roughness,metalness:p.material.metalness}};}
export function meshFromRecord(r,name){
 const g=new T.BufferGeometry();for(const [key,a]of Object.entries(r.geometry.attributes))g.setAttribute(key,new T.BufferAttribute(a.array.slice(),a.itemSize,a.normalized));g.setIndex(new T.BufferAttribute(r.geometry.index.slice(),1));g.userData=structuredClone(r.geometry.userData);g.computeBoundingBox();g.computeBoundingSphere();
 const mesh=new T.Mesh(g,new T.MeshStandardMaterial(r.material));mesh.name=name;mesh.userData=structuredClone(r.userData??{});mesh.scale.fromArray(r.scale??[1,1,1]);mesh.quaternion.fromArray(r.quaternion??[0,0,0,1]);mesh.position.fromArray(r.position??[0,0,0]);return mesh;
}
