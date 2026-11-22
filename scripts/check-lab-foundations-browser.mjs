import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const directory=process.env.TEST_REPORT_DIR??resolve(root,'.test-results/lab-foundations'),results=[];
mkdirSync(directory,{recursive:true});
const report=passed=>writeFileSync(resolve(directory,'browser-suites.json'),JSON.stringify({passed,results},null,2)+'\n');
report(false);
const suites=[
    ['Active Test Lab links and shared input release','test-lab/foundation-browser.mjs'],
    ['Shared marker keyboard, mouse, touch and controller input','motion-lab/test.mjs'],
    ['Track inspection and device layouts','racing-lab/tests/browser.mjs'],
    ['Driving controls, FPV and device layouts','racing-lab/tests/driving-browser.mjs'],
    ['Interrupted and repeated mobile steering release','racing-lab/tests/steering-release-browser.mjs'],
    ['Bridge-approach camera regression','racing-lab/tests/chase-camera-browser.mjs'],
    ['Installed-app URLs and assets','racing-lab/tests/app-browser.mjs'],
    ['Chromium app return and pause','racing-lab/tests/home-screen-browser.mjs','chromium'],
    ['WebKit app return and pause','racing-lab/tests/home-screen-browser.mjs','webkit'],
];
// Run sequentially: software WebGL tests should not compete for the CPU, and
// a failing or hung suite must stop the publish step rather than be skipped.
for(const [name,path,engine] of suites){
    console.log('\nChecking: '+name);
    const started=performance.now();
    const result=spawnSync(process.execPath,[path],{cwd:root,stdio:'inherit',env:{...process.env,TEST_BROWSER:engine??'chromium',TEST_REPORT_DIR:directory},timeout:300000});
    results.push({name,path,engine:engine??'chromium',passed:result.status===0,durationMS:Math.round(performance.now()-started),error:result.error?.message,signal:result.signal});
    report(false);
    if(result.error)console.error(result.error.message);
    if(result.status!==0){console.error('FAIL: '+name);process.exit(1);}
}
report(true);
console.log('\nPASS: all '+suites.length+' foundation browser suites. Browser emulation does not certify physical phones or controllers.');
