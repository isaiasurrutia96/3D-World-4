// New avatar (version 2): painted faces.
//
// The face is drawn, not sculpted: a few flat dark shapes wrapped onto the
// front of the round head (no triangles, crisp at any size, swappable).
// A face is data; faceShapes() turns it into simple shapes (ellipses and a
// rounded bar) that the page draws and the checks test.
//
// Units: fractions of the head's width, measured from the centre of the face;
// x to his left is negative on the drawing (as you look at him), y down is
// positive. Measured from the owner's preferred concept sheet (21 November
// 2026): the "scared" eyes are 0.152 wide and 0.285 tall, 0.182 either side
// of centre, 0.063 above it; the "cool" mouth is a line 0.167 wide, 0.230
// below centre.
//
// Design (owner, 21 November 2026): one BASE face (big oval eyes, a line
// mouth) that every character has; other expressions are chosen by the player
// like an emote and stay on as long as they want. Expressions come next; each
// will be another set of these same numbers.

/** Colour of the painted features (dark brown, as in the concept sheets). */
export const FACE_INK='#2a1d17';

/** The mouth is the same in every base option (owner: "same mouth size"). */
export const BASE_MOUTH={width:.167,thickness:.04,y:.23};

/** Base face options: eyes vary, the mouth does not. */
export const BASE_FACES=[
 {id:'face-base',label:'1 · As described',note:'Big oval eyes, about 20% bigger than the scared eyes and slightly rounder, with the line mouth.',
  eyes:{width:.178,height:.294,apart:.185,y:-.06},mouth:BASE_MOUTH},
 {id:'face-bigger',label:'2 · Bigger eyes',note:'Option 1 with the eyes about 10% bigger again.',
  eyes:{width:.195,height:.322,apart:.19,y:-.06},mouth:BASE_MOUTH},
 {id:'face-rounder',label:'3 · Rounder eyes',note:'Option 1 with rounder eyes (taller than wide by 1.5 instead of 1.65).',
  eyes:{width:.196,height:.294,apart:.188,y:-.06},mouth:BASE_MOUTH},
 {id:'face-wider',label:'4 · Wider apart',note:'Option 1 with the eyes set a little further apart.',
  eyes:{width:.178,height:.294,apart:.215,y:-.06},mouth:BASE_MOUTH},
 {id:'face-higher',label:'5 · Higher eyes',note:'Option 1 with the eyes sitting a little higher on the face.',
  eyes:{width:.178,height:.294,apart:.185,y:-.1},mouth:BASE_MOUTH},
];

/**
 * The shapes of a face: two eye ellipses (left and right, mirrored) and the
 * mouth as a bar with fully rounded ends. Returns [{type, ...}] in face units.
 */
export function faceShapes(face){
 const {eyes,mouth}=face;
 if(!(eyes.width>0&&eyes.height>0&&eyes.apart>eyes.width/2))throw Error('eyes must not overlap: '+face.id);
 if(!(mouth.width>mouth.thickness&&mouth.thickness>0))throw Error('mouth must be a line: '+face.id);
 return [
  {type:'ellipse',part:'eye-right',cx:-eyes.apart,cy:eyes.y,rx:eyes.width/2,ry:eyes.height/2},// his right eye (left as you look)
  {type:'ellipse',part:'eye-left',cx:eyes.apart,cy:eyes.y,rx:eyes.width/2,ry:eyes.height/2},
  {type:'bar',part:'mouth',cx:0,cy:mouth.y,width:mouth.width,thickness:mouth.thickness},
 ];
}

/**
 * Draws a face onto a 2D canvas context, filling a square of `size` pixels that
 * stands for the head's full width (the face's centre in the middle).
 */
export function drawFace(ctx,size,face){
 ctx.clearRect(0,0,size,size);ctx.fillStyle=FACE_INK;
 const px=v=>(v+.5)*size,len=v=>v*size;
 for(const s of faceShapes(face)){
  ctx.beginPath();
  if(s.type==='ellipse')ctx.ellipse(px(s.cx),px(s.cy),len(s.rx),len(s.ry),0,0,Math.PI*2);
  else ctx.roundRect(px(s.cx-s.width/2),px(s.cy-s.thickness/2),len(s.width),len(s.thickness),len(s.thickness/2));
  ctx.fill();
 }
}

/**
 * Chosen by the owner (21 November 2026): option 3's rounder eyes, set slightly
 * closer together (0.17 of the head from the centre instead of 0.188; not
 * closer, to stay clearly unlike a known character's close-set eyes).
 * Only this base face is used for now; expressions come later (ideas kept in
 * docs/HANDOFF.md: X X eyes, "X p" eyes with the tongue out, shop expressions).
 */
export const CHOSEN_FACE={id:'face-chosen',label:'Base face',note:'Rounder big oval eyes, slightly closer together, and the line mouth.',
 eyes:{width:.196,height:.294,apart:.17,y:-.06},mouth:BASE_MOUTH};
