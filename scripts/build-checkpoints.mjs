import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url)),source=resolve(root,'checkpoints');
for(const entry of await readdir(source,{withFileTypes:true})){
 if(!entry.isDirectory())continue;
 const folder=resolve(source,entry.name),manifest=JSON.parse(await readFile(resolve(folder,'CHECKPOINT.json'),'utf8'));
 const viewer=await readFile(resolve(folder,'index.html'));
 if(createHash('sha256').update(viewer).digest('hex')!==manifest.viewer_sha256)throw Error('Checkpoint viewer changed: '+entry.name);
 for(const [name,expected] of Object.entries(manifest.files_sha256??{})){
  const bytes=await readFile(resolve(folder,name));
  if(createHash('sha256').update(bytes).digest('hex')!==expected)throw Error('Checkpoint file changed: '+entry.name+'/'+name);
 }
 const destination=resolve(root,'dist/checkpoints',entry.name);await mkdir(destination,{recursive:true});
 await cp(folder,destination,{recursive:true});
 console.log('Preserved checkpoint at /checkpoints/'+entry.name+'/');
}
