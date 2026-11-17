import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
// Same observer used by Avatar Lab: capture bindings without editing the
// saved hand generator or changing its approved resting surface.
export function handBindPlugin(){
 const root=fileURLToPath(new URL('../../',import.meta.url)),approved=resolve(root,'avatar/src/hand-study/hand.js');
 return {name:'observe-running-hand-bind',setup(build){build.onResolve({filter:/^\.\/resting-digits\.js$/},args=>args.importer===approved?{path:resolve(root,'hand-lab/src/capture-rest.js')}:undefined);}};
}
