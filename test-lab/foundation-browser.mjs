import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {launchTestBrowser} from '../scripts/test-browser.mjs';

const root=resolve('dist'),prefix='/3D-World-4',errors=[],checks=[];
const server=createServer(async(req,res)=>{
    try {
        let path=new URL(req.url,'http://local').pathname;
        if(path==='/favicon.ico'){res.writeHead(204).end();return;}
        assert(path.startsWith(prefix+'/'));path=path.slice(prefix.length);
        if(path.endsWith('/'))path+='index.html';
        const file=resolve(root,'.'+path);assert(file.startsWith(root+sep));
        res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp4':'video/mp4','.webmanifest':'application/manifest+json','.png':'image/png'})[extname(file)]??'application/octet-stream');
        res.end(await readFile(file));
    }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
let browser;
try {
    browser=await launchTestBrowser();
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    await context.addInitScript(()=>{localStorage.setItem('skeletonAvatar','game');localStorage.setItem('skeletonQuality','low');});
    const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
    const readme=await readFile('README.md','utf8');
    function documentedURL(label){
        const line=readme.split('\n').find(line=>line.includes('['+label+']('));assert(line,'Missing documented link: '+label);
        const href=line.slice(line.indexOf('['+label+'](')+label.length+3).split(')')[0],url=new URL(href);
        assert.equal(url.pathname.startsWith(prefix+'/'),true);
        return origin+url.pathname+url.search;
    }
    await page.goto(documentedURL('Inspect the tracks'));
    await page.waitForFunction(()=>window.testLabReady,undefined,{timeout:90000});
    assert.equal(await page.evaluate(()=>testLab.getState().subject),'tracks');
    assert.equal(await page.evaluate(()=>Boolean(testLab.frame.contentWindow.drivingLabReady)),false);
    assert.equal(await page.locator('#driving-link').count(),1);
    await page.locator('#driving-link').click();
    await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
    assert.equal(await page.title(),'Driving test');
    assert.equal(await page.evaluate(()=>drivingLab.test.controller.profile.id),'fast');
    checks.push('The documented inspection link opens Tracks; its driving link opens the actual Fast driving test.');

    await page.goto(documentedURL('Drive the Racing Lab'));
    await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
    assert.equal(await page.title(),'Driving test');
    await page.goto(origin+prefix+'/test-lab/?test=driving&track=winding&handling=fast');
    await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
    assert.equal(new URL(page.url()).pathname,prefix+'/racing-lab/');
    assert.equal(await page.evaluate(()=>drivingLab.getState().trackId),'winding');
    checks.push('The README driving link and old driving bookmarks open driving; track and handling selections survive.');

    await page.goto(origin+prefix+'/motion-lab/');await page.waitForFunction(()=>window.motionLabReady);
    await page.keyboard.down('e');await page.waitForFunction(()=>motionLab.input.getState().strength===1);
    await page.evaluate(()=>document.addEventListener('keyup',event=>event.stopImmediatePropagation(),{capture:true,once:true}));
    await page.keyboard.up('e');await page.waitForFunction(()=>motionLab.input.getState().strength===0);
    checks.push('A real keyboard release clears movement even when document handlers interrupt the release.');

    const yaw=await page.evaluate(()=>motionLab.getState().camera.yaw),stage=await page.locator('#stage').boundingBox();
    await page.mouse.move(250,stage.y+200);await page.mouse.down({button:'right'});
    await page.mouse.move(290,stage.y+215,{steps:3});await page.mouse.up({button:'right'});
    await page.waitForFunction(before=>Math.abs(motionLab.getState().camera.yaw-before)>.1,yaw);
    assert.equal(await page.evaluate(()=>motionLab.input.pointers.size),0);
    checks.push('Existing right-button mouse look still turns the camera and releases cleanly.');

    const cdp=await context.newCDPSession(page),box=await page.locator('#stage').boundingBox();
    await page.evaluate(()=>{
        const canvas=motionLab.renderer.domElement;
        canvas.setPointerCapture=()=>{throw Error('Test: browser denied capture');};
        document.addEventListener('pointerup',event=>event.stopImmediatePropagation(),{capture:true});
    });
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:75,y:box.y+300}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:75,y:box.y+240}]});
    await page.waitForFunction(()=>motionLab.input.getState().strength===1);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>motionLab.input.getState().strength===0&&motionLab.input.pointers.size===0);
    checks.push('Native touch still works when pointer capture fails; a globally observed release clears the stick.');

    const labURL=new URL(documentedURL('Open Test Lab'));labURL.searchParams.set('test','skeleton');
    await page.goto(labURL.href);await page.waitForFunction(()=>window.testLabReady,undefined,{timeout:90000});
    assert.equal(await page.evaluate(()=>testLab.frame.contentWindow.skeletonLab.avatarMode),'game');
    assert(await page.locator('#driving-help').isHidden());
    for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
        await page.setViewportSize(viewport);
        await page.getByRole('button',{name:'Isometric',exact:true}).click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        assert.equal(await page.getByRole('button',{name:'Isometric',exact:true}).getAttribute('aria-pressed'),'true');
    }
    assert.equal(await page.locator('#video-panel video').count(),0);
    checks.push('The existing Game avatar, shared Isometric inspection and empty video section load at phone and desktop sizes.');
    assert.deepEqual(errors,[]);
    const directory=process.env.TEST_REPORT_DIR??resolve('.test-results/lab-foundations');await mkdir(directory,{recursive:true});
    await writeFile(resolve(directory,'routes-and-input.json'),JSON.stringify({passed:true,checks,pageErrors:errors},null,2)+'\n');
    for(const check of checks)console.log('PASS: '+check);
}finally{await browser?.close();await new Promise(done=>server.close(done));}
