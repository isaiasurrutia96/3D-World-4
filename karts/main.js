// Karts (Test Lab): new karts built on the kart parts system (kart-parts/).
// Chunk 1 shows the GoKart's real chassis with see-through boxes where its
// body parts will go, next to the main test kart (unchanged, imported as is).
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {installTestLabScene} from '../src/test-lab-scene.ts';
import {GOKART, SLOTS, resolveKart} from '../kart-parts/spec.js';
import {buildChassis, buildOutlines, countTriangles} from '../kart-parts/build.js';
import {createKartFrame} from '../racing-lab/src/reference-kart.js';

const SPACING = 3.4;// metres between the two karts' centres
const stage = document.querySelector('#stage');
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

// The new GoKart chassis with its part outlines, and the main kart beside it.
const newKart = new T.Group(); newKart.name = 'new GoKart'; newKart.position.x = -SPACING/2; scene.add(newKart);
const chassis = buildChassis(GOKART); newKart.add(chassis);
const outlines = buildOutlines(GOKART); newKart.add(outlines);
const labels = new T.Group(); labels.name = 'part labels'; newKart.add(labels);
const labelled = new Set();
for (const slot of outlines.children) {// one label per kind of part, on its first box
  const kind = slot.userData.slot; if (labelled.has(kind)) continue; labelled.add(kind);
  const t = tag(slot.userData.label, .085); t.position.copy(slot.position).add(new T.Vector3(0, .16, 0)); t.userData.slot = kind; labels.add(t);
}
const mainKart = createKartFrame(); mainKart.position.x = SPACING/2; scene.add(mainKart);
mainKart.traverse(o => { if (o.isMesh) o.castShadow = true; });
for (const [group, text] of [[newKart, 'New GoKart · chassis'], [mainKart, 'Main kart (unchanged)']]) {
  const t = tag(text, .13); t.position.set(0, .02, 1.95); group.add(t);
}

const slab = new T.Mesh(new T.BoxGeometry(SPACING*2 + 1.5, .6, 5), new T.MeshStandardMaterial({color: '#8f9295', roughness: 1}));
slab.position.y = -.3; slab.receiveShadow = true; scene.add(slab);
scene.add(new T.HemisphereLight(0xffffff, 0xb6b2aa, 2));
const key = new T.DirectionalLight(0xffffff, 2.4); key.position.set(-4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {left: -5, right: 5, top: 4, bottom: -4, near: .5, far: 20}); key.shadow.bias = -.0003;
scene.add(key, key.target);
const fill = new T.DirectionalLight(0xffffff, .9); fill.position.set(5, 3, -4); scene.add(fill);

// Camera: focus on both karts, the new one or the main one. Moves glide.
const camera = new T.PerspectiveCamera(36, 1, .05, 80), controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false; controls.minDistance = .8; controls.maxDistance = 22;
const directions = {front: [0, .25, 1], side: [1, .2, 0], back: [0, .25, -1], top: [0, 1, .0004], angled: [.75, .45, .9]};
const FOCI = {both: {x: 0, across: SPACING + 3.2}, new: {x: -SPACING/2, across: 3.7}, main: {x: SPACING/2, across: 3.7}};
let focus = 'both', viewName = 'angled', glide = null;
function frame() {
  const f = FOCI[focus], target = new T.Vector3(f.x, .45, 0), half = Math.tan(camera.fov*Math.PI/360);
  const distance = Math.max(2.4, (f.across/2)/(half*Math.min(1, camera.aspect))*1.05);
  const dir = new T.Vector3(...directions[viewName]).normalize();
  glide = {fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toTarget: target, toPos: target.clone().add(dir.multiplyScalar(distance)), t: 0};
}
const pressed = (selector, test) => { for (const b of document.querySelectorAll(selector)) b.setAttribute('aria-pressed', String(test(b))); };
function setFocus(name) { focus = name; newKart.visible = name !== 'main'; mainKart.visible = name !== 'new'; frame(); pressed('[data-focus]', b => b.dataset.focus === name); }
function view(name) { viewName = name; frame(); pressed('[data-view]', b => b.dataset.view === name); }

