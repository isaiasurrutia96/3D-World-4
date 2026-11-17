/**
 * Test Lab: a slate blue stage for examining one object from every side.
 * For now the object is a plain block in the avatar's clay colour.
 */

import {
  AmbientLight, BoxGeometry, CanvasTexture, Color, DirectionalLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stage = document.getElementById('stage') as HTMLElement;

const scene = new Scene();
scene.background = new Color('#405363');

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
stage.prepend(renderer.domElement);

const camera = new PerspectiveCamera(40, 1, 0.05, 100);
scene.add(camera);

// The block, in the avatar's clay colour, with a number on each side.
// 1 is the front; opposite sides add up to 7, like a die.
function numberedFace(n: number): MeshStandardMaterial {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#b9b2a6';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#4a4640';
  g.font = '700 150px system-ui, -apple-system, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), 128, 138);
  const map = new CanvasTexture(c);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  return new MeshStandardMaterial({ map, roughness: 0.8 });
}
// Box face order: right, left, top, bottom, front, back.
const block = new Mesh(new BoxGeometry(1, 1, 1), [2, 5, 3, 4, 1, 6].map(numberedFace));
scene.add(block);

// Soft fill, plus a light on the camera so the side being looked at is lit.
scene.add(new AmbientLight('#ffffff', 0.55));
const headlight = new DirectionalLight('#ffffff', 2.6);
headlight.position.set(0.3, 0.45, 0);
camera.add(headlight, headlight.target);
headlight.target.position.set(0, 0, -1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1.2;
controls.maxDistance = 10;

const D = 3.6;
const views: Record<string, [number, number, number]> = {
  front: [0, 0, D],
  side: [D, 0, 0],
  back: [0, 0, -D],
  top: [0, D, 0.001],
  angled: [1.9, 1.5, 2.7],
};
const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-view]')];
function setView(name: string): void {
  camera.position.set(...views[name]);
  controls.target.set(0, 0, 0);
  controls.update();
  for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.view === name));
}
for (const b of buttons) b.onclick = () => setView(b.dataset.view as string);
controls.addEventListener('start', () => {
  for (const b of buttons) b.setAttribute('aria-pressed', 'false');
});
setView('front');

function resize(): void {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 55 : 40;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
new ResizeObserver(resize).observe(stage);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
