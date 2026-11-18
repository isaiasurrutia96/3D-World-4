import * as T from 'three';

// Gentle chest bending (owner's choice, 18 Nov 2026): instead of cutting
// the chest into more pieces, its surface bends softly so it still looks
// like one smooth piece of clay. The movement is small on purpose: a
// slight twist of the upper chest and a small forward bend.
//
// How it works. The skeleton has a chest bone above the waist bone. Its
// pivot sits on the chest's centre line, level with both shoulder balls.
// Each point of the chest turns about that pivot by its own share of the
// chest bone's forward bend and of its twist (true rotations, never
// straight-line mixes, so the chest keeps its volume).
//
// Forward bend (about the line through both shoulder balls): nothing below
// the bend zone moves, so the waist seam and the waist ball never change;
// the bend is shared evenly up the chest, so no single band takes the
// squeeze; each shoulder ball turns in place, so the chest stays snug
// around it.
// Twist (about the chest's own upright centre line): the sides, where the
// shoulder balls sit in their sockets, turn fully from top to bottom, so the
// sockets move exactly with the balls; the front and back of the belly lag
// behind smoothly, which is what makes it look like a twist. The rim at the
// seam and the ball in the waist are circles and a sphere around that same
// centre line, so turning them never opens the seam or unseats the ball.
//
// Shoulders (collarbones). Each shoulder ball hangs from a collarbone that
// can shrug up a little and move forward or back. The chest around each
// socket follows its collarbone exactly (so the socket moves with the
// ball), fading smoothly into the rest of the chest. This step comes after
// the chest's own bend and twist, measured from the chest's firm top, so
// the sockets stay snug in every mix of bend, twist and shrug.

/** Bend zone, in avatar space at rest (metres, soles on y = 0). */
export const CHEST_BEND = {
 from: 1.115,      // forward bend starts just above the chest's rounded rim at the seam
 bendTo: 1.44,     // ...and is shared evenly up to the top of the chest
 twistFrom: 0.9,   // twist: the front and back share it from below the chest (gentler)...
 twistTo: 1.42,    // ...to the top of the chest, which turns fully
 sides: [0, 0.92],// twist: how far round from front to side the full turn takes over
                   // (0.92 = every point of both shoulder sockets turns fully)
 levels: 1024,     // how finely each turn is shared out (1024 steps, < 0.05 mm)
 shoulderFirm: 0.108,       // collarbone: the whole socket (ball 10 cm + clearance) follows fully...
 shoulderFade: 0.27,        // ...fading out by this distance from the ball's centre
 shoulderGate: [1.115, 1.152], // ...and never below the seam rim (the socket starts at 1.159 m)
 shoulderRamp: 0.2,         // ...easing in and out over this part of that strip (no crease)
 neckClear: [0.16, 0.22],   // ...nor within this distance of the centre line around the neck...
 neckHeight: [1.36, 1.40],  // ...on the top of the chest (above the shoulder sockets)
 shoulderLevels: 256,       // how finely the collarbone's turn is shared out
};

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/**
 * Like smooth(), but shares the change out evenly over most of the zone (a
 * short gentle start and finish, then a steady rate), so no single band of
 * the surface takes the squeeze. ramp = the fraction used to start/finish.
 */
const even = (a, b, x, ramp = .2) => {
 const t = Math.min(1, Math.max(0, (x - a) / (b - a))), m = 1 / (1 - ramp), S = u => u*u*u - u*u*u*u/2;
 if(t < ramp) return m * ramp * S(t / ramp);
 if(t > 1 - ramp) return 1 - m * ramp * S((1 - t) / ramp);
 return m * ramp / 2 + m * (t - ramp);
};

