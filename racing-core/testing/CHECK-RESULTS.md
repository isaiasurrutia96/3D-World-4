# Driving test code checks

12 PASS; 0 FAIL. These checks verify wiring and controls; the owner still needs to judge driving feel.

## Independent keyboard throttle and steering do not depend on the camera

- Rule: Up=+throttle, Down=-throttle, Left=+steer, Right=-steer; diagonal keyboard commands remain full strength.
- Input: `{"yaws":[0,1.5707963267948966,3.141592653589793,-1.1],"script":"Up/Down/Left/Right and diagonals, including simultaneous camera look."}`
- Measured: `{"probes":48}`
- **PASS**

## Analog steering survives mapping without accidental Gas

- Rule: Analog steering stays 0.2/0.5/0.8, and floating-point residue cannot accelerate a steering-only kart.
- Input: `{"script":"Three gentle stick strengths at four camera headings, with a sideways-only stick."}`
- Measured: `{"probes":12}`
- **PASS**

## Held phone buttons use fixed kart directions and a dedicated reverse command

- Rule: Left is +steer, right -steer, both cancel; Reverse is -throttle; Gas+Reverse applies the brake; independent Brake/Boost are retained.
- Input: `{"script":"Left/Right/Gas/Reverse, opposites and independent Brake/Boost."}`
- Measured: `{"combinations":7}`
- **PASS**

## original: complete driving-test adapter is frame independent

- Rule: One kart, no other actors; identical authoritative state after exactly 960 physics ticks at all rendering rates.
- Input: `{"fps":[30,60,120,144],"script":"Eight seconds: Gas, Brake, Reverse, steering, boost, release; use checked track rails."}`
- Measured: `{"byRate":[{"fps":30,"state":{"x":574.0964165870666,"y":0,"z":-217.53439308987635,"yaw":1.3268378655524686,"speed":10.287514780236364,"lateralSpeed":2.621667299422767,"steering":2.341468751343581e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":409.3363494563913,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":9.896771973427768e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":60,"state":{"x":574.0964165870666,"y":0,"z":-217.53439308987635,"yaw":1.3268378655524686,"speed":10.287514780236364,"lateralSpeed":2.621667299422767,"steering":2.341468751343581e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":409.3363494563913,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":9.896771973427768e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":120,"state":{"x":574.0964165870666,"y":0,"z":-217.53439308987635,"yaw":1.3268378655524686,"speed":10.287514780236364,"lateralSpeed":2.621667299422767,"steering":2.341468751343581e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":409.3363494563913,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":9.896771973427768e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":144,"state":{"x":574.0964165870666,"y":0,"z":-217.53439308987635,"yaw":1.3268378655524686,"speed":10.287514780236364,"lateralSpeed":2.621667299422767,"steering":2.341468751343581e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":409.3363494563913,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":9.896771973427768e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}}]}`
- **PASS**

## skyline: complete driving-test adapter is frame independent

- Rule: One kart, no other actors; identical authoritative state after exactly 960 physics ticks at all rendering rates.
- Input: `{"fps":[30,60,120,144],"script":"Eight seconds: Gas, Brake, Reverse, steering, boost, release; use checked track rails."}`
- Measured: `{"byRate":[{"fps":30,"state":{"x":-314.16417228975826,"y":0,"z":216.9540007848132,"yaw":-0.30581847139484597,"speed":4.752347936139971,"lateralSpeed":1.6308729855414852,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":371.3849439636558,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.29353973649068e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":60,"state":{"x":-314.16417228975826,"y":0,"z":216.9540007848132,"yaw":-0.30581847139484597,"speed":4.752347936139971,"lateralSpeed":1.6308729855414852,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":371.3849439636558,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.29353973649068e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":120,"state":{"x":-314.16417228975826,"y":0,"z":216.9540007848132,"yaw":-0.30581847139484597,"speed":4.752347936139971,"lateralSpeed":1.6308729855414852,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":371.3849439636558,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.29353973649068e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":144,"state":{"x":-314.16417228975826,"y":0,"z":216.9540007848132,"yaw":-0.30581847139484597,"speed":4.752347936139971,"lateralSpeed":1.6308729855414852,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":371.3849439636558,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.29353973649068e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}}]}`
- **PASS**

## suzuka: complete driving-test adapter is frame independent

