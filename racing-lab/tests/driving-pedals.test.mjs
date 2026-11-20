import assert from 'node:assert/strict';
import {drivingPedals} from '../src/driving-pedals.js';
import {readDrivingInput,createDrivingTest} from '../../racing-core/testing/drive.ts';
import {numericChecks} from './numeric-report.mjs';
const check=numericChecks(new URL('../PEDAL-CHECKS.json',import.meta.url),'Driving-only analog pedal adapter');
const pad=(value,brake=0,id='Xbox Controller')=>({id,connected:true,mapping:'standard',buttons:Array.from({length:8},(_,i)=>({value:i===7?value:i===6?brake:0}))});
const sample={moveX:.3,moveZ:-.4,source:'gamepad',look:{x:0},actions:{gas:true,brake:true}};
const read=(s=sample,keys=new Set(),actions={},pads=[])=>readDrivingInput(drivingPedals(s,keys,actions,pads),0);
for(const id of ['Xbox Controller','DualSense Wireless Controller','Nintendo Switch Pro Controller'])
    check(id+': analog triggers survive the shared boolean snapshot','RT .1/.25/.5/1 and LT half those values; start with boolean gas/brake both true.','Continuous dead-zone-remapped pedal values; no boolean promotion to full throttle/brake.',()=>{
        const measured=[];
        for(const amount of [.1,.25,.5,1]) { const x=read(sample,new Set(),{},[pad(amount,amount/2,id)]); assert.equal(x.throttle,(amount-.05)/.95); assert.equal(x.brake,false); assert(Math.abs(x.brakeAmount-Math.max(0,(amount/2-.05)/.95))<1e-12); measured.push({raw:amount,throttle:x.throttle,brake:x.brakeAmount}); }
        return measured;
    });
check('Stick throttle and steering retain analog strength with trigger brake and no trigger gas','Stick X .3, forward .4, LT .5.','Throttle .4, steer .3, independent brake .47368421.',()=>{const x=read(sample,new Set(),{},[pad(0,.5)]);assert.equal(x.throttle,.4);assert.equal(x.steer,.3);assert.equal(x.brakeAmount,(.5-.05)/.95);assert.equal(x.brake,false);return x;});
check('Phone and keyboard commands override pedals while independent braking wins','E/Up, D/Down, phone Gas/Reverse, Space, and simultaneous phone Gas+Reverse with RT .3.','Digital Gas 1, Reverse -1, Space/both pedals brake 1; current commands retained.',()=>{
    for(const keys of [new Set(['KeyE']),new Set(['ArrowUp'])]) assert.equal(read(sample,keys,{},[pad(.3)]).throttle,1);
    for(const keys of [new Set(['KeyD']),new Set(['ArrowDown'])]) assert.equal(read(sample,keys,{},[pad(.3)]).throttle,-1);
    assert.equal(read(sample,new Set(),{gas:true},[pad(.3)]).throttle,1);assert.equal(read(sample,new Set(['Space']),{},[pad(.3)]).brakeAmount,1);assert.equal(read(sample,new Set(),{gas:true,reverse:true},[]).brakeAmount,1);assert.equal(read(sample,new Set(),{reverse:true},[]).throttle,-1);
    return {keyboardForwardCases:2,keyboardReverseCases:2,phoneGas:1,spaceBrake:1,dualPedalBrake:1,phoneReverse:-1};
});
check('Disconnected, unmapped and noisy triggers cannot create pedal commands','Disconnected pad, nonstandard mapping, .03 trigger noise, NaN trigger.','Zero throttle and zero brake in all four cases.',()=>{const empty={moveX:0,moveZ:0,actions:{}},measured=[];for(const p of [{...pad(1),connected:false},{...pad(1),mapping:''},pad(.03),pad(NaN)]){const x=read(empty,new Set(),{},[p]);assert.equal(x.throttle,0);assert.equal(x.brakeAmount,0);measured.push({throttle:x.throttle,brake:x.brakeAmount});}return measured;});
check('Real analog commands produce distinct checked vehicle acceleration','Feed RT .25/.5/1 through the real test adapter and120 physics ticks.','Three ordered speeds; adapter is wired into checked physics.',()=>{const results=[.25,.5,1].map(amount=>{const d=createDrivingTest('original',{profile:'fast'});for(let i=0;i<120;i++)d.advance(1/120,read(sample,new Set(),{},[pad(amount)]));return d.controller.state.speed;});assert(results[0]<results[1]&&results[1]<results[2]);return {speedsMetersPerSecond:results};});
