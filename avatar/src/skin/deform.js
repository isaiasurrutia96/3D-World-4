import * as T from 'three';

// Rigid dual quaternions avoid the loss of elbow/knee volume produced by
// matrix blending. Both CPU queries and GPU drawing use the same equations.
export function createSkinDeformer(skeleton){
 const n=skeleton.bones.length,real=new Float32Array(n*4),dual=new Float32Array(n*4),q=new T.Quaternion(),v=new T.Vector3(),tmp=new T.Vector3();
 function update(solved){
  for(let i=0;i<n;i++){
   const b=skeleton.bones[i],s=solved.get(b.name);q.copy(s.rotation).normalize();
   v.copy(s.head).sub(tmp.fromArray(b.head).applyQuaternion(q));
   const j=4*i;real[j]=q.x;real[j+1]=q.y;real[j+2]=q.z;real[j+3]=q.w;
   dual[j]=.5*(v.x*q.w+v.y*q.z-v.z*q.y);dual[j+1]=.5*(-v.x*q.z+v.y*q.w+v.z*q.x);dual[j+2]=.5*(v.x*q.y-v.y*q.x+v.z*q.w);dual[j+3]=-.5*(v.x*q.x+v.y*q.y+v.z*q.z);
  }
 }
 function transform(position,indices,weights,target=new T.Vector3(),normal=false){
  let x=0,y=0,z=0,w=0,a=0,b=0,c=0,d=0,ref=-1;
  for(let k=0;k<4;k++){
   if(weights[k]<=0)continue;const j=4*indices[k];if(ref<0)ref=j;
   const sign=real[ref]*real[j]+real[ref+1]*real[j+1]+real[ref+2]*real[j+2]+real[ref+3]*real[j+3]<0?-1:1,s=weights[k]*sign;
   x+=s*real[j];y+=s*real[j+1];z+=s*real[j+2];w+=s*real[j+3];a+=s*dual[j];b+=s*dual[j+1];c+=s*dual[j+2];d+=s*dual[j+3];
  }
  const len=Math.hypot(x,y,z,w);if(!(len>1e-8))throw Error('Invalid skin quaternion');
  x/=len;y/=len;z/=len;w/=len;a/=len;b/=len;c/=len;d/=len;
  const dot=x*a+y*b+z*c+w*d;a-=x*dot;b-=y*dot;c-=z*dot;d-=w*dot;
  target.copy(position).applyQuaternion(q.set(x,y,z,w));
  if(!normal)target.add(tmp.set(2*(-d*x+a*w-b*z+c*y),2*(-d*y+a*z+b*w-c*x),2*(-d*z-a*y+b*x+c*w)));
  return target;
 }
 return {real,dual,update,transform};
}

export function installSkinShader(material,deformer,count){
 const shaderCode=`
 uniform vec4 avReal[${count}];
 uniform vec4 avDual[${count}];
 vec3 avRotate(vec4 q,vec3 v){return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
 void avBlend(vec4 ids,vec4 weights,out vec4 q,out vec4 d){
  vec4 ref=avReal[int(ids.x)];q=vec4(0.0);d=vec4(0.0);
  for(int i=0;i<4;i++){int j=int(ids[i]);float s=dot(ref,avReal[j])<0.0?-1.0:1.0;q+=weights[i]*s*avReal[j];d+=weights[i]*s*avDual[j];}
  float len=max(length(q),0.0000001);q/=len;d/=len;d-=q*dot(q,d);
 }
 `;
 const position=`{
  vec4 avQ,avD;avBlend(skinIndex,skinWeight,avQ,avD);
  vec3 avT=2.0*(-avD.w*avQ.xyz+avQ.w*avD.xyz-cross(avD.xyz,avQ.xyz));
  transformed=avRotate(avQ,transformed)+avT;
 }`;
 material.onBeforeCompile=shader=>{
  shader.uniforms.avReal={value:deformer.real};shader.uniforms.avDual={value:deformer.dual};
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>',shaderCode).replace('#include <skinbase_vertex>','').replace('#include <skinning_vertex>',position).replace('#include <skinnormal_vertex>','{vec4 avQ,avD;avBlend(skinIndex,skinWeight,avQ,avD);objectNormal=avRotate(avQ,objectNormal);\n#ifdef USE_TANGENT\nobjectTangent=avRotate(avQ,objectTangent);\n#endif\n}');
 };
 material.customProgramCacheKey=()=>`avatar-dq-1-${count}`;
 return material;
}
