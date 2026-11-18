# Learning notebook

Game-development words used in this project, in plain English. It grows as
we go. Newest additions go at the end of each section.

## The big picture

1. **Game engine**: the big toolbox a game is built on. It draws the 3D
   world, plays sound, reads controls and handles physics. Examples:
   Unity, Unreal Engine, Godot.
2. **Three.js**: a free library (a ready-made code toolbox) for drawing 3D
   in a web browser. Our game uses it instead of a full engine.
3. **TypeScript / JavaScript**: the languages our game is written in.
   TypeScript is JavaScript with extra safety checks.
4. **C++, C#**: other programming languages. C++ is very fast but hard;
   engines are written in it. C# (C sharp) is easier and is what Unity uses.
5. **Native**: built to run directly on a machine (a console, a PC), not
   inside a web browser.
6. **Porting**: taking a finished game and rebuilding it to run on another
   machine, such as a console.
7. **Porting studio**: a company that ports games for others.
8. **Certification**: the console maker's rulebook a game must pass before
   it can be sold on their console.
9. **Dev kit**: special development hardware from a console maker, needed
   to build and test console games.
10. **Wrapping**: putting a browser game inside an app shell so it can be
    sold in stores like Steam or the phone app stores.
11. **Royalty**: a share of your sales paid to someone else (for example,
    Unreal takes 5% after a game earns $1 million).

## How we build

1. **Code first**: build the rules and prove them with automatic checks
   before making anything you can see.
2. **Layers**: building in steps, each resting on the one below, each
   approved before the next.
3. **Automatic checks (tests)**: small programs that run the game's rules
   and confirm the results, printing PASS or FAIL.
4. **Brain and face**: the brain is the game's rules; the face is the
   drawing, menus and sound. Keeping them separate makes porting easier.
5. **Checkpoint**: a frozen, saved copy of an approved version that never
   changes.
6. **Placeholder**: a temporary stand-in (like the movement marker) until
   the real thing is made.
7. **Repository (repo)**: the project's folder of files, with its full
   history, stored on GitHub.
8. **Commit / push**: saving a set of changes with a note (commit), then
   sending them to GitHub (push).

## Movement and bodies

1. **Skeleton (rig)**: invisible bones joined at joints. The visible body
   parts hang on the bones, so turning a bone moves that part.
2. **Joint limits**: how far each joint may bend, so knees never bend the
   wrong way.
3. **Forward kinematics (FK)**: working out where every part ends up from
   the joint angles ("turn the shoulder 30°, where is the hand?").
4. **Inverse kinematics (IK)**: the reverse: working out the joint angles
   needed to put a hand or foot at a chosen spot.
5. **Foot locking (planting)**: keeping a foot fixed on the ground while it
   carries weight, so it never slides.
6. **Fixed time step**: the game thinks in equal tiny steps (we use 1/120
   of a second), so it behaves the same on fast and slow screens.
7. **Skid / braking slide**: from the movement rules: a reversal at speed
   sheds speed first; letting go at a run slides to a stop.

## The world

1. **Voxel**: a 3D block on a grid, like a pixel but in 3D.
2. **Collision**: working out when things touch, so you can't walk through
   walls. Our blocks collide as full cubes even though they look rounded.
3. **Merged mesh vs separate blocks**: drawing a group of blocks as one
   solid shape, or every block as its own cube (our build rule).
