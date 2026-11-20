/** Quantified arcade-grip change; the prior approved profile is the control. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createKartController,KART,kartVelocity} from './index.ts';
import {readDrivingInput} from '../testing/drive.ts';
import {DRIVING_PROFILES,PREVIOUS_FAST_PROFILE,MPH,sampleCurve,steeringLimit} from './profiles.ts';
const rates=[30,60,120,144],rows=[],flat={heightAt:()=>0};
const speed=s=>Math.hypot(s.speed,s.lateralSpeed);
const near=(a,b,e=1e-9)=>assert(Math.abs(a-b)<=e,`${a} versus ${b}`);
const make=(profile=DRIVING_PROFILES.fast,initial={})=>createKartController({world:flat,profile,initial});
function run(c,seconds,fps,command,observe=()=>{}) {
    const input=(tick,t,s)=>{observe(s,tick);return typeof command==='function'?command(tick,t,s):command;};
    for(let i=0;i<Math.ceil(seconds*fps-1e-9);i++) c.advance(Math.min(1/fps,seconds-i/fps),input);
    observe(c.state,c.clock.ticks);return c.state;
}
function equalStates(group){for(const row of group.slice(1))assert.deepEqual(row.state,group[0].state);}
function check(rule,input,expected,measure){test(rule,()=>{let measured;try{measured=measure();rows.push({rule,input,expected,measured,status:'PASS'});}catch(error){rows.push({rule,input,expected,measured:measured??null,status:'FAIL',error:error.message});throw error;}});}
check('Only cornering and steering response change from the exact approved Fast setup',
    'Compare every physical setting and pin previous Fast and F1 fingerprints.',
    'Six deliberate handling changes; all speed/pedal/braking/boost/surface settings identical; both reference hashes unchanged.',()=>{
        const before=PREVIOUS_FAST_PROFILE,after=DRIVING_PROFILES.fast;
        assert.equal(before.fingerprint,'kart-v1-a86c3ae8d1936d52');
        assert.equal(DRIVING_PROFILES['f1-targets'].fingerprint,'kart-v1-b2666c008706e548');
        const changed=[];
        for(const key of Object.keys(before)){
            if(['id','label','fingerprint'].includes(key))continue;
            if(JSON.stringify(before[key])!==JSON.stringify(after[key]))changed.push(key);
        }
        assert.deepEqual(changed.sort(),['cornering','steeringRiseSeconds','steeringReleaseSeconds','yawResponseSeconds','yawAcceleration','slipResponseSeconds'].sort());
        assert.notEqual(after.fingerprint,before.fingerprint);
        assert(Object.isFrozen(before)&&Object.isFrozen(before.cornering));
        return {changed,previousFingerprint:before.fingerprint,currentFingerprint:after.fingerprint,f1Fingerprint:DRIVING_PROFILES['f1-targets'].fingerprint};
    });
check('Both live speed profiles get stronger grip without altering speed caps or low-speed lock',
    'Sweep0–120m/s in.01m/s increments; compare Fast/Balanced with the prior profile.',
    'Exactly twice lateral budget, unchanged30degree low-speed lock; wheel limits remain finite and continuous.',()=>{
        let maximumGripError=0,maximumWheelStep=0;
        for(const profile of[DRIVING_PROFILES.fast,DRIVING_PROFILES.balanced]){
            let previous=steeringLimit(profile,0,KART.wheelbase);
            near(previous,Math.PI/6);
            for(let i=0;i<=12000;i++){
                const v=i/100,grip=sampleCurve(profile.cornering,v),old=sampleCurve(PREVIOUS_FAST_PROFILE.cornering,v),angle=steeringLimit(profile,v,KART.wheelbase);
                maximumGripError=Math.max(maximumGripError,Math.abs(grip-2*old));
                maximumWheelStep=Math.max(maximumWheelStep,Math.abs(angle-previous));previous=angle;
                assert(Number.isFinite(angle)&&angle>0&&angle<=Math.PI/6);
            }
        }
        assert(maximumGripError<1e-10);assert(maximumWheelStep<.002);
        near(DRIVING_PROFILES.fast.topSpeed,180*MPH);near(DRIVING_PROFILES.fast.boostSpeed,220*MPH);
        near(DRIVING_PROFILES.balanced.topSpeed,150*MPH);near(DRIVING_PROFILES.balanced.boostSpeed,200*MPH);
        return {speedProbes:24002,maximumGripError,maximumWheelStepRadians:maximumWheelStep};
    });
for(const mph of[180,220])check(`${mph}mph turns are half as wide at the same actual speed`,
    {fps:rates,script:`Start${mph}mph; Gas+full Right for1.5s; Boost held only for220mph. Measure travel curvature from world velocity changes during the final.5s.`},
    'New radius≤52% of previous; speed differs by<.1mph; actual velocity-derived radius and every physics field agree across all FPS.',()=>{
        const results=[];
        for(const profile of[PREVIOUS_FAST_PROFILE,DRIVING_PROFILES.fast]){
            const byRate=rates.map(fps=>{
                const c=make(profile,{speed:mph*MPH});let previousHeading=0,previousSpeed=mph*MPH,lastTick=-1,radius=0,count=0,minimumSpeed=Infinity;
                run(c,1.5,fps,{throttle:1,steer:1,boost:mph===220},(s,tick)=>{
                    if(tick===lastTick)return;lastTick=tick;
                    const velocity=kartVelocity(s),heading=Math.atan2(velocity.x,velocity.z),v=speed(s);
                    if(tick>120){const angle=Math.atan2(Math.sin(heading-previousHeading),Math.cos(heading-previousHeading));radius+=(v+previousSpeed)/2/(Math.abs(angle)*120);count++;minimumSpeed=Math.min(minimumSpeed,v);}
                    previousHeading=heading;previousSpeed=v;
                });
                return {fps,radius:radius/count,minimumMPH:minimumSpeed/MPH,state:c.state};
            });
            equalStates(byRate);for(const row of byRate.slice(1)){near(row.radius,byRate[0].radius);near(row.minimumMPH,byRate[0].minimumMPH);}
            results.push({profile:profile.id,radius:byRate[0].radius,minimumMPH:byRate[0].minimumMPH});
        }
        assert(results[1].radius/results[0].radius<=.52);near(results[1].minimumMPH,results[0].minimumMPH,.1);
        return {results,radiusRatio:results[1].radius/results[0].radius};
    });
check('Button steering reaches full input sooner and still releases smoothly',
    {fps:rates,script:'At rest hold Right.4s and then release.3s; observe the exact first full/zero physics tick.'},
    'Full input in≤.18s+one120Hz tick, centered in≤.14s+one tick; both faster than before; no stationary yaw or discontinuous input jumps.',()=>{
        const output=[];
        for(const profile of[PREVIOUS_FAST_PROFILE,DRIVING_PROFILES.fast]){
            const group=rates.map(fps=>{
                const c=make(profile);let full=null,zero=null,last=0,maximumStep=0;
                run(c,.4,fps,{steer:1},(s,tick)=>{if(full===null&&s.handling.steerInput>=1-1e-12)full=tick/120;maximumStep=Math.max(maximumStep,Math.abs(s.handling.steerInput-last));last=s.handling.steerInput;});
                run(c,.3,fps,{},(s,tick)=>{if(zero===null&&s.handling.steerInput===0)zero=tick/120-.4;maximumStep=Math.max(maximumStep,Math.abs(s.handling.steerInput-last));last=s.handling.steerInput;});
                near(c.state.yaw,0);assert(maximumStep<=KART.step/Math.min(profile.steeringRiseSeconds,profile.steeringReleaseSeconds)+1e-10);
                return {fps,full,zero,maximumStep,state:c.state};
            });
            equalStates(group);output.push({profile:profile.id,fullSeconds:group[0].full,releaseSeconds:group[0].zero,maxNormalizedStep:group[0].maximumStep});
        }
        assert(output[1].fullSeconds<=.18+KART.step);assert(output[1].releaseSeconds<=.14+KART.step);
        assert(output[1].fullSeconds<output[0].fullSeconds&&output[1].releaseSeconds<output[0].releaseSeconds);
        return output;
    });
check('A quick lane-change command responds more while preserving finite momentum',
    {fps:rates,script:'Start180mph; hold Gas+Right for.35s, then Gas straight for.65s.'},
    'More lateral movement than before; body yaw and travel change continuously; no single-tick yaw jump>.03rad.',()=>{
        const results=[];
        for(const profile of[PREVIOUS_FAST_PROFILE,DRIVING_PROFILES.fast]){
            const group=rates.map(fps=>{
                const c=make(profile,{speed:180*MPH});let previousYaw=0,maxYawStep=0;
                run(c,1,fps,(tick,t)=>({throttle:1,steer:t<.35?1:0}),(s,tick)=>{maxYawStep=Math.max(maxYawStep,Math.abs(s.yaw-previousYaw));previousYaw=s.yaw;});
                assert(maxYawStep<.03);return {fps,maxYawStep,state:c.state};
            });equalStates(group);results.push({profile:profile.id,lateralDistance:Math.abs(group[0].state.x),yaw:group[0].state.yaw,maximumYawStep:group[0].maxYawStep});
        }
        assert(results[1].lateralDistance>results[0].lateralDistance*1.7);return results;
    });
check('Steering release and repeated reversals settle without snapping or a persistent slide',
    {fps:rates,script:'Start180mph; Gas held; alternate full steering each.5s for4s, then straight2s; mirror the entire input.'},
    'Mirrored paths; no yaw discontinuity>.03rad; final yaw rate<.001rad/s and lateral speed<.01m/s; exact four-rate states.',()=>{
        const group=rates.map(fps=>{
            const a=make(undefined,{speed:180*MPH}),b=make(undefined,{speed:180*MPH});let lastYaw=0,maxYawStep=0;
            const direction=t=>t<4?(Math.floor(t/.5)%2?1:-1):0;
            run(a,6,fps,(tick,t)=>({throttle:1,steer:direction(t)}),s=>{maxYawStep=Math.max(maxYawStep,Math.abs(s.yaw-lastYaw));lastYaw=s.yaw;});
            run(b,6,fps,(tick,t)=>({throttle:1,steer:-direction(t)}));
            near(a.state.x,-b.state.x);near(a.state.z,b.state.z);near(a.state.yaw,-b.state.yaw);
            assert(maxYawStep<.03);assert(Math.abs(a.state.handling.yawRate)<.001);assert(Math.abs(a.state.lateralSpeed)<.01);
            return {fps,maxYawStep,state:a.state};
        });equalStates(group);return {maximumYawStep:Math.max(...group.map(r=>r.maxYawStep)),finalYawRate:group[0].state.handling.yawRate,finalLateralSpeed:group[0].state.lateralSpeed};
    });
check('Straight acceleration, lift-off, brake, reverse and boost traces are unchanged',
    {fps:rates,script:'16s: Gas6s, Gas+Boost2s, lift1s, brake1s, Reverse3s, brake1s, Gas2s; compare every authoritative tick with previous Fast.'},
    'Every position/speed/pedal/boost/contact value is identical; only steering-limit metadata and profile identity differ.',()=>{
        const fields=['x','y','z','yaw','speed','lateralSpeed','grounded','pitch','bank','wheelRotation','boostTime','contacts','impactYawRate','railContactTime','impactRecovery'];let samples=0;
        const command=t=>t<6?{throttle:1}:t<8?{throttle:1,boost:true}:t<9?{}:t<10?{brake:true}:t<13?{throttle:-1}:t<14?{brake:true}:{throttle:1};
        for(const fps of rates){const before=make(PREVIOUS_FAST_PROFILE),after=make();const trace=[];run(before,16,fps,(tick,t,s)=>{trace[tick]=s;return command(t);});run(after,16,fps,(tick,t,s)=>{for(const key of fields)assert.equal(s[key],trace[tick][key]);for(const key of['throttle','brake','lift','driveAcceleration','recoveryDeceleration','acceleration','brakingG'])assert.equal(s.handling[key],trace[tick].handling[key]);samples++;return command(t);});for(const key of fields)assert.equal(after.state[key],before.state[key]);}
        return {rates,comparedTicks:samples,maximumDifference:0};
    });
check('Releasing the brake smoothly frees more tire grip for turning',
    {fps:rates,script:'Start60m/s; hold full brake+Right for.6s. Compare continuing the brake with releasing it while Right stays held; no Gas.'},
    'After.1s, released brake has at least10% more measured lateral force and grip share; brake fades to0, no acceleration/boost or yaw snap, shared ellipse still≤1.',()=>{
        const results=[];
        for(const release of[false,true]){
            const group=rates.map(fps=>{
                const c=make(undefined,{speed:60});let previousHeading=0,previousSpeed=60,lastTick=-1,maximumEllipse=0,previousYaw=0,maximumYawStep=0,point=null;
                run(c,1,fps,(tick,t)=>({brake:t<.6||!release,steer:1}),(s,tick)=>{
                    if(tick===lastTick)return;lastTick=tick;const v=speed(s),velocity=kartVelocity(s),heading=Math.atan2(velocity.x,velocity.z);
                    if(tick>0){const delta=Math.atan2(Math.sin(heading-previousHeading),Math.cos(heading-previousHeading));const lateral=Math.abs(delta)*120*(previousSpeed+v)/2,tangent=(v-previousSpeed)*120,h=s.handling;
                        const ellipse=(tangent/h.longitudinalLimit)**2+(lateral/h.lateralLimit)**2;maximumEllipse=Math.max(maximumEllipse,ellipse);
                        assert(v<=previousSpeed+1e-9);if(tick===84)point={lateral,gripShare:lateral/h.lateralLimit,brake:h.brake,speed:v};
                    }
                    maximumYawStep=Math.max(maximumYawStep,Math.abs(s.yaw-previousYaw));previousYaw=s.yaw;previousHeading=heading;previousSpeed=v;assert.equal(s.boostTime,0);
                });
                assert(maximumEllipse<=1+1e-9);assert(maximumYawStep<.03);assert(point);
                return {fps,point,maximumEllipse,state:c.state};
            });equalStates(group);results.push({release,...group[0].point,maximumEllipse:Math.max(...group.map(r=>r.maximumEllipse))});
        }
        assert(results[1].lateral>results[0].lateral*1.1);assert(results[1].gripShare>results[0].gripShare*1.1);near(results[1].brake,0);return results;
    });
check('Releasing the phone Brake/Reverse button also restores turning grip',
    {fps:rates,script:'Use the actual driving input adapter: start60m/s, hold phone Right+Brake/Reverse for.6s, then release only Brake/Reverse; compare keeping it held.'},
    'At.7s the released pedal is centered, forward motion remains, and velocity-derived lateral force is at least10% greater than holding the brake; exact rate states.',()=>{
        const results=[];
        for(const release of[false,true]){
            const group=rates.map(fps=>{
                const c=make(undefined,{speed:60});let lastHeading=0,lastSpeed=60,lastTick=-1,lateral=0;
                run(c,.7,fps,(tick,t)=>readDrivingInput({actions:{right:true,reverse:t<.6||!release}},0),(s,tick)=>{
                    if(tick===lastTick)return;lastTick=tick;const velocity=kartVelocity(s),heading=Math.atan2(velocity.x,velocity.z),v=speed(s);
                    if(tick===84)lateral=Math.abs(Math.atan2(Math.sin(heading-lastHeading),Math.cos(heading-lastHeading)))*120*(v+lastSpeed)/2;
                    lastHeading=heading;lastSpeed=v;
                });
                assert(c.state.speed>0);assert.equal(c.state.boostTime,0);return {fps,lateral,state:c.state};
            });equalStates(group);results.push({release,lateral:group[0].lateral,normalizedPedal:group[0].state.handling.throttle,forwardSpeed:group[0].state.speed});
        }
        assert(results[1].lateral>results[0].lateral*1.1);near(results[1].normalizedPedal,0);return results;
    });
check('Releasing Gas before a turn progressively tightens the real travel path',
    {fps:rates,script:'Start180mph, Gas straight1s; then hold Right2s. Compare keeping Gas held with releasing it before entering the turn, for previous and stronger grip.'},
    'Lift reaches full by.25s without yaw/speed snaps; at1.5s into the turn the released-Gas radius is at least15% tighter than holding Gas; new lifted radius≤55% of the previous lifted radius; no boost and exact FPS states.',()=>{
        const results=[];
        for(const profile of[PREVIOUS_FAST_PROFILE,DRIVING_PROFILES.fast])for(const release of[false,true]){
            const group=rates.map(fps=>{
                const c=make(profile,{speed:180*MPH});let previousHeading=0,previousSpeed=180*MPH,previousYaw=0,lastTick=-1,point=null,liftAtQuarter=null,maximumYawStep=0,maximumRiseAfterLift=0;
                run(c,3,fps,(tick,t)=>({throttle:t<1||!release?1:0,steer:t<1?0:1}),(s,tick)=>{
                    if(tick===lastTick)return;lastTick=tick;const velocity=kartVelocity(s),heading=Math.atan2(velocity.x,velocity.z),v=speed(s);
                    maximumYawStep=Math.max(maximumYawStep,Math.abs(s.yaw-previousYaw));if(tick>120&&release)maximumRiseAfterLift=Math.max(maximumRiseAfterLift,v-previousSpeed);
                    if(tick===150)liftAtQuarter=s.handling.lift;
                    if(tick===300){const delta=Math.abs(Math.atan2(Math.sin(heading-previousHeading),Math.cos(heading-previousHeading)));point={radius:(v+previousSpeed)/2/(delta*120),mph:v/MPH,throttle:s.handling.throttle,lift:s.handling.lift};}
                    previousHeading=heading;previousSpeed=v;previousYaw=s.yaw;assert.equal(s.boostTime,0);
                });
                assert(maximumYawStep<.03);if(release){near(liftAtQuarter,1);assert(maximumRiseAfterLift<1e-7);near(point.throttle,0);}assert(point);
                return {fps,point,maximumYawStep,maximumRiseAfterLift,state:c.state};
            });equalStates(group);for(const row of group.slice(1))assert.deepEqual(row.point,group[0].point);
            results.push({profile:profile.id,release,...group[0].point,maximumYawStep:group[0].maximumYawStep,maximumRiseAfterLift:group[0].maximumRiseAfterLift});
        }
        const [oldHeld,oldLift,newHeld,newLift]=results;
        assert(oldLift.radius<oldHeld.radius*.85);assert(newLift.radius<newHeld.radius*.85);assert(newLift.radius<=oldLift.radius*.55);return results;
    });
test.after(()=>{const result={layer:'Stronger arcade handling',rates,fixedStep:KART.step,summary:{passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length},checks:rows};writeFileSync(new URL('./GRIP-CHECKS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');writeFileSync(new URL('./GRIP-CHECKS.md',import.meta.url),'# More arcade handling: measured checks\n\n'+result.summary.passed+' PASS, '+result.summary.failed+' FAIL.\n\n'+rows.map(r=>'## '+r.rule+'\n\nRule: '+r.expected+'\n\nScript: `'+JSON.stringify(r.input)+'`\n\nMeasured: `'+JSON.stringify(r.measured)+'`\n\n**'+r.status+'**'+(r.error?' '+r.error:'')+'\n').join('\n'));});
