import {execFileSync} from 'node:child_process';
import {buildStudyPage} from '../scripts/bake-study.mjs';
import {createWristStudy} from './src/study.js';
execFileSync(process.execPath,['--test','wrist-lab/tests/study.test.mjs','tests/study-asset.test.mjs'],{stdio:'inherit'});
await buildStudyPage('wrist-lab',createWristStudy({stage:'molded'}));