// Parts list: tap a part to highlight its box(es) and read what it is.
const resolved = resolveKart(GOKART), note = document.querySelector('#note');
let highlighted = null;
function highlight(kind) { highlighted = highlighted === kind ? null : kind; applyHighlight(); }
function applyHighlight() {
  for (const slot of outlines.children) {
    const on = highlighted === null || slot.userData.slot === highlighted;
    slot.children[0].material.opacity = highlighted === null ? .16 : on ? .45 : .04;
    slot.children[1].material.opacity = on ? 1 : .25; slot.children[1].material.transparent = !on;
  }
  for (const t of labels.children) t.visible = showLabels && (highlighted === null || t.userData.slot === highlighted);
  pressed('[data-part]', b => b.dataset.part === highlighted);
  note.textContent = highlighted ? `${SLOTS[highlighted].label}: ${SLOTS[highlighted].note}` : intro;
}
const intro = 'The real chassis of the new GoKart: frame, seat, steering and five-spoke wheels. Teal boxes show where its body parts go; amber boxes are places for optional parts players can add. The main kart on the right is unchanged.';
const list = (id, parts) => {
  const host = document.querySelector(id);
  for (const kind of parts) {
    const b = document.createElement('button'); b.dataset.part = kind; b.textContent = SLOTS[kind].label; b.setAttribute('aria-pressed', 'false');
    b.onclick = () => highlight(kind); host.append(b);
  }
};
list('#built-parts', Object.keys(GOKART.body)); list('#optional-parts', Object.keys(GOKART.optional));
let showOutlines = true, showLabels = true;
document.querySelector('#toggle-outlines').onclick = e => { showOutlines = !showOutlines; outlines.visible = showOutlines; labels.visible = showOutlines; e.target.setAttribute('aria-pressed', String(showOutlines)); };
document.querySelector('#toggle-labels').onclick = e => { showLabels = !showLabels; applyHighlight(); e.target.setAttribute('aria-pressed', String(showLabels)); };
for (const b of document.querySelectorAll('[data-focus]')) b.onclick = () => setFocus(b.dataset.focus);
for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => view(b.dataset.view);
controls.addEventListener('start', () => { glide = null; pressed('[data-view]', () => false); });
document.querySelector('#info').textContent = `New chassis: ${Math.round(countTriangles(chassis)).toLocaleString()} triangles · ${resolved.parts.length} part places (${resolved.parts.filter(p => !p.optional).length} built in, ${resolved.parts.filter(p => p.optional).length} optional) · wheels in the same places as the main kart.`;

function resize() { const {width, height} = stage.getBoundingClientRect(); if (!width || !height) return; camera.aspect = width/height; camera.fov = camera.aspect < .7 ? 50 : 36; camera.updateProjectionMatrix(); renderer.setSize(width, height); }
new ResizeObserver(resize).observe(stage); resize();
applyHighlight(); setFocus('both'); view('angled');
camera.position.copy(glide.toPos); controls.target.copy(glide.toTarget); glide = null; controls.update();
installTestLabScene({scene, camera, renderer, floors: [slab], getTarget: () => controls.target, updateControls: () => controls.update()});

let last = 0;
renderer.setAnimationLoop(ms => {
  const dt = Math.min(1/30, last ? (ms - last)/1000 : 0); last = ms;
  if (glide) { glide.t = Math.min(1, glide.t + dt/.35); const k = glide.t*glide.t*(3 - 2*glide.t);
    camera.position.lerpVectors(glide.fromPos, glide.toPos, k); controls.target.lerpVectors(glide.fromTarget, glide.toTarget, k); if (glide.t >= 1) glide = null; }
  controls.update(); renderer.render(scene, camera);
});
window.kartLab = {scene, camera, controls, renderer, chassis, outlines, labels, mainKart, newKart, setFocus, view, highlight, getFocus: () => focus};
document.querySelector('#loading').hidden = true; window.kartLabReady = true;
