/**
 * A floor slab with the approved avatar on it. He walks, runs and jumps;
 * the camera follows behind him and can be turned. A light rides with the
 * camera so the side you look at is lit.
 */

import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
// @ts-ignore — plain JavaScript module saved with the approved avatar.
import { createApprovedAvatar } from '../avatar/src/approved-avatar.js';
import { Input } from './input.ts';
import { Player } from './player.ts';

const BACKGROUND = '#dcd9d3';
const SLAB_SIZE = 40;
const STEP = 1 / 120;

const scene = new Scene();
scene.background = new Color(BACKGROUND);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(50, 1, 0.05, 200);
scene.add(camera);

// ---- Light: soft fill, plus a light on the camera aimed where it looks.
scene.add(new AmbientLight('#ffffff', 0.6));
const headlight = new DirectionalLight('#ffffff', 2.4);
headlight.position.set(0.3, 0.45, 0);
camera.add(headlight, headlight.target);
headlight.target.position.set(0, 0, -1);

// ---- The floor slab: 40 m square, 0.5 m thick, with faint 1 m squares.
function gridTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  g.fillStyle = '#c9c5bd';
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#bcb7ae';
  g.lineWidth = 3;
  g.strokeRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(SLAB_SIZE, SLAB_SIZE);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const topMaterial = new MeshStandardMaterial({ map: gridTexture(), roughness: 0.95 });
const sideMaterial = new MeshStandardMaterial({ color: '#b3aea5', roughness: 0.95 });
const slab = new Mesh(new BoxGeometry(SLAB_SIZE, 0.5, SLAB_SIZE), [
  sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial,
]);
slab.position.y = -0.25;
scene.add(slab);

// ---- The avatar.
const { rig } = createApprovedAvatar();
scene.add(rig.root);
const player = new Player(rig, SLAB_SIZE / 2);

// A soft round shadow under him, so you can tell how high he is.
const shadow = new Mesh(
  new CircleGeometry(0.45, 32),
  new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.18, depthWrite: false }),
);
shadow.rotation.x = -Math.PI / 2;
scene.add(shadow);

// ---- Camera: orbits behind him at a set distance.
const input = new Input(renderer.domElement);
let yaw = Math.PI; // behind him, looking the way he faces
let pitch = 0.32;
let distance = 6;
const lookAt = new Vector3(0, 1.1, 0);
const desired = new Vector3();

function resize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = camera.aspect < 0.8 ? 62 : 50;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

let accumulator = 0;
let last = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const frame = Math.min(0.1, (now - last) / 1000);
  last = now;

  const jumpPressed = input.update(frame);
  yaw -= input.look.x;
  pitch = Math.min(1.2, Math.max(-0.2, pitch + input.look.y));
  distance = Math.min(14, Math.max(2.5, distance * (1 + input.zoom)));
  input.endFrame();

  // Turn the stick into a ground direction relative to the camera.
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const wishX = forwardX * input.move.y - forwardZ * input.move.x;
  const wishZ = forwardZ * input.move.y + forwardX * input.move.x;

  accumulator += frame;
  let first = true;
  while (accumulator >= STEP) {
    player.step(STEP, wishX, wishZ, first && jumpPressed, input.jumpHeld);
    first = false;
    accumulator -= STEP;
  }
  if (first && jumpPressed) player.step(0, 0, 0, true, input.jumpHeld);
  player.animate(frame);

  shadow.visible = player.position.y > -0.3;
  shadow.position.set(player.position.x, 0.01, player.position.z);
  shadow.scale.setScalar(Math.max(0.4, 1 - player.position.y * 0.2));

  // Follow: smooth toward a point above him, then sit behind it.
  const follow = 1 - Math.exp(-10 * frame);
  lookAt.x += (player.position.x - lookAt.x) * follow;
  lookAt.z += (player.position.z - lookAt.z) * follow;
  lookAt.y += (player.position.y + 1.1 - lookAt.y) * follow;
  desired.set(
    lookAt.x + Math.sin(yaw) * Math.cos(pitch) * distance,
    lookAt.y + Math.sin(pitch) * distance,
    lookAt.z + Math.cos(yaw) * Math.cos(pitch) * distance,
  );
  camera.position.copy(desired);
  camera.lookAt(lookAt);

  renderer.render(scene, camera);
});

(window as unknown as Record<string, unknown>).__game = { player, camera, input, rig };
