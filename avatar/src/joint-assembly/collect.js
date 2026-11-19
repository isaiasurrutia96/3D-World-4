// Build-time only. Never import the procedural studies in a phone viewer.
import {createShoulderDesign} from '../joints/shoulder-design.js';
import {createHipDesign} from '../joints/hip-design.js';
import {createKneeDesign} from '../joints/knee-design.js';
import {createElbowDesign} from '../joints/elbow-design.js';
import {createWristStudy} from '../../../wrist-lab/src/study.js';
import {createFootStudy} from '../../../foot-lab/src/foot-study.js';
import {createSkeletonAvatar} from '../../../skeleton-test/attach.js';
import {meshRecord} from './source-record.js';
export function collectApprovedJointParts(){
 const sources={},baseline={};
 for(const [name,create,select]of [
  ['shoulder',createShoulderDesign,['torso','upperArm','ball']],['hip',createHipDesign,['thighL','ballL']],['knee',createKneeDesign,['calf','ball']],['elbow',createElbowDesign,['forearm','ball']],['wrist',()=>createWristStudy({stage:'molded'}),['hand','ball']],['ankle',()=>createFootStudy({ball:true,calfSocket:true,seatCalf:true}),['foot','ankleBall']]
 ]){const study=create();for(const key of select)sources[name+'.'+key]=meshRecord(study[key]);const geometries=new Set(),materials=new Set();study.group.traverse(m=>{if(m.isMesh){geometries.add(m.geometry);materials.add(m.material);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
 const original=createSkeletonAvatar();for(const part of original.attached)baseline[part.label]={...meshRecord(part.mesh,part.rest),bone:part.bone};
 return {sources,baseline};
}
