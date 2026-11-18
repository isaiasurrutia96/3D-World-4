import {createMotionLab} from '../../motion-lab/src/page.js';
import {createTrackPreview} from './track-preview.js';
createMotionLab({title:'Track Lab',section:'Section 1 · Track inspection',createSimulation:createTrackPreview,helpText:'Choose a track. Drag to orbit, use the wheel or pinch to zoom, and use the view buttons to inspect it. This section shows the tracks only.',videos:[]});