- Rule: One kart, no other actors; identical authoritative state after exactly 960 physics ticks at all rendering rates.
- Input: `{"fps":[30,60,120,144],"script":"Eight seconds: Gas, Brake, Reverse, steering, boost, release; use checked track rails."}`
- Measured: `{"byRate":[{"fps":30,"state":{"x":-304.15915752738175,"y":0,"z":-982.7363888309682,"yaw":0.47950416456793116,"speed":8.404441778363083,"lateralSpeed":2.3598561941092067,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":398.11097052442307,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.7389972898733e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":60,"state":{"x":-304.15915752738175,"y":0,"z":-982.7363888309682,"yaw":0.47950416456793116,"speed":8.404441778363083,"lateralSpeed":2.3598561941092067,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":398.11097052442307,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.7389972898733e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":120,"state":{"x":-304.15915752738175,"y":0,"z":-982.7363888309682,"yaw":0.47950416456793116,"speed":8.404441778363083,"lateralSpeed":2.3598561941092067,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":398.11097052442307,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.7389972898733e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}},{"fps":144,"state":{"x":-304.15915752738175,"y":0,"z":-982.7363888309682,"yaw":0.47950416456793116,"speed":8.404441778363083,"lateralSpeed":2.3598561941092067,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":398.11097052442307,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":4.7389972898733e-9,"railContactTime":0.3,"impactRecovery":0,"contacts":1}}]}`
- **PASS**

## winding: complete driving-test adapter is frame independent

- Rule: One kart, no other actors; identical authoritative state after exactly 960 physics ticks at all rendering rates.
- Input: `{"fps":[30,60,120,144],"script":"Eight seconds: Gas, Brake, Reverse, steering, boost, release; use checked track rails."}`
- Measured: `{"byRate":[{"fps":30,"state":{"x":-145.74477122103886,"y":0,"z":907.5702823059968,"yaw":-2.0074878455070944,"speed":4.922121565132876,"lateralSpeed":-1.0980703962339788,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":435.36853132917764,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":-0.000001500429307846391,"railContactTime":0.29166666666666663,"impactRecovery":0,"contacts":0}},{"fps":60,"state":{"x":-145.74477122103886,"y":0,"z":907.5702823059968,"yaw":-2.0074878455070944,"speed":4.922121565132876,"lateralSpeed":-1.0980703962339788,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":435.36853132917764,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":-0.000001500429307846391,"railContactTime":0.29166666666666663,"impactRecovery":0,"contacts":0}},{"fps":120,"state":{"x":-145.74477122103886,"y":0,"z":907.5702823059968,"yaw":-2.0074878455070944,"speed":4.922121565132876,"lateralSpeed":-1.0980703962339788,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":435.36853132917764,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":-0.000001500429307846391,"railContactTime":0.29166666666666663,"impactRecovery":0,"contacts":0}},{"fps":144,"state":{"x":-145.74477122103886,"y":0,"z":907.5702823059968,"yaw":-2.0074878455070944,"speed":4.922121565132876,"lateralSpeed":-1.0980703962339788,"steering":2.3414687513435783e-26,"steerHoldTime":0,"steerHoldDirection":0,"wheelRotation":435.36853132917764,"verticalVelocity":0,"grounded":true,"pitch":0,"bank":0,"boostTime":0,"impactYawRate":-0.000001500429307846391,"railContactTime":0.29166666666666663,"impactRecovery":0,"contacts":0}}]}`
- **PASS**

## Reset and track selection clear held driving state and momentum

- Rule: Reset returns to the exact start with zero speed/timers; switching uses the new supported start; a bad selection cannot corrupt the active test.
- Input: `{"script":"Drive and boost for 0.1 s; Reset; switch to Skyline; try an invalid track."}`
- Measured: `{"starts":4}`
- **PASS**

## Pausing clears a queued Boost without moving or resetting the kart

- Rule: No delayed boost is activated; position/clock are retained and speed remains zero.
- Input: `{"script":"Queue Boost for half a physics tick, cancel input, advance the other half tick."}`
- Measured: `{"boost":0,"speed":0,"ticks":1}`
- **PASS**

## The driving adapter actually uses the checked rail-contact solver

- Rule: A real contact is recorded; the kart does not pass outside the rail.
- Input: `{"fps":[30,60,120,144],"script":"From Original start, aim directly at the outer rail at 180 mph for 1 s."}`
- Measured: `{"byRate":[{"fps":30,"contacts":154,"offset":12.719999609824352},{"fps":60,"contacts":154,"offset":12.719999609824352},{"fps":120,"contacts":154,"offset":12.719999609824352},{"fps":144,"contacts":154,"offset":12.719999609824352}]}`
- **PASS**

## The kart model is the exact pinned original and its wheels read the checked pose

- Rule: Source SHA256 matches the independent original capture; four original wheel nodes exist; front wheels steer, rear wheels do not, and steering/roll reset.
- Input: `{"script":"Hash model source; apply a turning/rolling pose, then apply a zero pose."}`
- Measured: `{"hash":"35509730bd5d91554e4a93a43c7f584b1b9ffb3a88aa6c43c5d5846ee6e5c481","wheels":4}`
- **PASS**

## Driving test rules compile as strict ES2022 without a browser

- Rule: Strict typecheck succeeds; malformed controls throw.
- Input: `{"script":"Run testing/tsconfig.json; submit a nonfinite input snapshot."}`
- Measured: `{"typecheck":"PASS"}`
- **PASS**

