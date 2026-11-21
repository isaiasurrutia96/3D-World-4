// Karts (Test Lab): new karts built on the kart parts system (kart-parts/).
// Shows the three approved karts' part places, measured from their designs:
// the GoKart with its real chassis, the GT and F1 GoKarts with their wheels
// (their chassis come later). Part styles can be swapped to see them snap onto
// the same mount, and the red driver zone shows where no part may go. The main
// test kart stands beside, unchanged.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {KARTS, SLOTS, STYLES, stylesFor, defaultChoices, layoutKart} from '../kart-parts/spec.js';
import {buildChassis, buildWheels, buildOutlines, buildDriverZone, countTriangles} from '../kart-parts/build.js';
import {createKartFrame} from '../racing-lab/src/reference-kart.js';

const SPACING = 3.8;// metres between the new kart's centre and the main kart's
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

// The new kart (rebuilt when the kart or a style changes) and the main kart.
const newKart = new T.Group(); newKart.name = 'new kart'; newKart.position.x = -SPACING/2; scene.add(newKart);
const mainKart = createKartFrame(); mainKart.position.x = SPACING/2; scene.add(mainKart);
mainKart.traverse(o => { if (o.isMesh) o.castShadow = true; });
const mainTag = tag('Main kart (unchanged)', .13); mainTag.position.set(0, .02, 2.1); mainKart.add(mainTag);

let kart = KARTS[0], choices = defaultChoices(kart), base = null, outlines = null, labels = null, zone = null, kartTag = null;
let showOutlines = true, showLabels = true, showDriver = true, highlighted = null;

function rebuildBase() {// chassis or wheels, the driver zone and the name tag
  for (const o of [base, zone, kartTag]) if (o) { newKart.remove(o); dispose(o); }
  base = kart.hasChassis ? buildChassis(kart) : buildWheels(kart); base.traverse(o => { if (o.isMesh) o.castShadow = true; }); newKart.add(base);
  zone = buildDriverZone(kart); zone.visible = showDriver; newKart.add(zone);
  kartTag = tag(kart.hasChassis ? `New ${kart.label} · chassis` : `New ${kart.label} · wheels and part places`, .13); kartTag.position.set(0, .02, 2.1); newKart.add(kartTag);
}
function rebuildOutlines() {// part boxes and one label per kind of part
  for (const o of [outlines, labels]) if (o) { newKart.remove(o); dispose(o); }
  outlines = buildOutlines(kart, choices); newKart.add(outlines);
  labels = new T.Group(); labels.name = 'part labels'; newKart.add(labels);
  const done = new Set();
  for (const box of outlines.children) {
    const slot = box.userData.slot; if (done.has(slot)) continue; done.add(slot);
    const size = box.children[0].geometry.parameters, t = tag(SLOTS[slot].label, .085);
    t.position.copy(box.position).add(new T.Vector3(0, size.height/2 + .08, 0)); t.userData.slot = slot; labels.add(t);
  }
  applyVisibility();
}
function applyVisibility() {
  outlines.visible = showOutlines; labels.visible = showOutlines && showLabels; zone.visible = showDriver;
  for (const box of outlines.children) {
    const on = highlighted === null || box.userData.slot === highlighted;
    box.children[0].material.opacity = highlighted === null ? .16 : on ? .45 : .04;
    box.children[1].material.opacity = on ? 1 : .25;
  }
  for (const t of labels.children) t.visible = highlighted === null || t.userData.slot === highlighted;
}

const slab = new T.Mesh(new T.BoxGeometry(SPACING*2 + 2, .6, 5.6), new T.MeshStandardMaterial({color: '#8f9295', roughness: 1}));
slab.position.y = -.3; slab.receiveShadow = true; scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff, 0xb6b2aa, 2));
const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(-4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left: -5.5, right: 5.5, top: 4, bottom: -4, near: .5, far: 20}); key.shadow.bias = -.0003;
scene.add(key, key.target);
const fill = new T.DirectionalLight(0xffffff, .9); fill.position.set(5, 3, -4); scene.add(fill);

// Camera: both karts, the new one or the main one. Moves glide.
const camera = new T.PerspectiveCamera(36, 1, .05, 80), controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false; controls.minDistance = .8; controls.maxDistance = 24;
const directions = {front: [0, .25, 1], side: [1, .2, 0], back: [0, .25, -1], top: [0, 1, .0004], angled: [.75, .45, .9]};
const FOCI = {both: {x: 0, across: SPACING + 3.8}, new: {x: -SPACING/2, across: 4.2}, main: {x: SPACING/2, across: 3.7}};
let focus = 'both', viewName = 'angled', glide = null;
function frame() {
  const f = FOCI[focus], target = new T.Vector3(f.x, .5, 0), half = Math.tan(camera.fov*Math.PI/360);
  const distance = Math.max(2.4, (f.across/2)/(half*Math.min(1, camera.aspect))*1.05);
  const dir = new T.Vector3(...directions[viewName]).normalize();
  glide = {fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toTarget: target, toPos: target.clone().add(dir.multiplyScalar(distance)), t: 0};
}
const pressed = (selector, test) => { for (const b of document.querySelectorAll(selector)) b.setAttribute('aria-pressed', String(test(b))); };
function setFocus(name) { focus = name; newKart.visible = name !== 'main'; mainKart.visible = name !== 'new'; frame(); pressed('[data-focus]', b => b.dataset.focus === name); }
function view(name) { viewName = name; frame(); pressed('[data-view]', b => b.dataset.view === name); }

