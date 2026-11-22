// Karts (Test Lab): the fresh set of three karts (kart-parts/), side by side:
// GoKart (small), GT GoKart (medium) and F1 GoKart (large). Pick a kart to
// look closer, swap its part styles, show its part boxes and driver zone, and
// show a grey driver dummy of the avatar's size in every seat to judge scale.
//
// The side panel holds every kart's buttons, built once; other karts' buttons
// are hidden. (The Test Lab copies this panel once when the page loads and
// then follows each button's pressed and hidden state, so it must not be
// rebuilt.)
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {KARTS, SLOTS, STYLES, stylesFor, defaultChoices, layoutKart} from '../kart-parts/spec.js';
import {buildOutlines, buildDriverZone, countTriangles} from '../kart-parts/build.js';
import {buildKart} from '../kart-parts/models.js';
import {driverDummy} from '../kart-parts/kart-model.js';

const GAP = .9;// metres between neighbouring karts
const $ = selector => document.querySelector(selector);
const stage = $('#stage');
const renderer = new T.WebGLRenderer({antialias: true}); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; stage.prepend(renderer.domElement);
const scene = new T.Scene(); scene.background = new T.Color('#405363');

/** A rounded tag that always faces the camera. */
function tag(text, scale = .16) {
  const canvas = document.createElement('canvas'), g = canvas.getContext('2d'), font = '600 64px system-ui,sans-serif'; g.font = font;
  const w = Math.max(128, Math.ceil(g.measureText(text).width) + 64); canvas.width = w; canvas.height = 128;
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(4, 8, w - 8, 112, 56); g.fill();
  g.fillStyle = '#343b40'; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w/2, 68);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(new T.SpriteMaterial({map: texture, depthTest: false})); sprite.scale.set(scale*w/128, scale, 1); sprite.renderOrder = 10;
  return sprite;
}
const dispose = object => object.traverse(o => { o.geometry?.dispose(); if (o.material) [o.material].flat().forEach(m => { m.map?.dispose(); m.dispose(); }); });

// Build every kart once, side by side, each with its driver dummy and zone.
// A kart that fails to build (for example after a tuning change) is reported
// on the page and skipped, so the other karts can still be tested.
const karts = [], buildErrors = [];
let cursor = 0;
for (const kart of KARTS) {
  let model;
  try { model = buildKart(kart); } catch (error) { buildErrors.push(error.message); console.error(error); continue; }
  model.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const size = new T.Box3().setFromObject(model), width = size.max.x - size.min.x;
  const group = new T.Group(); group.name = `kart ${kart.id}`;
  cursor += (karts.length ? GAP : 0) + width/2; group.position.x = cursor; cursor += width/2;
  const dummy = driverDummy(kart, model.userData.steering), zone = buildDriverZone(kart);
  model.getObjectByName('body').add(dummy);// rises with the body
  const label = tag(kart.label, .13); label.position.set(0, .02, size.max.z + .25);
  group.add(model, zone, label); scene.add(group);
  karts.push({kart, model, dummy, zone, group, size, choices: defaultChoices(kart), outlines: null, labels: null});
}
for (const k of karts) k.group.position.x -= cursor/2;
const totalWidth = cursor;

let current = karts[0], showOutlines = false, showLabels = true, showDriver = true, showZone = false, highlighted = null;
function rebuildOutlines(k) {// part boxes and one label per kind of part, for one kart
  for (const o of [k.outlines, k.labels]) if (o) { k.group.remove(o); dispose(o); }
  k.outlines = buildOutlines(k.kart, k.choices); k.group.add(k.outlines);
  k.labels = new T.Group(); k.labels.name = 'part labels'; k.group.add(k.labels);
  const done = new Set();
  for (const box of k.outlines.children) {
    const slot = box.userData.slot; if (done.has(slot)) continue; done.add(slot);
    const t = tag(SLOTS[slot].label, .07); t.position.copy(box.position).add(new T.Vector3(0, box.children[0].geometry.parameters.height/2 + .06, 0));
    t.userData.slot = slot; k.labels.add(t);
  }
}
function applyVisibility() {
  for (const k of karts) {
    const mine = k === current;
    k.dummy.visible = showDriver; k.zone.visible = showZone && mine;
    k.outlines.visible = showOutlines && mine; k.labels.visible = showOutlines && showLabels && mine;
    for (const box of k.outlines.children) {
      const on = highlighted === null || box.userData.slot === highlighted;
      box.children[0].material.opacity = highlighted === null ? .16 : on ? .45 : .04;
      box.children[1].material.opacity = on ? 1 : .25;
    }
    for (const t of k.labels.children) t.visible = highlighted === null || t.userData.slot === highlighted;
  }
}
for (const k of karts) rebuildOutlines(k);

