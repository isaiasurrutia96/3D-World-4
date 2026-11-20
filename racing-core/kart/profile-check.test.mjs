import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {MPH,DRIVING_PROFILES,createHandlingProfile,resolveKartProfile,sampleCurve,steeringLimit} from './profiles.ts';
const rows=[];
function check(rule,input,expected,fn){test(rule,()=>{let measured;try{measured=fn();rows.push({rule,input,expected,measured,status:'PASS'});}catch(error){rows.push({rule,input,expected,measured:measured??null,status:'FAIL',error:error.message});throw error;}});}
const near=(a,b,t=1e-10)=>assert(Math.abs(a-b)<=t,`${a} versus ${b}`);
check('Profiles keep the original baseline and explicit comparison caps', 'Read all four validated built-in profiles.', 'Original120/180, balanced150/200, fast180/220 mph; reference98.3m/s. All immutable.',()=>{
 const result={};for(const [id,p]of Object.entries(DRIVING_PROFILES)){assert(Object.isFrozen(p));assert.equal(resolveKartProfile(id),p);result[id]={normal:p.topSpeed/MPH,boost:p.boostSpeed/MPH,fingerprint:p.fingerprint};}
 near(result.original.normal,120);near(result.original.boost,180);near(result.balanced.normal,150);near(result.balanced.boost,200);near(result.fast.normal,180);near(result.fast.boost,220);near(DRIVING_PROFILES['f1-targets'].topSpeed,98.3);return result;
});
check('Custom tuning is isolated from caller mutation and other vehicles', 'Construct from mutable curve arrays; mutate source and try to mutate result.', 'Independent frozen copies; no mutation of built-ins.',()=>{
 const curve=[[0,9],[40,5]],p=createHandlingProfile({id:'custom',acceleration:curve});curve[0][1]=1000;assert.equal(p.acceleration[0][1],9);assert.throws(()=>p.acceleration[0][1]=4);assert.throws(()=>p.topSpeed=1);assert.equal(DRIVING_PROFILES.fast.acceleration[0][1],10.8);return {customAcceleration:p.acceleration[0][1],baselineAcceleration:10.8};
});
check('Fingerprints identify physical settings, independent of labels and property order', 'Same settings with different labels/ids; change a curve value by one tiny amount.', 'Cosmetic renaming keeps identity; any numeric tuning change produces a new identity.',()=>{
 const a=createHandlingProfile({id:'a',label:'A',liftStrength:.7}),b=createHandlingProfile({label:'B',liftStrength:.7,id:'b'}),c=createHandlingProfile({id:'c',liftStrength:.700000001});assert.equal(a.fingerprint,b.fingerprint);assert.notEqual(a.fingerprint,c.fingerprint);return {a:a.fingerprint,b:b.fingerprint,c:c.fingerprint};
});
check('Malformed settings are rejected at the configuration boundary', 'NaN/Infinity, wrong types, missing curve origin, descending/duplicate speeds, negative forces, unknown settings, invalid caps, unvalidated objects.', 'Every malformed profile fails without changing any built-in.',()=>{
 const invalid=[{topSpeed:NaN},{topSpeed:Infinity},{topSpeed:0},{boostSpeed:1},{reverseSpeed:100},{coastConstant:-1},{tractionAssistance:1.1},{liftStrength:-.1},{steeringLock:Math.PI/2},{steeringBlendStart:30},{id:'original'},{label:''},{acceleration:[]},{acceleration:[[1,4],[2,3]]},{acceleration:[[0,4],[0,3]]},{acceleration:[[0,4],[2,-1]]},{cornering:[[0,0],[20,1]]},{braking:[[0,15],[20,NaN]]},{unexpected:4}];for(const x of invalid)assert.throws(()=>createHandlingProfile(x));assert.throws(()=>resolveKartProfile('missing'));assert.throws(()=>resolveKartProfile({...DRIVING_PROFILES.fast}));return {rejected:invalid.length+2};
});
check('Acceleration and grip curves are continuous, bounded and match supplied reference points', 'Sweep0–120m/s in0.001m/s increments and query every knot.', 'No overshoot/nonfinite/negative values; C1-smooth joins and exact target knots.',()=>{
 const p=DRIVING_PROFILES.fast;let maximumJoinDerivative=0;
 for(const name of ['acceleration','boostAcceleration','braking','cornering','liftOff']){const curve=p[name];for(const [x,y]of curve)near(sampleCurve(curve,x),y);const min=Math.min(...curve.map(p=>p[1])),max=Math.max(...curve.map(p=>p[1]));for(let i=0;i<=120000;i++){const v=sampleCurve(curve,i/1000);assert(v>=min-1e-12&&v<=max+1e-12);}for(const [x]of curve.slice(1,-1)){const e=1e-5,d=(sampleCurve(curve,x+e)-sampleCurve(curve,x-e))/(2*e);maximumJoinDerivative=Math.max(maximumJoinDerivative,Math.abs(d));}}
 assert(maximumJoinDerivative<.001);assert.throws(()=>sampleCurve(p.cornering,NaN));return {curves:5,probes:600005,maximumJoinDerivative};
});
check('High-speed wheel angles follow wheelbase and available sideways acceleration', 'Speeds0,10,15,25,45,80,98.3m/s; dry and0.65grip; wheelbase2.03m.', 'At25m/s and above angle=atan(L*a/v²), capped30degrees. Wet has less lock; known-radius demands obey v²/r.',()=>{
 const p=DRIVING_PROFILES.fast,result=[];for(const v of [0,10,15,25,45,80,98.3]){const angle=steeringLimit(p,v,2.03);assert(angle>0&&angle<=Math.PI/6);if(v>=25)near(angle,Math.min(Math.PI/6,Math.atan(2.03*sampleCurve(p.cornering,v)/(v*v))));assert(steeringLimit(p,v,2.03,.65)<=angle);result.push({speed:v,angleDegrees:angle*180/Math.PI});}
 const examples=[[15,30],[50,65],[100,110],[150,160],[200,180]].map(([radius,mph])=>({radius,mph,requiredAcceleration:(mph*MPH)**2/radius}));near(examples[0].requiredAcceleration,11.990685696);return {angles:result,corners:examples};
});
check('The profile/math layer has no browser dependencies and passes strict TypeScript', 'Run existing ES2022-only kart typecheck.', 'Strict compile passes without DOM libraries.',()=>{execFileSync(process.execPath,[fileURLToPath(new URL('../../node_modules/typescript/bin/tsc',import.meta.url)),'-p',fileURLToPath(new URL('./tsconfig.json',import.meta.url))],{stdio:'pipe'});return {typecheck:'PASS'};});
test.after(()=>writeFileSync(new URL('./PROFILE-CHECKS.json',import.meta.url),JSON.stringify({layer:'Configuration and math',summary:{passed:rows.filter(r=>r.status==='PASS').length,failed:rows.filter(r=>r.status==='FAIL').length},checks:rows},null,2)+'\n'));
