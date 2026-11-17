/**
 * Oval Lab: the slate blue test stage, showing the banked NASCAR-style oval
 * from 3D-WORLD-3 with the grass and dirt blocks around it.
 */

import {
  AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from 'three';
import { buildOvalScene } from './oval.ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stage = document.getElementById('stage') as HTMLElement;

const scene = new Scene();
scene.background = new Color('#405363');

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
stage.prepend(renderer.domElement);

const camera = new PerspectiveCamera(40, 1, 0.05, 200);
scene.add(camera);

// The oval track and the grass and dirt blocks around it.
const oval = buildOvalScene(scene);
const centre = oval.centre;

// Soft fill, plus a light on the camera so the side being looked at is lit.
scene.add(new AmbientLight('#ffffff', 0.55));
const headlight = new DirectionalLight('#ffffff', 2.6);
headlight.position.set(0.3, 0.45, 0);
camera.add(headlight, headlight.target);
headlight.target.position.set(0, 0, -1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2;
controls.maxDistance = 45;

const D = 17;
const views: Record<string, [number, number, number]> = {
  front: [0, 0, D],
  side: [D, 0, 0],
  back: [0, 0, -D],
  top: [0, D * 1.1, 0.001],
  angled: [9, 8, 12],
};
const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-view]')];
function setView(name: string): void {
  // On a tall phone screen, stand farther back so the whole track fits.
  const k = camera.aspect < 0.8 ? 1.4 : 1;
  const [x, y, z] = views[name];
  camera.position.set(centre.x + x * k, centre.y + y * k, centre.z + z * k);
  controls.target.copy(centre);
  controls.update();
  for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.view === name));
}
for (const b of buttons) b.onclick = () => setView(b.dataset.view as string);
controls.addEventListener('start', () => {
  for (const b of buttons) b.setAttribute('aria-pressed', 'false');
});

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
setView('front');

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