const slab = new T.Mesh(new T.BoxGeometry(totalWidth + 2.4, .6, 5), new T.MeshStandardMaterial({color: '#8f9295', roughness: 1}));
slab.position.y = -.3; slab.receiveShadow = true; scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff, 0xb6b2aa, 2));
const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(-4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left: -5, right: 5, top: 4, bottom: -4, near: .5, far: 20}); key.shadow.bias = -.0003;
scene.add(key, key.target);
const fill = new T.DirectionalLight(0xffffff, .9); fill.position.set(5, 3, -4); scene.add(fill);

// Camera: all three, or the chosen kart. Moves glide.
const camera = new T.PerspectiveCamera(36, 1, .05, 80), controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false; controls.minDistance = .6; controls.maxDistance = 20;
const directions = {front: [0, .25, 1], side: [1, .2, 0], back: [0, .25, -1], top: [0, 1, .0004], angled: [.75, .45, .9]};
let focus = 'all', viewName = 'angled', glide = null;
function frame() {
  const one = focus === 'kart', x = one ? current.group.position.x : 0, across = one ? (current.size.max.z - current.size.min.z) + .6 : totalWidth + .8;
  const target = new T.Vector3(x, .45, 0), half = Math.tan(camera.fov*Math.PI/360);
  const distance = Math.max(1.6, (across/2)/(half*Math.min(1, camera.aspect))*1.05);
  glide = {fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toTarget: target, toPos: target.clone().add(new T.Vector3(...directions[viewName]).normalize().multiplyScalar(distance)), t: 0};
}
const pressed = (selector, test) => { for (const b of document.querySelectorAll(selector)) b.setAttribute('aria-pressed', String(test(b))); };
function setFocus(name) {// looking at one kart hides its neighbours so they never block the view
  focus = name; for (const k of karts) k.group.visible = name === 'all' || k === current;
  frame(); pressed('[data-focus]', b => b.dataset.focus === name);
}
function view(name) { viewName = name; frame(); pressed('[data-view]', b => b.dataset.view === name); }

