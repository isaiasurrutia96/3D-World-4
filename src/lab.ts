/**
 * Test Lab: a slate blue stage for examining one object from every side.
 * For now the object is a plain block in the avatar's clay colour.
 */

import {
  AmbientLight, BoxGeometry, Color, DirectionalLight, Mesh, MeshStandardMaterial,
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

// The block, in the avatar's clay colour.
const block = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.8 }),
);
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

const views: Record<string, [number, number, number]> = {
  front: [1.4, 1.0, 3.2],
  side: [3.5, 0.6, 0],
  back: [-1.4, 1.0, -3.2],
  top: [0, 3.6, 0.001],
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
