import {createDrivingSimulation} from './driving-test.js';
import {createMotionLab} from '../../motion-lab/src/page.js';
import {createTrackPreview} from './track-preview.js';
const driving=new URLSearchParams(location.search).has('drive');
if(driving)createMotionLab({title:'Driving test',section:'Handling feel',createSimulation:createDrivingSimulation,helpText:'Arrows or E S D F: drive · Space: brake · Shift: boost · J L I K or drag: look · Wheel/pinch: zoom. Phone: hold Left/Right, Gas and Brake / Reverse. Gamepad: left stick steers/drives, RT gas, LT brake, A boost. Reset returns to the start.',videos:[]});
else createMotionLab({title:'Track Lab',section:'Section 1 · Track inspection',createSimulation:createTrackPreview,helpText:'Choose a track. Drag to orbit, use the wheel or pinch to zoom, and use the view buttons to inspect it. This section shows the tracks only.',videos:[]});
