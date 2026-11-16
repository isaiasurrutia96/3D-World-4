/**
 * The viewing space: one object in a soft off-white room. Drag to move the
 * camera around it, scroll or pinch to zoom. A light rides with the camera,
 * so whichever side you are looking at is lit.
 */

import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new Scene();
scene.background = new Color('#dcd9d3');

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(40, 1, 0.05, 100);
camera.position.set(2.2, 1.6, 3);

// The object being examined: a plain block, 1 m on each side.
const block = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.8 }),
);
scene.add(block);

// Soft fill everywhere, plus a light attached to the camera that points at
// whatever the camera is looking at.
scene.add(new AmbientLight('#ffffff', 0.55));
const headlight = new DirectionalLight('#ffffff', 2.6);
headlight.position.set(0.3, 0.45, 0); // a little above and right of the view
camera.add(headlight);
camera.add(headlight.target);
headlight.target.position.set(0, 0, -1);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.target.set(0, 0, 0);
controls.update();

function resize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  // On a tall phone screen widen the view so the block isn't cramped.
  camera.fov = camera.aspect < 0.8 ? 58 : 40;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

(window as unknown as Record<string, unknown>).__view = { camera, controls, block };
