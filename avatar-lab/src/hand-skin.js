import * as T from 'three';
import {createHandRig} from '../../hand-lab/src/hand-rig.js';

// The approved hands, bent by the graphics card (skinning) instead of being
// rebuilt point by point on the main processor (the hand lab's rig takes about
// 40 ms a hand, far too slow for every frame of a game).
//
// Each point of the hand follows the skeleton's hand bone and finger bones,
// with weights taken from the approved rig's own binding: a finger point at
// distance t along its finger (t = 0 at the root, 1 at the tip) shares itself
// between the hand and the finger's three joints exactly where the approved
// rig bends (its three bending zones: 0–0.32, 0.25–0.72, 0.62–1.04, whose
// middles are the skeleton's joint pivots). The palm and the wrist ball belong
// to the hand bone only, so they stay rigid and seated.
//
// The checks (tests/avatar/hand-skin.mjs) compare this against the approved
// rig, pose by pose.

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The approved rig's three bending zones (in t, along the finger). */
export const ZONES = [[0, .32], [.25, .72], [.62, 1.04]];

/**
 * Bone weights for a point at t along a finger, owned by that finger with
 * weight w: [hand, joint1, joint2, joint3].
 */
export function zoneWeights(t, w){
 const S = ZONES.map(([a, b]) => smooth(a, b, t));
 return [w * (1 - S[0]), w * (S[0] - S[1]), w * (S[1] - S[2]), w * S[2]];
}

/**
 * Build the two skinned hands.
 *   hands     {L: {mesh, rest}, R: {mesh, rest}}: the approved hand meshes and
 *             their placement at rest (avatar space). Their shared geometry must
 *             still carry the approved bind data.
 *   skeleton  the skeleton (motion-core/skeleton)
 * Returns {L, R, update(solved)}: L and R are the skinned meshes (avatar space,
 * add them to the scene); update moves their bones to a solved pose.
 */
export function createSkinnedHands(hands, skeleton){
 // The approved binding, read once (the rig itself is not used for bending).
 const rig = createHandRig(hands.L.mesh), {steps, range, digits} = rig.binding;
 const source = hands.L.mesh.geometry, n = source.attributes.position.count;
 // Per point: up to 16 (bone, weight) pairs, then the 4 strongest are kept.
 const influences = Array.from({length: n}, () => new Map());
 const add = (i, b, w) => { if(w > 1e-9) influences[i].set(b, (influences[i].get(b) ?? 0) + w); };
 const owned = new Float64Array(n);
 // Bone numbers: 0 the hand; then per finger its palm bone and its three joints.
 const thumbWeights = rig.thumbWeights;
 digits.forEach((d, j) => {
  const r = d.rows, base = 1 + j * 4;
  // How much of each point turns with the palm bone (the approved rig's own amounts:
  // the thumb's opposition weights, the fingers' closing-together weights).
  const swing = new Map();
  if(d.id === 'thumb') for(let k = 0; k < r.length; k += 12) swing.set(r[k], thumbWeights[r[k]]);
  else for(let k = 0; k < d.adductionRows.length; k += 2) swing.set(d.adductionRows[k], d.adductionRows[k + 1]);
  for(let k = 0; k < r.length; k += 12){
   const i = r[k], t = (r[k + 1] + r[k + 2]) / steps * range, w = r[k + 3];
   const [h, a, b, c] = zoneWeights(t, w), palm = Math.max(0, Math.min(h, (swing.get(i) ?? 0) - (w - h)));
   owned[i] += w;
   add(i, 0, h - palm); add(i, base, palm); add(i, base + 1, a); add(i, base + 2, b); add(i, base + 3, c);
  }
 });
 for(let i = 0; i < n; i++) add(i, 0, Math.max(0, 1 - owned[i]));
 const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
 for(let i = 0; i < n; i++){
  const top = [...influences[i]].sort((a, b) => b[1] - a[1]).slice(0, 4), sum = top.reduce((s, [, w]) => s + w, 0) || 1;
  top.forEach(([b, w], k) => { skinIndex[i * 4 + k] = b; skinWeight[i * 4 + k] = w / sum; });
 }

 const out = {};
 for(const side of ['L', 'R']){
  const {mesh, rest} = hands[side], g = new T.BufferGeometry();
  // The hand at rest, in avatar space (so the skinned mesh needs no placement of its own).
  const pos = source.attributes.position.clone().applyMatrix4(rest), nor = source.attributes.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(rest));
  g.setAttribute('position', pos); g.setAttribute('normal', nor);
  const idx = source.index.array.slice();
  if(rest.determinant() < 0) for(let k = 0; k < idx.length; k += 3){ const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } // mirrored: keep faces outward
  g.setIndex(new T.BufferAttribute(idx, 1));
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(skinIndex, 4));
  g.setAttribute('skinWeight', new T.Float32BufferAttribute(skinWeight, 4));
  const names = ['hand', ...digits.flatMap(d => [0, 1, 2, 3].map(j => d.id + j))].map(b => `${b}.${side}`);
  const bones = names.map(b => { const bone = new T.Bone(); bone.name = b; bone.matrixAutoUpdate = false; return bone; });
  const inverses = names.map(b => { const h = skeleton.bones[skeleton.index.get(b)].head; return new T.Matrix4().makeTranslation(-h[0], -h[1], -h[2]); });
  const skinned = new T.SkinnedMesh(g, mesh.material);
  skinned.name = 'skinned-hand.' + side; skinned.castShadow = mesh.castShadow; skinned.receiveShadow = mesh.receiveShadow; skinned.frustumCulled = false;
  skinned.bind(new T.Skeleton(bones, inverses), new T.Matrix4());
  skinned.userData.boneNames = names;
  out[side] = skinned;
 }
 const m = new T.Matrix4();
 /** Move the hand and finger bones to a solved pose (each: its joint now, turned by its change from rest). */
 function update(solved){
  for(const side of ['L', 'R']){
   const sk = out[side].skeleton;
   out[side].userData.boneNames.forEach((name, k) => {
    const s = solved.get(name);
    sk.bones[k].matrixWorld.makeRotationFromQuaternion(s.rotation).setPosition(s.head);
   });
   sk.update();
  }
 }
 return {L: out.L, R: out.R, update, rig};
}

/**
 * Where a point of a skinned hand ends up (on the main processor, for checks):
 * the same weighted sum the graphics card does.
 */
export function skinnedPoint(mesh, i, target = new T.Vector3()){
 const g = mesh.geometry, P = g.attributes.position, I = g.attributes.skinIndex, W = g.attributes.skinWeight, sk = mesh.skeleton;
 const v = new T.Vector3().fromBufferAttribute(P, i), tmp = new T.Vector3(), M = new T.Matrix4();
 target.set(0, 0, 0);
 for(let k = 0; k < 4; k++){
  const w = W.getComponent(i, k); if(!w) continue;
  const b = I.getComponent(i, k);
  M.multiplyMatrices(sk.bones[b].matrixWorld, sk.boneInverses[b]);
  target.addScaledVector(tmp.copy(v).applyMatrix4(M), w);
 }
 return target;
}
