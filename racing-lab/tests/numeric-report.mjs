import test from 'node:test';
import {writeFileSync} from 'node:fs';
/** Small common report writer for the driving adapter/presentation checks. */
export function numericChecks(url, layer) {
    const checks = [];
    test.after(() => writeFileSync(url, JSON.stringify({layer,summary:{passed:checks.filter(c=>c.status==='PASS').length,failed:checks.filter(c=>c.status==='FAIL').length},checks},null,2)+'\n'));
    return (rule,input,expected,measure) => test(rule, () => {
        let measured;
        try { measured=measure(); checks.push({rule,input,expected,measured,status:'PASS'}); }
        catch(error) { checks.push({rule,input,expected,measured:measured??null,status:'FAIL',error:error.message}); throw error; }
    });
}
