import {createMotionLab} from './page.js';
createMotionLab({title:'Motion Lab',section:'Ground movement',videos:[
 {src:'./videos/direction.mp4',title:'Direction and facing',description:'Forward, diagonal movement and release through the shared keyboard input.',passed:true},
 {src:'./videos/analog.mp4',title:'Analog strength',description:'Gentle and full stick input drive walking and running speeds through the same controller.',passed:true},
]});
