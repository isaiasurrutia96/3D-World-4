import {PlayableRun,TUNING} from '../run-test/controller.js';
import {WalkingMotion,WALK,walkContactAt} from './motion.js';
export {TUNING};
export class PlayableWalk extends PlayableRun{
 constructor(){super({motionFactory:()=>new WalkingMotion(),cycle:WALK.cycle,contactAt:walkContactAt});}
 step(dt,x,z){if(this.activity===0&&this.speed===0&&Math.hypot(x,z)>.01)this.phase=.25;super.step(dt,x,z);this.runBlend=0;}
 getState(){return {...super.getState(),gait:'walk',cycle:WALK.cycle};}
}
