import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {CYCLE} from './retarget.js';

// Run after test.mjs and capture.mjs. ffmpeg and Chromium are build-time only.
const output='public/references/avatar-walk',input='/tmp/avatar-walk-render/frames/%03d.png';await mkdir(output,{recursive:true});
function ffmpeg(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
ffmpeg(['-loop','1','-framerate','90','-i',input,'-t',String(CYCLE*5),'-r','60','-c:v','libx264','-threads','2','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',output+'/walk.mp4']);
ffmpeg(['-framerate','45','-i',input,'-filter_complex_threads','1','-filter_complex','fps=25,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0',output+'/walk-slow.gif']);
ffmpeg(['-i',input.replace('%03d','000'),'-frames:v','1','-q:v','2',output+'/poster.jpg']);
const metrics=JSON.parse(await readFile('/tmp/avatar-walk-metrics.json','utf8')),sha256={};
for(const file of ['walk.mp4','walk-slow.gif','poster.jpg'])sha256[file]=createHash('sha256').update(await readFile(output+'/'+file)).digest('hex');
await writeFile(output+'/SOURCE.json',JSON.stringify({avatarCheckpoint:'avatar-checkpoint-2-2026-11-17',sourceAnimation:{repository:'n64decomp/sm64',revision:'9921382a68bb0c865e5e45eb594d9c64db59b1af',animation:'MARIO_ANIM_WALKING (0x48)'},adaptation:'Original step timing, foot recovery progression and shoulder/elbow curves. Stride, hip height, clearance and IK use the saved avatar’s measured bones. Contact targets are fixed in world space. No original Mario meshes or textures. Not yet integrated into joystick locomotion.',...metrics,sha256},null,2)+'\n');
console.log('Encoded normal-speed video and half-speed GIF.');
