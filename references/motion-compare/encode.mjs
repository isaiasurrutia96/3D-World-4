import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const output='public/references/motion-compare',input='/tmp/motion-compare-render/frames/%03d.png';await mkdir(output,{recursive:true});
function ffmpeg(args){const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
ffmpeg(['-loop','1','-framerate','90','-i',input,'-t',String(77/90*5),'-r','60','-c:v','libx264','-threads','2','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',output+'/comparison.mp4']);
ffmpeg(['-framerate','45','-i',input,'-filter_complex_threads','1','-filter_complex','fps=25,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a','-loop','0',output+'/comparison-slow.gif']);
ffmpeg(['-i',input.replace('%03d','000'),'-frames:v','1','-q:v','2',output+'/poster.jpg']);
const sha256={};for(const file of ['comparison.mp4','comparison-slow.gif','poster.jpg'])sha256[file]=createHash('sha256').update(await readFile(output+'/'+file)).digest('hex');
await writeFile(output+'/SOURCE.json',JSON.stringify({sourceAnimation:'Same original SM64 animation 0x48 as the existing Mario reference',revision:'9921382a68bb0c865e5e45eb594d9c64db59b1af',avatarCheckpoint:'avatar-checkpoint-2-2026-11-17',sync:'Both views burned into a single video, source frame f paired with source frame f, no phase offsets. One shared player controls both.',...JSON.parse(await readFile('/tmp/motion-compare-metrics.json','utf8')),sha256},null,2)+'\n');console.log('Encoded synchronized comparison.');
