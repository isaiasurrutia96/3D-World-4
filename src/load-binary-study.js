import {createStudyFromData} from './study-asset.js';
import {decodeStudyBinaryAsync} from './study-binary.js';

const cacheName='approved-study-bytes-v1';
async function verifiedBytes(response,sha256){
 if(!response.ok)throw Error('Could not load the saved avatar: '+response.status);
 const bytes=await response.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==sha256)throw Error('Saved avatar checksum mismatch');
 return bytes;
}
async function receive(url,sha256){
 let cache;
 try{cache=await globalThis.caches?.open(cacheName);}catch{/* Storage can be unavailable in private browsing. */}
 if(cache){
  try{const saved=await cache.match(url);if(saved)return await verifiedBytes(saved,sha256);}
  catch{try{await cache.delete(url);}catch{/* The network remains usable. */}}
 }
 const response=await fetch(url),copy=cache?response.clone():null,bytes=await verifiedBytes(response,sha256);
 if(copy)await cache.put(url,copy).catch(()=>{});
 return bytes;
}
function unpack(bytes,workerURL){
 if(!workerURL||typeof Worker!=='function')return decodeStudyBinaryAsync(new Uint8Array(bytes));
 return new Promise((resolve,reject)=>{
  const worker=new Worker(workerURL);
  worker.onmessage=({data})=>{worker.terminate();if(data.error)reject(Error(data.error));else resolve(data.data);};
  worker.onerror=event=>{worker.terminate();reject(Error(event.message||'Avatar decoder could not start'));};
  worker.postMessage(bytes,[bytes]);
 });
}
export async function loadBinaryStudyAsset(url,{sha256,workerURL}={}){
 performance.mark('study-asset-start');
 const bytes=await receive(url.href??String(url),sha256);performance.mark('study-asset-received');
 const data=await unpack(bytes,workerURL);performance.mark('study-asset-unpacked');
 const study=createStudyFromData(data);performance.mark('study-asset-ready');
 performance.measure('study-asset-decode','study-asset-received','study-asset-ready');
 performance.measure('study-asset-worker','study-asset-received','study-asset-unpacked');
 return study;
}