/**
 * Prepare a chest mesh for bending.
 *   mesh      the chest mesh (its geometry is bent in place)
 *   rest      the mesh's placement in avatar space at rest (Matrix4)
 *   pivot     the chest bone's pivot, avatar space (Vector3)
 * Returns {weights(i), apply(q), firmLocal}: apply(q) bends the surface by
 * the chest bone's turn q (a Quaternion relative to the waist, avatar space;
 * forward bend about x, then twist about y, three.js order 'YXZ'). weights(i) = [bend, twist]
 * share of point i (0 = follows the waist, 1 = follows the chest bone).
 * firmLocal is the change for the firm zone, in the mesh's own space.
 * shoulders (optional): [{head, ball}] per side (his left, then right), the
 * collarbone's pivot and the shoulder ball's centre, avatar space at rest.
 * Then apply(q, [qL, qR]) also moves each socket by its collarbone's turn
 * (relative to the chest bone), and shoulderLocal[side] is that socket's
 * change in the mesh's own space.
 */
export function createChestBend(mesh, rest, pivot, opts = CHEST_BEND, shoulders = []){
 const g = mesh.geometry, P = g.attributes.position, N = g.attributes.normal, n = P.count;
 const original = P.array.slice(), originalNormals = N.array.slice();
 const wb = new Float32Array(n), wt = new Float32Array(n), L = opts.levels, FULL = L * (L + 1) + L;
 const key = new Uint32Array(n), v = new T.Vector3();
 for(let i = 0; i < n; i++){
  v.fromBufferAttribute(P, i).applyMatrix4(rest);
  const dx = v.x - pivot.x, dz = v.z - pivot.z, r = Math.hypot(dx, dz), side = r > 1e-9 ? smooth(opts.sides[0], opts.sides[1], Math.abs(dx) / r) : 0;
  wb[i] = even(opts.from, opts.bendTo, v.y);
  wt[i] = 1 - (1 - even(opts.twistFrom, opts.twistTo, v.y)) * (1 - side);
  key[i] = Math.round(wb[i] * L) * (L + 1) + Math.round(wt[i] * L);
 }
 // Collarbone share: which socket (if any) each point follows, and how much.
 const LS = opts.shoulderLevels, sideOf = new Int8Array(n).fill(-1), sLevel = new Uint16Array(n), ws = new Float32Array(n);
 for(let i = 0; i < n; i++){
  v.fromBufferAttribute(P, i).applyMatrix4(rest);
  const gate = even(opts.shoulderGate[0], opts.shoulderGate[1], v.y, opts.shoulderRamp);
  // ...and never round the neck, which sits in the top of the chest.
  const neckFree = 1 - (1 - smooth(opts.neckClear[0], opts.neckClear[1], Math.hypot(v.x - pivot.x, v.z - pivot.z))) * smooth(opts.neckHeight[0], opts.neckHeight[1], v.y);
  shoulders.forEach((sh, j) => {
   const w = (1 - smooth(opts.shoulderFirm, opts.shoulderFade, v.distanceTo(sh.ball))) * gate * neckFree;
   if(w > ws[i]){ ws[i] = w; sideOf[i] = j; }
  });
  sLevel[i] = Math.round(ws[i] * LS);
  if(sLevel[i] === 0) sideOf[i] = -1;
 }
 const shoulderArr = []; for(let i = 0; i < n; i++) if(sideOf[i] >= 0) shoulderArr.push(i);
 const shoulderPts = Int32Array.from(shoulderArr);
 const S = new Float64Array(2 * (LS + 1) * 12), shoulderLocal = [new T.Matrix4(), new T.Matrix4()], clavActive = [false, false];
 const NONE = [new T.Quaternion(), new T.Quaternion()];
 // Each distinct (bend share, twist share) pair gets one matrix per update.
 const usedKeys = [...new Set(key)].sort((a, b) => a - b), slot = new Map(usedKeys.map((k, j) => [k, j]));
 const level = Uint32Array.from(key, k => slot.get(k)), zero = slot.get(0) ?? -1, full = slot.get(FULL) ?? -1;
 const movingArr = [];
 for(let i = 0; i < n; i++) if(level[i] !== zero || sideOf[i] >= 0) movingArr.push(i);
 const moving = Int32Array.from(movingArr);
 // Each slot's bend and twist step (0..L), and one packed 3×4 matrix per slot.
 const slotBend = Int32Array.from(usedKeys, k => Math.floor(k / (L + 1))), slotTwist = Int32Array.from(usedKeys, k => k % (L + 1));
 const K = new Float64Array(usedKeys.length * 12), cA = new Float64Array(L + 1), sA = new Float64Array(L + 1), cB = new Float64Array(L + 1), sB = new Float64Array(L + 1);
 // Normals: only "soft" points (on a triangle that bends) need recomputing.
 // Points below the bend keep their approved normal; points in the firm
 // zone just turn theirs with the chest.
 const I = g.index.array, triCount = I.length / 3, soft = new Uint8Array(n);
 for(let t = 0; t < triCount; t++){
  const a = I[3*t], b = I[3*t+1], c = I[3*t+2], la = level[a];
  if(la !== level[b] || la !== level[c] || (la !== zero && la !== full) || sideOf[a] >= 0 || sideOf[b] >= 0 || sideOf[c] >= 0) soft[a] = soft[b] = soft[c] = 1;
 }
 const softArr = [], firmArr = [];
 for(let i = 0; i < n; i++){ if(soft[i]) softArr.push(i); else if(level[i] === full) firmArr.push(i); }
 const softList = Int32Array.from(softArr), firmList = Int32Array.from(firmArr);
 // Triangles touching a soft point: their normals are added into their points.
 const needArr = [];
 for(let t = 0; t < triCount; t++) if(soft[I[3*t]] || soft[I[3*t+1]] || soft[I[3*t+2]]) needArr.push(t);
 const needList = Int32Array.from(needArr), acc = new Float64Array(n * 3);
 // Points that share a spot (the lathe's closing seam, the poles) share a
 // normal, so no lighting line appears down the back.
 // The bend is small, so a slightly larger bounding sphere covers every pose
 // (no need to re-measure it each frame).
 g.computeBoundingSphere(); g.boundingSphere.radius += 0.08;
 const groups = new Map();
 for(const i of softArr){ const k = `${original[3*i].toFixed(6)},${original[3*i+1].toFixed(6)},${original[3*i+2].toFixed(6)}`; (groups.get(k) ?? groups.set(k, []).get(k)).push(i); }
 const shared = [...groups.values()].filter(list => list.length > 1).map(list => Int32Array.from(list));

 // rest = M (3×3, row-major) plus translation tr; Mi is M's inverse.
 const re = rest.elements, M = [re[0],re[4],re[8], re[1],re[5],re[9], re[2],re[6],re[10]], tr = [re[12],re[13],re[14]];
 const ie = new T.Matrix3().setFromMatrix4(rest).invert().elements, Mi = [ie[0],ie[3],ie[6], ie[1],ie[4],ie[7], ie[2],ie[5],ie[8]];
 const turnE = new T.Euler();
 const firmLocal = new T.Matrix4(), normalTurn = new T.Matrix3();
 let bent = false;
 const last = [new T.Quaternion(2, 0, 0, 0), new T.Quaternion(2, 0, 0, 0), new T.Quaternion(2, 0, 0, 0)];
 const same = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z) + Math.abs(a.w - b.w) < 1e-12;
 const still = a => 1 - Math.abs(a.w) < 1e-12;
 const F = new T.Matrix4(), Fi = new T.Matrix4(), A = new T.Matrix4(), B = new T.Matrix4(), C = new T.Matrix4(), tmp = new T.Matrix4(), part = new T.Quaternion(), restInv = rest.clone().invert();

 function apply(q, clav = NONE){
  // Same turns as last time (the body is holding still): nothing to do.
  if(same(q, last[0]) && same(clav[0], last[1]) && same(clav[1], last[2])) return;
  last[0].copy(q); last[1].copy(clav[0]); last[2].copy(clav[1]);
  clavActive[0] = shoulders.length > 0 && !still(clav[0]); clavActive[1] = shoulders.length > 1 && !still(clav[1]);
  if(still(q) && !clavActive[0] && !clavActive[1]){
   // No turn: exactly the approved chest.
   if(bent){ P.array.set(original); N.array.set(originalNormals); P.needsUpdate = N.needsUpdate = true; bent = false; }
   firmLocal.identity(); shoulderLocal[0].identity(); shoulderLocal[1].identity(); return;
  }
  // One matrix per (bend, twist) share: rest⁻¹ · (turn about the pivot) · rest,
  // where the turn is the bend share about x, then the twist share about y.
  // Bending first keeps the shoulder balls on the bend line, so the chest
  // stays snug around them even where only part of the bend is applied.
  turnE.setFromQuaternion(q, 'YXZ');
  const bendA = turnE.x, twistA = turnE.y;
  for(let l = 0; l <= L; l++){ const x = bendA * l / L, y = twistA * l / L; cA[l] = Math.cos(x); sA[l] = Math.sin(x); cB[l] = Math.cos(y); sB[l] = Math.sin(y); }
  const dx = tr[0]-pivot.x, dy = tr[1]-pivot.y, dz = tr[2]-pivot.z;
  for(let j = 0; j < usedKeys.length; j++){
   const ca = cA[slotBend[j]], sa = sA[slotBend[j]], cb = cB[slotTwist[j]], sb = sB[slotTwist[j]];
   // Ry(b)·Rx(a), row-major: bend first, then twist (the chest bone's order, YXZ).
   const r00 = cb, r01 = sb*sa, r02 = sb*ca, r11 = ca, r12 = -sa, r20 = -sb, r21 = cb*sa, r22 = cb*ca;
   // RM = R·M, then K = Mi·RM and the shift Mi·(R·(tr − pivot) + pivot − tr).
   const m0 = r00*M[0]+r01*M[3]+r02*M[6], m1 = r00*M[1]+r01*M[4]+r02*M[7], m2 = r00*M[2]+r01*M[5]+r02*M[8];
   const m3 = r11*M[3]+r12*M[6], m4 = r11*M[4]+r12*M[7], m5 = r11*M[5]+r12*M[8];
   const m6 = r20*M[0]+r21*M[3]+r22*M[6], m7 = r20*M[1]+r21*M[4]+r22*M[7], m8 = r20*M[2]+r21*M[5]+r22*M[8];
   const vx = r00*dx+r01*dy+r02*dz + pivot.x - tr[0], vy = r11*dy+r12*dz + pivot.y - tr[1], vz = r20*dx+r21*dy+r22*dz + pivot.z - tr[2];
   const o = 12*j;
   for(let i = 0; i < 3; i++){
    const a0 = Mi[3*i], a1 = Mi[3*i+1], a2 = Mi[3*i+2];
    K[o+4*i] = a0*m0 + a1*m3 + a2*m6; K[o+4*i+1] = a0*m1 + a1*m4 + a2*m7; K[o+4*i+2] = a0*m2 + a1*m5 + a2*m8; K[o+4*i+3] = a0*vx + a1*vy + a2*vz;
   }
  }
  if(full >= 0){ const o = 12*full; firmLocal.set(K[o],K[o+1],K[o+2],K[o+3], K[o+4],K[o+5],K[o+6],K[o+7], K[o+8],K[o+9],K[o+10],K[o+11], 0,0,0,1); } else firmLocal.identity();
  // Collarbones: each socket's share of its collarbone's turn about the
  // collarbone pivot, measured from the chest's firm top (rest-space F):
  // rest⁻¹ · F · (turn about the pivot) · F⁻¹ · rest.
  F.copy(rest).multiply(firmLocal).multiply(restInv); Fi.copy(F).invert();
  for(let j = 0; j < 2; j++){
   shoulderLocal[j].copy(firmLocal);
   if(!clavActive[j]) continue;
   const h = shoulders[j].head;
   // C = A · (turn by this share) · B, with A and B the same for every share.
   A.copy(restInv).multiply(F).multiply(tmp.makeTranslation(h.x, h.y, h.z));
   B.makeTranslation(-h.x, -h.y, -h.z).multiply(Fi).multiply(rest);
   for(let l = 0; l <= LS; l++){
    part.identity().slerp(clav[j], l / LS);
    C.copy(A).multiply(tmp.makeRotationFromQuaternion(part)).multiply(B);
    const e = C.elements, o = (j * (LS + 1) + l) * 12;
    S[o] = e[0]; S[o+1] = e[4]; S[o+2] = e[8]; S[o+3] = e[12]; S[o+4] = e[1]; S[o+5] = e[5]; S[o+6] = e[9]; S[o+7] = e[13]; S[o+8] = e[2]; S[o+9] = e[6]; S[o+10] = e[10]; S[o+11] = e[14];
    if(l === LS) shoulderLocal[j].premultiply(C);
   }
  }
  const a = P.array, nn = N.array;
  for(let m = 0; m < moving.length; m++){
   const i = moving[m], o = 12*level[i], x = original[3*i], y = original[3*i+1], z = original[3*i+2];
   a[3*i]   = K[o]*x   + K[o+1]*y + K[o+2]*z  + K[o+3];
   a[3*i+1] = K[o+4]*x + K[o+5]*y + K[o+6]*z  + K[o+7];
   a[3*i+2] = K[o+8]*x + K[o+9]*y + K[o+10]*z + K[o+11];
  }
  for(let m = 0; m < shoulderPts.length; m++){
   const i = shoulderPts[m], j = sideOf[i];
   if(!clavActive[j]) continue;
   const o = (j * (LS + 1) + sLevel[i]) * 12, x = a[3*i], y = a[3*i+1], z = a[3*i+2];
   a[3*i]   = S[o]*x   + S[o+1]*y + S[o+2]*z  + S[o+3];
   a[3*i+1] = S[o+4]*x + S[o+5]*y + S[o+6]*z  + S[o+7];
   a[3*i+2] = S[o+8]*x + S[o+9]*y + S[o+10]*z + S[o+11];
  }
  // Firm zone: turn the approved normals with the chest.
  const m = normalTurn.getNormalMatrix(firmLocal).elements;
  for(let f = 0; f < firmList.length; f++){
   const i = firmList[f], x = originalNormals[3*i], y = originalNormals[3*i+1], z = originalNormals[3*i+2];
   const nx = m[0]*x + m[3]*y + m[6]*z, ny = m[1]*x + m[4]*y + m[7]*z, nz = m[2]*x + m[5]*y + m[8]*z, len = Math.sqrt(nx*nx + ny*ny + nz*nz) || 1;
   nn[3*i] = nx/len; nn[3*i+1] = ny/len; nn[3*i+2] = nz/len;
  }
  // Bending zone: area-weighted normals from the bent triangles (as three.js does).
  for(let k = 0; k < softList.length; k++){ const i = 3*softList[k]; acc[i] = acc[i+1] = acc[i+2] = 0; }
  for(let k = 0; k < needList.length; k++){
   const t = 3*needList[k], i0 = 3*I[t], i1 = 3*I[t+1], i2 = 3*I[t+2];
   const ux = a[i1]-a[i0], uy = a[i1+1]-a[i0+1], uz = a[i1+2]-a[i0+2], vx = a[i2]-a[i0], vy = a[i2+1]-a[i0+1], vz = a[i2+2]-a[i0+2];
   const fx = uy*vz - uz*vy, fy = uz*vx - ux*vz, fz = ux*vy - uy*vx;
   acc[i0] += fx; acc[i0+1] += fy; acc[i0+2] += fz; acc[i1] += fx; acc[i1+1] += fy; acc[i1+2] += fz; acc[i2] += fx; acc[i2+1] += fy; acc[i2+2] += fz;
  }
  for(let k = 0; k < softList.length; k++){
   const i = 3*softList[k], sx = acc[i], sy = acc[i+1], sz = acc[i+2], len = Math.sqrt(sx*sx + sy*sy + sz*sz) || 1;
   nn[i] = sx/len; nn[i+1] = sy/len; nn[i+2] = sz/len;
  }
  for(const list of shared){
   let sx = 0, sy = 0, sz = 0;
   for(const i of list){ sx += nn[3*i]; sy += nn[3*i+1]; sz += nn[3*i+2]; }
   const len = Math.sqrt(sx*sx + sy*sy + sz*sz) || 1;
   for(const i of list){ nn[3*i] = sx/len; nn[3*i+1] = sy/len; nn[3*i+2] = sz/len; }
  }
  P.needsUpdate = N.needsUpdate = true; bent = true;
 }
 return {weights: i => [wb[i], wt[i]], shoulderWeight: i => [sideOf[i], ws[i]], apply, firmLocal, shoulderLocal, original, stats: {points: n, moving: moving.length, soft: softList.length, levels: usedKeys.length}};
}
