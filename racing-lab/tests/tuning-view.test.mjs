import assert from 'node:assert/strict';
import {Box3,Vector3} from 'three';
import {createOriginalKartView} from '../src/kart-view.js';
import {KART} from '../../racing-core/kart/index.ts';
import {CONTACT} from '../../racing-core/contacts/index.ts';
import {readFileSync} from 'node:fs';
import {numericChecks} from './numeric-report.mjs';
const check=numericChecks(new URL('../SCALE-CHECKS.json',import.meta.url),'Kart scale and render authority');
check('The accepted kart fits its collision envelope at the unchanged meter scale','Measure the actual accepted kart geometry and wheel transforms in Node.','2.39m width,2.87m length,2.03m wheelbase,.38m wheel radius; conservative capsule differs by<4cm width/<20cm length.',()=>{
    const {root,wheels}=createOriginalKartView(),box=new Box3().setFromObject(root),size=box.getSize(new Vector3());
    assert(Math.abs(size.x-2.39)<1e-6);assert(Math.abs(size.z-2.87)<1e-6);
    const front=wheels.find(w=>w.front).node.position.z,rear=wheels.find(w=>!w.front).node.position.z;
    assert(Math.abs(front-rear-KART.wheelbase)<1e-12);assert(Math.abs(wheels[0].node.position.y-KART.wheelRadius)<1e-9);
    assert(Math.abs(size.x-2*CONTACT.radius)<.04);assert(Math.abs(size.z-2*(CONTACT.radius+CONTACT.halfLength))<.2);
    return {width:size.x,length:size.z,height:size.y,wheelbase:front-rear,wheelRadius:KART.wheelRadius,collisionWidth:2*CONTACT.radius,collisionLength:2*(CONTACT.radius+CONTACT.halfLength)};
});
check('The driving renderer reads checked state and does not integrate a second movement system','Inspect the production driving adapter after browser behavior checks.','Only test.advance owns simulation; interpolated sample drives presentation; Fast default and zoom lock preserved.',()=>{
    const source=readFileSync(new URL('../src/driving-test.js',import.meta.url),'utf8');
    assert(source.includes('test.advance(seconds, readDrivingInput('));assert(source.includes('pose = test.sample()'));
    assert(!/\.position\.(?:add|addScaledVector)|\.speed\s*[+*\/-]=/.test(source));assert(source.includes("? requestedProfile : 'fast'"));assert(source.includes('zoomEnabled: false'));
    return {simulationAuthority:'checked controller',renderSource:'interpolated sample',defaultProfile:'fast',drivingZoom:false};
});
