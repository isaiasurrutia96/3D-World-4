import {execFileSync} from 'node:child_process';
import {buildStudyPage} from '../scripts/bake-study.mjs';
import {createElbowStudy} from './src/study.js';
execFileSync(process.execPath,['--test','elbow-lab/tests/study.test.mjs'],{stdio:'inherit'});
await buildStudyPage('elbow-lab',createElbowStudy());
