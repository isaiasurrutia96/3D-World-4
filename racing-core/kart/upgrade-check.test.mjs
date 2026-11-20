import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createKartController,KART,kartVelocity} from './index.ts';
import {DRIVING_PROFILES,createHandlingProfile,MPH,sampleCurve} from './profiles.ts';
const approved=JSON.parse(readFileSync(new URL('../../checkpoints/driving-1/PROFILES.json',import.meta.url),'utf8'));
const {mode,version,fingerprint,...settings}=approved.fast;
const before=createHandlingProfile(settings),after=DRIVING_PROFILES.fast;
const rates=[30,60,120,144],rows=[],flat={heightAt:()=>0};
const near=(a,b,t=1e-9)=>assert(Math.abs(a-b)<=t,`${a} versus ${b}`);
const speed=s=>Math.hypot(s.speed,s.lateralSpeed);
function run(profile,initial,seconds,fps,command,observe=()=>{}) {
    const c=createKartController({world:flat,profile,initial});
    for(let f=0;f<Math.ceil(seconds*fps-1e-9);f++)c.advance(Math.min(1/fps,seconds-f/fps),(tick,t,s)=>{observe(s,tick);return typeof command==='function'?command(tick,t,s):command;});
    observe(c.state,c.clock.ticks);return c;
}
function equal(group){for(const row of group.slice(1))assert.deepEqual(row.state,group[0].state);}
function check(rule,input,expected,fn){test(rule,()=>{let measured;try{measured=fn();rows.push({rule,input,expected,measured,status:'PASS'});}catch(error){rows.push({rule,input,expected,measured:measured??null,status:'FAIL',error:error.message});throw error;}});}
check('The small upgrade changes only Fast cornering grip and lateral settling',
 'Compare every field with the immutable approved checkpoint and all other built-in profiles.',
 'Exactly cornering and slipResponseSeconds change; reference profiles match the checkpoint; baseline fingerprint stays pinned.',()=>{
    assert.equal(before.fingerprint,fingerprint);assert.equal(fingerprint,'kart-v1-025c0e69a91e540a');
    const changed=Object.keys(settings).filter(key=>JSON.stringify(before[key])!==JSON.stringify(after[key]));
    assert.deepEqual(changed.sort(),['cornering','slipResponseSeconds']);
    // The archived JSON omits optional undefined fields; compare the same
    // serialized data, including its complete physics fingerprint.
    for(const id of ['original','balanced','f1-targets'])assert.deepEqual(JSON.parse(JSON.stringify(DRIVING_PROFILES[id])),approved[id]);
    assert.notEqual(after.fingerprint,before.fingerprint);assert(Object.isFrozen(after.cornering));
    return {changed,approvedFingerprint:before.fingerprint,upgradedFingerprint:after.fingerprint};
});
check('Grip improves by six percent without changing steering-button sensitivity',
 'Sample grip at 0–140 m/s in 0.01 m/s steps; compare every input-response setting with the approved kart.',
 '6% more lateral capacity at every speed; settling time .140 to .135 seconds; input rise/release, wheel lock and yaw response unchanged.',()=>{
    let maxError=0;
    for(let i=0;i<=14000;i++)maxError=Math.max(maxError,Math.abs(sampleCurve(after.cornering,i/100)-sampleCurve(before.cornering,i/100)*1.06));
    assert(maxError<1e-10);near(after.slipResponseSeconds,.135);
    for(const key of ['steeringResponse','steeringRiseSeconds','steeringReleaseSeconds','steeringLock','steeringBlendStart','steeringBlendEnd','yawResponseSeconds','yawAcceleration'])assert.deepEqual(after[key],before[key]);
    return {gripGainPercent:6,probes:14001,maxError,settlingBefore:before.slipResponseSeconds,settlingAfter:after.slipResponseSeconds};
});
check('Measured turn paths improve modestly rather than changing character',
 {fps:rates,script:'Start 90/130/180/220 mph on flat ground; Gas+full Right for 1.5 s, boost granted at 220; measure actual velocity-direction radius in the final .5 s.'},
 'New radius is 90–98% of approved radius, speeds differ by less than 1 mph; all four frame rates produce identical authoritative states and metrics.',()=>{
    const output=[];
    for(const mph of [90,130,180,220]){
        const results=[];
        for(const profile of [before,after]){
            const group=rates.map(fps=>{
                let heading=0,lastSpeed=mph*MPH,lastTick=0,sumRadius=0,count=0;
                const c=run(profile,{speed:mph*MPH,boostTime:mph===220?2:0},1.5,fps,{throttle:1,steer:1},(s,tick)=>{
                    const v=speed(s),velocity=kartVelocity(s),h=Math.atan2(velocity.x,velocity.z);
                    if(tick!==lastTick&&tick>120){const delta=Math.abs(Math.atan2(Math.sin(h-heading),Math.cos(h-heading)));assert(delta>0);sumRadius+=(v+lastSpeed)/2/(delta/KART.step);count++;}
                    heading=h;lastSpeed=v;lastTick=tick;
                });
                assert.equal(count,60);return {fps,radius:sumRadius/count,speedMPH:speed(c.state)/MPH,state:c.state};
            });equal(group);for(const row of group.slice(1))near(row.radius,group[0].radius);
            results.push({radius:group[0].radius,speedMPH:group[0].speedMPH});
        }
        const ratio=results[1].radius/results[0].radius;assert(ratio>.90&&ratio<.98,JSON.stringify({mph,results,ratio}));near(results[0].speedMPH,results[1].speedMPH,1);
        output.push({mph,before:results[0],after:results[1],radiusRatio:ratio});
    }return output;
});
check('A sideways disturbance settles slightly sooner without snapping velocity',
 {fps:rates,script:'Start forward 20 m/s with sideways 4 m/s, neutral controls for 2 s; observe first physics tick below .05 m/s sideways.'},
 'New settling occurs sooner but within 20% of approved time; no speed gain, no steering/yaw rotation, same state and time at each display rate.',()=>{
    const out=[];
    for(const profile of [before,after]){
        const group=rates.map(fps=>{
            let settled=null,lastSpeed=Math.hypot(20,4),maximumSpeedRise=0;
            const c=run(profile,{speed:20,lateralSpeed:4},2,fps,{},(s,tick)=>{
                if(settled===null&&Math.abs(s.lateralSpeed)<.05)settled=tick*KART.step;
                maximumSpeedRise=Math.max(maximumSpeedRise,speed(s)-lastSpeed);lastSpeed=speed(s);near(s.yaw,0);near(s.steering,0);
            });assert(settled!==null);assert(maximumSpeedRise<1e-9);return {fps,settled,maximumSpeedRise,state:c.state};
        });equal(group);for(const row of group.slice(1))near(row.settled,group[0].settled);
        out.push({seconds:group[0].settled,maximumSpeedRise:group[0].maximumSpeedRise});
    }
    assert(out[1].seconds<out[0].seconds);assert(out[1].seconds>out[0].seconds*.8);return out;
});
check('Straight acceleration, boost, braking, lift-off and reverse remain exact',
 {fps:rates,script:'For each speed 0/20/60/98.3488 m/s: Gas, boost, brake, lift, reverse phases over 6 seconds; compare every physics tick.'},
 'Every physical trajectory and speed matches the approved kart exactly; no changes to straight-line driving or caps.',()=>{
    const fields=['x','y','z','yaw','speed','lateralSpeed','steering','wheelRotation','verticalVelocity','boostTime','contacts','grounded'];let samples=0;
    for(const initialSpeed of [0,20,60,220*MPH]){
        const script=(tick,t)=>({throttle:t<2?1:t<4?0:-1,boost:t<.5,brake:t>=3&&t<4});
        const group=rates.map(fps=>{
            const trace=[];run(before,{speed:initialSpeed},6,fps,script,(s,tick)=>trace[tick]=s);
            const c=run(after,{speed:initialSpeed},6,fps,script,(s,tick)=>{for(const key of fields)assert.equal(s[key],trace[tick][key],`${key} tick ${tick}`);samples++;});return {fps,state:c.state};
        });equal(group);
    }return {comparedStates:samples,maximumPhysicalDifference:0,topMPH:after.topSpeed/MPH,boostMPH:after.boostSpeed/MPH};
});
test.after(()=>writeFileSync(new URL('./UPGRADE-CHECKS.json',import.meta.url),JSON.stringify({layer:'Modest tire and handling upgrade',rates,fixedStep:KART.step,summary:{passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length},checks:rows},null,2)+'\n'));
