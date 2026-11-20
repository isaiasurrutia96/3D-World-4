// Movement numbers for the ground: copied exactly from 3D-WORLD-3
// (src/player/Tuning.ts) so the new controller moves like the old one.
// Metres and seconds. These are game-feel numbers (faster than real life).
export const MOVE_TUNING = Object.freeze({
 walkSpeed:3.1,          // speed at the point where a gentle push stops walking
 runSpeed:8.6,           // speed at full stick
 walkStick:.55,          // stick strength where walking ends and running begins
 acceleration:32,        // speeding up toward the wanted speed
 deceleration:26,        // slowing down, and bleeding off sideways drift
 skidDeceleration:46,    // slowing down during a reversal skid
 skidDotThreshold:-.55,  // stick this far against travel counts as a reversal
 skidMinSpeed:5.2,       // a reversal only skids above this speed
 turnRateSlow:13,        // radians per second when nearly still
 turnRateFast:5.2,       // radians per second at full speed (wider arcs)
 brakeMinSpeed:5.4,      // letting go above this speed is a braking slide
 brakeEndSpeed:1.2,      // the braking slide ends below this speed
 brakeSlideShort:.762,   // slide length after a short burst of running
 brakeSlideLong:2.03,    // slide length after a long run
 brakeMomentumBuild:2.83,// seconds of running to earn the full slide
 brakeMomentumFade:1.2,  // seconds to lose it again
 brakeMomentumCurve:1.45,// shapes how the slide grows with running time
 turnFirstAngle:0,      // 0 = off (the 3D-WORLD-3 feel). Above 0 (radians): from nearly still, a turn bigger than this is made on the spot first, then he sets off
 turnFirstSpeed:.6,      // ... "nearly still" means slower than this (metres a second)
 fixedStep:1/120,        // the controller always thinks in steps this small
});
