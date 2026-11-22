import {existsSync} from 'node:fs';
import {chromium, webkit} from 'playwright';

// CI uses Playwright's pinned browser. The cloud desktop can reuse its
// installed Chromium; an explicit path also supports other developer machines.
export function launchTestBrowser(engine='chromium') {
    if(engine==='webkit')return webkit.launch();
    if(engine!=='chromium')throw new RangeError('Unsupported test browser: '+engine);
    const executablePath=process.env.TEST_CHROMIUM_PATH||(!process.env.CI&&existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
    return chromium.launch({executablePath,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
}
