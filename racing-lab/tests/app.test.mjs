import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
test('Home Screen launch opens the real driving test inside its own project scope',()=>{
    for(const base of ['https://example.com/racing-lab/','https://isaiasurrutia96.github.io/3D-World-4/racing-lab/']){
        const scope=new URL(manifest.scope,base),start=new URL(manifest.start_url,base),id=new URL(manifest.id,base);
        assert.equal(start.origin,scope.origin);assert.equal(start.pathname,scope.pathname);
        assert.equal(start.searchParams.get('drive'),'1');assert.equal(id.href,start.href);
        assert.equal(manifest.display,'standalone');assert.equal(manifest.theme_color,'#405363');
    }
});
test('Installed app icons are real PNGs at the declared Android and Apple sizes',async()=>{
    for(const icon of [...manifest.icons,{src:'icons/apple-touch-icon.png',sizes:'180x180'}]){
        const bytes=await readFile(new URL(icon.src,root));
        assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
        assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,icon.sizes);
    }
});