// Side panel.
const button = (host, text, data, onclick) => {
  const b = document.createElement('button'); b.textContent = text; b.setAttribute('aria-pressed', 'false');
  Object.assign(b.dataset, data); b.onclick = onclick; host.append(b); return b;
};
const mine = selector => `[data-for="${current.kart.id}"]${selector}`;
const intro = () => `${current.kart.label} (${current.kart.size}): built from the approved design, sized around the avatar (grey driver). Swap a part style below to see it snap onto the same spot. Part boxes: teal = the design's parts, amber = optional parts.`;
function info() {
  const b = current.size;
  $('#info').textContent = `${Math.round(countTriangles(current.model)).toLocaleString()} triangles · ${(b.max.z - b.min.z).toFixed(2)} m long, ${(b.max.x - b.min.x).toFixed(2)} m wide.`;
}
function selectStyle(slot, id) {
  current.choices = {...current.choices, [slot]: id}; rebuildOutlines(current);
  showOutlines = true; pressed('#toggle-outlines', () => showOutlines); applyVisibility();
  pressed(mine(`[data-swap="${slot}"]`), b => b.dataset.style === id);
  const problems = layoutKart(current.kart, current.choices).find(p => p.slot === slot).problems;
  $('#note').textContent = problems.length ? problems.join(' ') : `${SLOTS[slot].label}: ${STYLES[slot][id].label} snapped onto the ${SLOTS[slot].label.toLowerCase()} mount (its box is shown).`;
}
function highlight(slot) {
  highlighted = highlighted === slot ? null : slot; if (highlighted) showOutlines = true; pressed('#toggle-outlines', () => showOutlines); applyVisibility();
  pressed(mine('[data-part]'), b => b.dataset.part === highlighted);
  $('#note').textContent = highlighted ? `${SLOTS[highlighted].label}: ${SLOTS[highlighted].note}` : intro();
}
function setKart(id, look = true) {
  current = karts.find(k => k.kart.id === id) ?? karts[0]; highlighted = null;
  pressed('[data-kart]', b => b.dataset.kart === current.kart.id);
  for (const el of document.querySelectorAll('[data-for]')) el.hidden = el.dataset.for !== current.kart.id;
  for (const slot of Object.keys(current.kart.mounts)) pressed(mine(`[data-swap="${slot}"]`), b => b.dataset.style === current.choices[slot]);
  pressed(mine('[data-part]'), () => false);
  applyVisibility(); info(); $('#note').textContent = [...buildErrors, intro()].join(' ');
  if (look || focus === 'kart') setFocus('kart');
}
for (const k of karts) {
  const kart = k.kart;
  button($('#karts'), kart.label, {kart: kart.id}, () => setKart(kart.id));
  for (const slot of Object.keys(kart.mounts)) {
    const ids = stylesFor(kart, slot); if (ids.length < 2) continue;
    const row = document.createElement('section'); row.className = 'swap'; row.dataset.for = kart.id;
    const name = document.createElement('p'); name.textContent = SLOTS[slot].label; row.append(name);
    for (const styleId of ids) button(row, STYLES[slot][styleId].label, {for: kart.id, swap: slot, style: styleId}, () => selectStyle(slot, styleId));
    $('#swaps').append(row);
  }
  for (const slot of Object.keys(kart.mounts)) button($('#parts'), SLOTS[slot].label + (kart.design[slot] ? '' : ' (optional)'), {for: kart.id, part: slot}, () => highlight(slot));
}
const toggle = (id, get, set) => { const b = $(id); b.setAttribute('aria-pressed', String(get())); b.onclick = () => { set(!get()); b.setAttribute('aria-pressed', String(get())); applyVisibility(); }; };
toggle('#toggle-driver', () => showDriver, v => { showDriver = v; });
toggle('#toggle-outlines', () => showOutlines, v => { showOutlines = v; });
toggle('#toggle-labels', () => showLabels, v => { showLabels = v; });
toggle('#toggle-zone', () => showZone, v => { showZone = v; });
for (const b of document.querySelectorAll('[data-focus]')) b.onclick = () => setFocus(b.dataset.focus);
for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => view(b.dataset.view);
controls.addEventListener('start', () => { glide = null; pressed('[data-view]', () => false); });

function resize() { const {width, height} = stage.getBoundingClientRect(); if (!width || !height) return; camera.aspect = width/height; camera.fov = camera.aspect < .7 ? 50 : 36; camera.updateProjectionMatrix(); renderer.setSize(width, height); }
new ResizeObserver(resize).observe(stage); resize();
if (!karts.length) throw new Error(`No kart could be built: ${buildErrors.join(' ')}`);
setKart(karts[0].kart.id, false); setFocus('all'); view('angled');
camera.position.copy(glide.toPos); controls.target.copy(glide.toTarget); glide = null; controls.update();
installTestLabScene({scene, camera, renderer, floors: [slab], getTarget: () => controls.target, updateControls: () => controls.update()});

let last = 0;
renderer.setAnimationLoop(ms => {
  const dt = Math.min(1/30, last ? (ms - last)/1000 : 0); last = ms;
  if (glide) { glide.t = Math.min(1, glide.t + dt/.35); const e = glide.t*glide.t*(3 - 2*glide.t);
    camera.position.lerpVectors(glide.fromPos, glide.toPos, e); controls.target.lerpVectors(glide.fromTarget, glide.toTarget, e); if (glide.t >= 1) glide = null; }
  controls.update(); renderer.render(scene, camera);
});
window.kartLab = {scene, camera, controls, renderer, karts, buildErrors, setKart, selectStyle, setFocus, view, highlight,
  get kart() { return current.kart; }, get current() { return current; }, get choices() { return current.choices; }, getFocus: () => focus};
$('#loading').hidden = true; window.kartLabReady = true;
