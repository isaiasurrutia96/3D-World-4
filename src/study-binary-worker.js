import {decodeStudyBinaryAsync,studyTransferables} from './study-binary.js';
self.onmessage=async({data:bytes})=>{
 try{const data=await decodeStudyBinaryAsync(bytes);self.postMessage({data},studyTransferables(data));}
 catch(error){self.postMessage({error:error.message});}
};