// Side panel: kart picker, style swaps and the parts list.
const button = (host, text, data, onclick) => {
  const b = document.createElement('button'); b.textContent = text; b.setAttribute('aria-pressed', 'false');
  Object.assign(b.dataset, data); b.onclick = onclick; host.append(b); return b;
};
const intro = () => `${kart.label}: part places measured from the approved design. Teal = parts of the design, amber = optional parts, red = would not fit. The red see-through boxes are the driver zone, where no part may go. Swap a style below to see it snap onto the same spot.`;
function info() {
  const parts = layoutKart(kart, choices), boxes = parts.reduce((n, p) => n + p.boxes.length, 0);
  const tris = kart.hasChassis ? ` · chassis ${Math.round(countTriangles(base)).toLocaleString()} triangles` : '';
  const wb = (kart.wheels.frontZ - kart.wheels.rearZ).toFixed(2);
  $('#info').textContent = `${parts.length} kinds of parts, ${boxes} boxes · wheelbase ${wb} m${tris}${kart.hasChassis ? ' · wheels in the same places as the main kart' : ''}.`;
}
function selectStyle(slot, id) {
  choices = {...choices, [slot]: id}; rebuildOutlines(); info();
  pressed(`[data-swap="${slot}"]`, b => b.dataset.style === id);
  const problems = layoutKart(kart, choices).find(p => p.slot === slot).problems;
  $('#note').textContent = problems.length ? problems.join(' ') : `${SLOTS[slot].label}: ${STYLES[slot][id].label} snapped onto the ${SLOTS[slot].label.toLowerCase()} mount.`;
}
function highlight(slot) {
  highlighted = highlighted === slot ? null : slot; applyVisibility();
  pressed('[data-part]', b => b.dataset.part === highlighted);
  $('#note').textContent = highlighted ? `${SLOTS[highlighted].label}: ${SLOTS[highlighted].note}` : intro();
}
function setKart(id) {
  kart = KARTS.find(k => k.id === id) ?? KARTS[0]; choices = defaultChoices(kart); highlighted = null;
  rebuildBase(); rebuildOutlines(); info();
  pressed('[data-kart]', b => b.dataset.kart === kart.id);
  const swaps = $('#swaps'); swaps.replaceChildren();
  for (const slot of Object.keys(kart.mounts)) {
    const ids = stylesFor(kart, slot); if (ids.length < 2) continue;
    const row = document.createElement('div'); row.className = 'swap';
    const name = document.createElement('p'); name.textContent = SLOTS[slot].label; row.append(name);
    const group = document.createElement('div'); row.append(group);
    for (const styleId of ids) button(group, STYLES[slot][styleId].label, {swap: slot, style: styleId}, () => selectStyle(slot, styleId));
    swaps.append(row);
    pressed(`[data-swap="${slot}"]`, b => b.dataset.style === choices[slot]);
  }
  const parts = $('#parts'); parts.replaceChildren();
  for (const slot of Object.keys(kart.mounts)) button(parts, SLOTS[slot].label + (kart.design[slot] ? '' : ' (optional)'), {part: slot}, () => highlight(slot));
  $('#note').textContent = intro();
}
for (const k of KARTS) button($('#karts'), k.label, {kart: k.id}, () => setKart(k.id));
const toggle = (id, get, set) => { const b = $(id); b.onclick = () => { set(!get()); b.setAttribute('aria-pressed', String(get())); applyVisibility(); }; };
toggle('#toggle-outlines', () => showOutlines, v => { showOutlines = v; });
toggle('#toggle-labels', () => showLabels, v => { showLabels = v; });
toggle('#toggle-driver', () => showDriver, v => { showDriver = v; });
for (const b of document.querySelectorAll('[data-focus]')) b.onclick = () => setFocus(b.dataset.focus);
for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => view(b.dataset.view);
controls.addEventListener('start', () => { glide = null; pressed('[data-view]', () => false); });

function resize() { const {width, height} = stage.getBoundingClientRect(); if (!width || !height) return; camera.aspect = width/height; camera.fov = camera.aspect < .7 ? 50 : 36; camera.updateProjectionMatrix(); renderer.setSize(width, height); }
new ResizeObserver(resize).observe(stage); resize();
setKart(KARTS[0].id); setFocus('both'); view('angled');
camera.position.copy(glide.toPos); controls.target.copy(glide.toTarget); glide = null; controls.update();
installTestLabScene({scene, camera, renderer, floors: [slab], getTarget: () => controls.target, updateControls: () => controls.update()});

let last = 0;
renderer.setAnimationLoop(ms => {
  const dt = Math.min(1/30, last ? (ms - last)/1000 : 0); last = ms;
  if (glide) { glide.t = Math.min(1, glide.t + dt/.35); const k = glide.t*glide.t*(3 - 2*glide.t);
    camera.position.lerpVectors(glide.fromPos, glide.toPos, k); controls.target.lerpVectors(glide.fromTarget, glide.toTarget, k); if (glide.t >= 1) glide = null; }
  controls.update(); renderer.render(scene, camera);
});
window.kartLab = {scene, camera, controls, renderer, mainKart, newKart, setKart, selectStyle, setFocus, view, highlight,
  get kart() { return kart; }, get choices() { return choices; }, get base() { return base; }, get outlines() { return outlines; }, get zone() { return zone; }, getFocus: () => focus};
$('#loading').hidden = true; window.kartLabReady = true;
