import * as T from 'three';

// Smooth the cut's lighting across irregular cap/shell triangle areas.
// This changes normals only; fitted vertices, joint points and topology stay exact.
export function smoothShoulderTrimNormals(g,{slope,intercept,band=.009}){
 const p=g.attributes.position,n=g.attributes.normal,I=g.index.array,nodes=[],ids=[],map=new Map();
 for(const i of new Set(I)){const v=[p.getX(i),p.getY(i),p.getZ(i)],key=v.map(x=>Math.round(x/1e-7)).join(',');if(!map.has(key)){map.set(key,nodes.length);nodes.push({ids:[],links:new Set(),weight:(1-T.MathUtils.smoothstep((v[0]-slope*v[1]-intercept)/Math.hypot(1,slope),0,band))*T.MathUtils.smoothstep(v[1],.006,.025)});}ids[i]=map.get(key);nodes[ids[i]].ids.push(i);}
 for(let i=0;i<I.length;i+=3){const f=[ids[I[i]],ids[I[i+1]],ids[I[i+2]]];for(let k=0;k<3;k++)nodes[f[k]].links.add(f[(k+1)%3]).add(f[(k+2)%3]);}
 const source=new Float64Array(nodes.length*3);for(const [j,node] of nodes.entries()){const i=node.ids[0];source.set([n.getX(i),n.getY(i),n.getZ(i)],3*j);node.links=[...node.links].filter(i=>i!==j);}
 function energy(values){let sum=0,count=0;for(let i=0;i<nodes.length;i++)for(const j of nodes[i].links)if(j>i&&nodes[i].weight>.5&&nodes[j].weight>.5){for(let k=0;k<3;k++)sum+=(values[3*i+k]-values[3*j+k])**2;count++;}return count?sum/count:0;}
 let field=source.slice();for(let pass=0;pass<48;pass++){
  const next=field.slice();for(let i=0;i<nodes.length;i++){const {weight,links}=nodes[i];if(!weight||!links.length)continue;for(let k=0;k<3;k++){let sum=0;for(const j of links)sum+=field[3*j+k];next[3*i+k]+=weight*.5*(sum/links.length-field[3*i+k]);}const length=Math.hypot(next[3*i],next[3*i+1],next[3*i+2])||1;for(let k=0;k<3;k++)next[3*i+k]/=length;}field=next;
 }
 for(const [j,node] of nodes.entries())if(node.weight>0)for(const i of node.ids)n.setXYZ(i,field[3*j],field[3*j+1],field[3*j+2]);
 n.needsUpdate=true;return {before:energy(source),after:energy(field)};
}
