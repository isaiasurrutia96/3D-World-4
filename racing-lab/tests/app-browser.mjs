import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
// Serve under the real project prefix: Home Screen launches must not escape to the host root.
const prefix='/3D-World-4/',errors=[];
const server=createServer(async(q,r)=>{
    try{
        let path=new URL(q.url,'http://local').pathname;
        if(!path.startsWith(prefix))throw new Error('Outside project');
        path=path.slice(prefix.length);if(path.endsWith('/'))path+='index.html';
        r.setHeader('Content-Type',({'.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');
        r.end(await readFile(resolve('dist',path)));
    }catch{r.statusCode=404;r.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
    const page=await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
    page.on('pageerror',e=>errors.push(e.message));
    const base=`http://127.0.0.1:${server.address().port}${prefix}racing-lab/`;
    await page.goto(base+'?drive=1');await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
    const session=await page.context().newCDPSession(page),parsed=await session.send('Page.getAppManifest');
    assert.deepEqual(parsed.errors,[]);assert.equal(parsed.url,base+'manifest.webmanifest');
    const manifest=JSON.parse(parsed.data);assert.equal(manifest.display,'standalone');
    const assets=[...manifest.icons.map(icon=>icon.src),await page.locator('link[rel=apple-touch-icon]').getAttribute('href')];
    for(const asset of assets){const response=await page.request.get(new URL(asset,parsed.url).href);assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/^image\/png/);assert.equal((await response.body()).subarray(0,8).toString('hex'),'89504e470d0a1a0a');}
    assert.equal(await page.locator('meta[name=apple-mobile-web-app-capable]').getAttribute('content'),'yes');
    assert.equal(await page.locator('meta[name=apple-mobile-web-app-status-bar-style]').getAttribute('content'),'default');
    const start=new URL(manifest.start_url,parsed.url);assert.equal(start.pathname,prefix+'racing-lab/');
    await page.goto(start.href);await page.waitForFunction(()=>window.drivingLabReady&&window.motionLabReady);
    assert.equal(await page.title(),'Driving test');assert.equal(await page.locator('[data-view]').count(),6);
    await page.keyboard.down('e');await page.waitForFunction(()=>drivingLab.test.controller.state.speed>3);await page.keyboard.up('e');
    await page.keyboard.down('Space');await page.waitForFunction(()=>drivingLab.test.controller.state.speed===0);await page.keyboard.up('Space');
    await page.locator('.drive-videos-link').tap();await page.waitForFunction(()=>scrollY>0);
    assert.deepEqual(errors,[]);
    const checks=['Browser parses the standalone manifest without errors under the deployed project prefix.','Apple standalone metadata and all three PNG installation icons load successfully.','Home Screen start URL opens the actual driving test with six views; Gas, brake and scroll-to-videos work.'];
    await writeFile('racing-lab/APP-BROWSER-CHECKS.json',JSON.stringify({passed:true,checks,pageErrors:errors,limitation:'Actual iOS Add to Home Screen and native browser chrome require the user to launch the installed icon on their device.'},null,2)+'\n');
    for(const check of checks)console.log('PASS:',check);
}finally{await browser.close();server.close();}
