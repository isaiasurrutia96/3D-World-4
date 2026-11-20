import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createKartController,KART} from './index.ts';
import {createHandlingProfile,DRIVING_PROFILES,steeringResponse,steeringLimit,MPH} from './profiles.ts';
const rates=[30,60,120,144],rows=[],flat={heightAt:()=>0};
const before=createHandlingProfile({id:'before-progressive',label:'Before progressive steering',steeringResponse:undefined});
const near=(a,b,e=1e-9)=>assert(Math.abs(a-b)<=e,`${a} versus ${b}`);
const make=(profile=DRIVING_PROFILES.fast,initial={})=>createKartController({world:flat,profile,initial});
function run(c,seconds,fps,command,observe=()=>{}){
    const input=(tick,t,s)=>{observe(s,tick);return typeof command==='function'?command(tick,t,s):command;};
    for(let i=0;i<Math.ceil(seconds*fps-1e-9);i++)c.advance(Math.min(1/fps,seconds-i/fps),input);
    observe(c.state,c.clock.ticks);return c.state;
}
function equal(group){for(const row of group.slice(1))assert.deepEqual(row.state,group[0].state);}
function physical(state){const {fingerprint,...handling}=state.handling;return {...state,handling};}
function check(rule,input,expected,measure){test(rule,()=>{let measured;try{measured=measure();rows.push({rule,input,expected,measured,status:'PASS'});}catch(error){rows.push({rule,input,expected,measured:measured??null,status:'FAIL',error:error.message});throw error;}});}
check('Progressive steering is copied, frozen, validated and included in physics identity',
 'Construct with mutable nested settings; change caller data; compare reversed property order and reject malformed values.',
 'No caller alias; canonical identity; invalid settings rejected; prior Fast and F1 identities stay exact when shaping is absent.',()=>{
    const response={lowSpeedRiseSeconds:.7,lowSpeedExponent:1.4,blendStart:10,blendEnd:40},p=createHandlingProfile({id:'a',steeringResponse:response});
    response.lowSpeedRiseSeconds=9;near(p.steeringResponse.lowSpeedRiseSeconds,.7);assert.throws(()=>p.steeringResponse.lowSpeedExponent=2);
    const q=createHandlingProfile({id:'b',steeringResponse:{blendEnd:40,blendStart:10,lowSpeedExponent:1.4,lowSpeedRiseSeconds:.7}});assert.equal(p.fingerprint,q.fingerprint);
    assert.notEqual(p.fingerprint,createHandlingProfile({id:'c',steeringResponse:{...p.steeringResponse,lowSpeedExponent:1.41}}).fingerprint);
    const malformed=[null,[],{}, {...p.steeringResponse,lowSpeedRiseSeconds:0},{...p.steeringResponse,lowSpeedExponent:.9},{...p.steeringResponse,lowSpeedExponent:4},{...p.steeringResponse,blendStart:-1},{...p.steeringResponse,blendEnd:9},{...p.steeringResponse,blendEnd:NaN},{...p.steeringResponse,extra:1}];
    for(const value of malformed)assert.throws(()=>createHandlingProfile({steeringResponse:value}));
    assert.equal(before.fingerprint,'kart-v1-9addaf0b5acc2976');assert.equal(DRIVING_PROFILES['f1-targets'].fingerprint,'kart-v1-b2666c008706e548');
    return {rejected:malformed.length,previousFast:before.fingerprint,referenceF1:DRIVING_PROFILES['f1-targets'].fingerprint,active:DRIVING_PROFILES.fast.fingerprint};
});
check('Low-speed response blends continuously into the unchanged high-speed response',
 'Sweep0–140m/s in.001m/s steps, probe negative speeds and the exact12/45m/s transition endpoints.',
 'Rise stays .18–.5s and exponent1–1.35; monotonic smooth blend; high-speed endpoints exactly .18s/1.',()=>{
    const p=DRIVING_PROFILES.fast;let prior=steeringResponse(p,0),maxRiseStep=0,maxExponentStep=0;
    assert.deepEqual(prior,{riseSeconds:.5,exponent:1.35});assert.deepEqual(steeringResponse(p,12),prior);
    const mid=steeringResponse(p,28.5);near(mid.riseSeconds,.34);near(mid.exponent,1.175);
    for(let i=0;i<=140000;i++){
        const value=steeringResponse(p,i/1000);assert(value.riseSeconds>=.18&&value.riseSeconds<=.5);assert(value.exponent>=1&&value.exponent<=1.35);
        assert(value.riseSeconds<=prior.riseSeconds+1e-12);assert(value.exponent<=prior.exponent+1e-12);
        maxRiseStep=Math.max(maxRiseStep,Math.abs(value.riseSeconds-prior.riseSeconds));maxExponentStep=Math.max(maxExponentStep,Math.abs(value.exponent-prior.exponent));prior=value;
    }
    assert(maxRiseStep<.00002&&maxExponentStep<.00002);
    assert.deepEqual(steeringResponse(p,45),{riseSeconds:.18,exponent:1});assert.deepEqual(steeringResponse(p,-80),steeringResponse(p,80));assert.throws(()=>steeringResponse(p,NaN));
    return {probes:140001,maxRiseStep,maxExponentStep,midpoint:mid};
});
check('Brief low-speed steering presses make gentler real trajectory corrections',
 {fps:rates,script:'Start3/8/13m/s; Gas+Right for50/100/200ms; release steering and keep Gas for.5s. Compare the exact previous Fast setup.'},
 'Every correction remains positive and below35% of the previous yaw change; no stationary rotation or direction reversal; exact states at all rates.',()=>{
    const out=[];
    for(const v of[3,8,13])for(const hold of[.05,.1,.2]){
        const results=[];
        for(const profile of[before,DRIVING_PROFILES.fast]){
            const group=rates.map(fps=>{const c=make(profile,{speed:v});run(c,hold,fps,{throttle:1,steer:1});run(c,.5,fps,{throttle:1});return {fps,state:c.state};});equal(group);
            results.push({profile:profile.id,yaw:Math.abs(group[0].state.yaw),x:group[0].state.x});
        }
        assert(results[1].yaw>0);assert(results[1].yaw<results[0].yaw*.35);out.push({speed:v,hold,oldYawDegrees:results[0].yaw*180/Math.PI,newYawDegrees:results[1].yaw*180/Math.PI,ratio:results[1].yaw/results[0].yaw});
    }return out;
});
check('Longer holds progressively reach the full existing wheel angle',
 {fps:rates,script:'At rest hold Right .1/.25/.4/.6s; measure actual wheel angle; separately observe first full angle and release.'},
 'Angles strictly increase with hold duration, reach30degrees within.5s+one tick and center within.14s+one tick; yaw remains0; milestones must be observed.',()=>{
    const out=[];
    for(const seconds of[.1,.25,.4,.6]){
        const group=rates.map(fps=>{const c=make();run(c,seconds,fps,{steer:1});near(c.state.yaw,0);return {fps,state:c.state};});equal(group);out.push({seconds,degrees:group[0].state.steering*180/Math.PI});
    }
    for(let i=1;i<out.length;i++)assert(out[i].degrees>out[i-1].degrees);near(out.at(-1).degrees,30);
    const timings=rates.map(fps=>{
        const c=make();let full=null,zero=null,previousAngle=0,maxAngleStep=0;
        run(c,.8,fps,{steer:1},(s,tick)=>{if(full===null&&s.handling.steerInput>=1-1e-12)full=tick/120;maxAngleStep=Math.max(maxAngleStep,Math.abs(s.steering-previousAngle));previousAngle=s.steering;});
        run(c,.3,fps,{},(s,tick)=>{if(zero===null&&s.steering===0)zero=tick/120-.8;maxAngleStep=Math.max(maxAngleStep,Math.abs(s.steering-previousAngle));previousAngle=s.steering;});
        assert(Number.isFinite(full)&&Number.isFinite(zero),'Both full/center milestones must actually be reached');assert(full<=.5+KART.step);assert(zero<=.14+KART.step);near(c.state.yaw,0);assert(maxAngleStep<.05);
        return {fps,full,zero,maxAngleStep,state:c.state};
    });equal(timings);return {angles:out,firstFullSeconds:timings[0].full,releaseSeconds:timings[0].zero,maxAngleStep:timings[0].maxAngleStep};
});
check('Progressive steering alone does not alter high-speed driving traces',
 {fps:rates,script:'Start60/80.4672/98.3488m/s; Gas plus alternating analog steering for3s; compare the same current tire package with shaping disabled on every tick. Grant boost initially at220mph.'},
 'Above45m/s all physical state, inputs, angles, momentum and grip telemetry match bit for bit; only profile identity differs.',()=>{
    // Isolate steering shaping from the separately approved tire upgrade.
    const control=createHandlingProfile({id:'unshaped-current-tires',cornering:DRIVING_PROFILES.fast.cornering,slipResponseSeconds:DRIVING_PROFILES.fast.slipResponseSeconds,steeringResponse:undefined});
    let comparedTicks=0;const output=[];
    for(const v of[60,180*MPH,220*MPH]){
        const group=rates.map(fps=>{
            const initial={speed:v,boostTime:v>180*MPH?2:0},a=make(control,initial),b=make(undefined,initial),trace=[];
            const command=(tick,t)=>({throttle:1,steer:t<1?.6:t<2?-.4:0});
            run(a,3,fps,(tick,t,s)=>{trace[tick]=physical(s);return command(tick,t);});
            run(b,3,fps,(tick,t,s)=>{assert.deepEqual(physical(s),trace[tick]);comparedTicks++;return command(tick,t);});
            assert.deepEqual(physical(a.state),physical(b.state));return {fps,state:b.state};
        });equal(group);output.push({initialSpeed:v,finalSpeed:group[0].state.speed});
    }return {comparedTicks,maximumDifference:0,cases:output};
});
check('Gentle input remains analog, mirrored and independent of world orientation',
 {fps:rates,script:'At8m/s apply signed .2/.5/1 steering with .4 throttle for1s; mirror each run.'},
 'Stronger input gives stronger turning; left/right paths mirror; all rates agree and release returns to center.',()=>{
    const output=[];
    for(const amount of[.2,.5,1]){
        const group=rates.map(fps=>{const a=make(undefined,{speed:8}),b=make(undefined,{speed:8});run(a,1,fps,{throttle:.4,steer:amount});run(b,1,fps,{throttle:.4,steer:-amount});near(a.state.x,-b.state.x);near(a.state.z,b.state.z);near(a.state.yaw,-b.state.yaw);const yaw=Math.abs(a.state.yaw);run(a,1,fps,{throttle:.4});near(a.state.steering,0);return {fps,yaw,state:a.state};});equal(group);output.push({input:amount,yaw:group[0].yaw});
    }assert(output[0].yaw<output[1].yaw&&output[1].yaw<output[2].yaw);return output;
});
check('A genuinely hard held turn can still slide and spin, then recover after release',
 {fps:rates,script:'Start13m/s; Gas+full Right3s, then release Right and keep Gas2.5s; mirror the full input.'},
 'Peak sideways speed>5m/s and slip>0.5rad; body turns>PI; no yaw snap>.06rad/tick; after release sideways speed<.01m/s and yaw rate<.001rad/s.',()=>{
    const group=rates.map(fps=>{
        const c=make(undefined,{speed:13});let maximumSide=0,maximumSlip=0,previousYaw=0,maximumYawStep=0,releaseYaw=0;
        run(c,3,fps,{throttle:1,steer:1},s=>{maximumSide=Math.max(maximumSide,Math.abs(s.lateralSpeed));maximumSlip=Math.max(maximumSlip,Math.abs(s.handling.slipAngle));maximumYawStep=Math.max(maximumYawStep,Math.abs(s.yaw-previousYaw));previousYaw=s.yaw;});releaseYaw=c.state.yaw;
        run(c,2.5,fps,{throttle:1},s=>{maximumYawStep=Math.max(maximumYawStep,Math.abs(s.yaw-previousYaw));previousYaw=s.yaw;});
        assert(maximumSide>5);assert(maximumSlip>.5);assert(Math.abs(releaseYaw)>Math.PI);assert(maximumYawStep<.06);assert(Math.abs(c.state.lateralSpeed)<.01);assert(Math.abs(c.state.handling.yawRate)<.001);near(c.state.steering,0);
        const mirrored=make(undefined,{speed:13});run(mirrored,3,fps,{throttle:1,steer:-1});run(mirrored,2.5,fps,{throttle:1});near(c.state.x,-mirrored.state.x);near(c.state.z,mirrored.state.z);near(c.state.yaw,-mirrored.state.yaw);
        return {fps,maximumSide,maximumSlip,maximumYawStep,releaseYaw,state:c.state};
    });equal(group);return {peakSidewaysSpeed:group[0].maximumSide,peakSlipRadians:group[0].maximumSlip,rotationAtRelease:group[0].releaseYaw,maximumYawStep:group[0].maximumYawStep,finalSidewaysSpeed:group[0].state.lateralSpeed,finalYawRate:group[0].state.handling.yawRate};
});
check('The broad hard-turn release matrix does not leave neutral steering stuck',
 {fps:rates,speeds:[0,3,8,13,20,35,60,80,98],holds:[.1,.3,.6,1,2,4],script:'For every speed/hold, Gas+Right then release steering4s with Gas held or released. Observe all ticks after2s.'},
 '432 scenarios: wheel input centers; sideways speed<.01m/s and yaw rate<.001rad/s after2s; finite state and exact terminal states across FPS.',()=>{
    let worstSide=0,worstYaw=0,scenarios=0;
    for(const v of[0,3,8,13,20,35,60,80,98])for(const hold of[.1,.3,.6,1,2,4])for(const throttle of[0,1]){
        const group=rates.map(fps=>{
            const c=make(undefined,{speed:v});run(c,hold,fps,{throttle:1,steer:1});const releaseTick=c.clock.ticks;
            run(c,4,fps,{throttle},(s,tick)=>{if(tick-releaseTick>=240){worstSide=Math.max(worstSide,Math.abs(s.lateralSpeed));worstYaw=Math.max(worstYaw,Math.abs(s.handling.yawRate));near(s.steering,0);}});
            scenarios++;return {fps,state:c.state};
        });equal(group);
    }assert(worstSide<.01);assert(worstYaw<.001);return {scenarios,worstSidewaysSpeedAfter2s:worstSide,worstYawRateAfter2s:worstYaw};
});
check('Large initial sideways slip settles without steering in either direction',
 {fps:rates,angles:[30,60,89,90,91,120,179],script:'Initial30m/s world velocity at each signed angle from the body; Gas with neutral steering5s.'},
 'No spontaneous yaw; finite state; final sideways speed<.01m/s; left/right mirror and exact FPS states.',()=>{
    let worstSide=0;
    for(const angle of[30,60,89,90,91,120,179]){
        const group=rates.map(fps=>{
            const a=angle*Math.PI/180,c=make(undefined,{speed:30*Math.cos(a),lateralSpeed:30*Math.sin(a)}),mirror=make(undefined,{speed:30*Math.cos(a),lateralSpeed:-30*Math.sin(a)});
            run(c,5,fps,{throttle:1});run(mirror,5,fps,{throttle:1});near(c.state.yaw,0);near(mirror.state.yaw,0);near(c.state.x,-mirror.state.x);near(c.state.z,mirror.state.z);worstSide=Math.max(worstSide,Math.abs(c.state.lateralSpeed));return {fps,state:c.state};
        });equal(group);
    }assert(worstSide<.01);return {angles:7,signs:2,worstFinalSidewaysSpeed:worstSide};
});
test.after(()=>{const result={layer:'Progressive steering and slip recovery',rates,summary:{passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length},checks:rows};writeFileSync(new URL('./STEERING-CHECKS.json',import.meta.url),JSON.stringify(result,null,2)+'\n');writeFileSync(new URL('./STEERING-CHECKS.md',import.meta.url),'# Progressive steering and recovery\n\n'+result.summary.passed+' PASS, '+result.summary.failed+' FAIL.\n\n'+rows.map(r=>'## '+r.rule+'\n\nRule: '+r.expected+'\n\nScript: `'+JSON.stringify(r.input)+'`\n\nMeasured: `'+JSON.stringify(r.measured)+'`\n\n**'+r.status+'**'+(r.error?' '+r.error:'')+'\n').join('\n'));});
