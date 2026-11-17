/**
 * Test Lab: a slate blue stage for examining one object from every side.
 * Now showing a 3D diamond built from 43 cm voxel blocks.
 */

import {
  AmbientLight, BoxGeometry, BufferGeometry, Color, DirectionalLight, EdgesGeometry,
  Float32BufferAttribute, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4,
  MeshStandardMaterial, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
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

// A 3D diamond (gem shape) built from 43 cm voxel blocks: every block whose
// grid position satisfies |x| + |y| + |z| <= RADIUS. Pointy at the top and
// bottom, widest at the middle layer.
const BLOCK = 0.43;
const RADIUS = 4; // blocks from the centre to each point (9 blocks tall)
const cells: [number, number, number][] = [];
/**
 * Layers trimmed off each of the 6 points (top, bottom, front, back, left,
 * right): 1 removes the tip block, 2 also removes the layer under it.
 */
const TRIM = 2;
function isTip(x: number, y: number, z: number): boolean {
  return Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) > RADIUS - TRIM;
}
for (let x = -RADIUS; x <= RADIUS; x++)
  for (let y = -RADIUS; y <= RADIUS; y++)
    for (let z = -RADIUS; z <= RADIUS; z++)
      if (Math.abs(x) + Math.abs(y) + Math.abs(z) <= RADIUS && !isTip(x, y, z)) cells.push([x, y, z]);

const cube = new BoxGeometry(BLOCK, BLOCK, BLOCK);
const diamond = new InstancedMesh(
  cube, new MeshStandardMaterial({ color: '#ffffff', roughness: 0.8 }), cells.length,
);
const matrix = new Matrix4();
const shade = new Color();
cells.forEach(([x, y, z], i) => {
  matrix.makeTranslation(x * BLOCK, y * BLOCK, z * BLOCK);
  diamond.setMatrixAt(i, matrix);
  // Clay colour, alternating very slightly so single blocks are visible.
  shade.set('#b9b2a6').multiplyScalar((x + y + z) % 2 === 0 ? 1 : 0.93);
  diamond.setColorAt(i, shade);
});
scene.add(diamond);

// Thin dark outlines on every block edge.
const edgePositions: number[] = [];
const cubeEdges = new EdgesGeometry(cube).attributes.position;
for (const [x, y, z] of cells)
  for (let i = 0; i < cubeEdges.count; i++)
    edgePositions.push(cubeEdges.getX(i) + x * BLOCK, cubeEdges.getY(i) + y * BLOCK, cubeEdges.getZ(i) + z * BLOCK);
const edgeGeometry = new BufferGeometry();
edgeGeometry.setAttribute('position', new Float32BufferAttribute(edgePositions, 3));
scene.add(new LineSegments(edgeGeometry, new LineBasicMaterial({ color: '#5d5951', transparent: true, opacity: 0.45 })));

// Soft fill, plus a light on the camera so the side being looked at is lit.
scene.add(new AmbientLight('#ffffff', 0.55));
const headlight = new DirectionalLight('#ffffff', 2.6);
headlight.position.set(0.3, 0.45, 0);
camera.add(headlight, headlight.target);
headlight.target.position.set(0, 0, -1);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 2.5;
controls.maxDistance = 25;

const D = 8.5;
const views: Record<string, [number, number, number]> = {
  front: [0, 0, D],
  side: [D, 0, 0],
  back: [0, 0, -D],
  top: [0, D, 0.001],
  angled: [4.5, 3.6, 6.4],
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
