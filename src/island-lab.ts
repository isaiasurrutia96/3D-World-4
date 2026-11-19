import {installTestLabScene} from './test-lab-scene.ts';
/**
 * Island Lab: the slate blue test stage, showing a tiny floating island made
 * of 43 cm blocks (grass, dirt, stone underside). No plants yet.
 */

import {
  AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from 'three';
import { buildIsland } from './world/island/index.ts';
import { BoxGeometry, InstancedMesh } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { BLOCK, ROUNDING } from './world/grid.ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stage = document.getElementById('stage') as HTMLElement;

const scene = new Scene();
scene.background = new Color('#405363');

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = SRGBColorSpace;
stage.prepend(renderer.domElement);

const camera = new PerspectiveCamera(40, 1, 0.3, 200);
scene.add(camera);

// The floating island.
const island = buildIsland(scene);
const centre = island.centre;

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
controls.maxDistance = 35;

// Preview only: the stone underside with rounded (approved), tiny (1.5 mm) or sharp edges.
const stone = island.root.getObjectByName('stone') as InstancedMesh;
const edges: Record<string, () => BoxGeometry | RoundedBoxGeometry> = {
  round: () => new RoundedBoxGeometry(BLOCK, BLOCK, BLOCK, 2, ROUNDING),
  tiny: () => new RoundedBoxGeometry(BLOCK, BLOCK, BLOCK, 2, 0.0015),
  sharp: () => new BoxGeometry(BLOCK, BLOCK, BLOCK),
};
const edgeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-edge]')];
for (const b of edgeButtons) b.onclick = () => {
  stone.geometry.dispose();
  stone.geometry = edges[b.dataset.edge as string]();
  for (const e of edgeButtons) e.setAttribute('aria-pressed', String(e === b));
};

const D = 14;
const views: Record<string, [number, number, number]> = {
  front: [0, 0, D],
  side: [D, 0, 0],
  back: [0, 0, -D],
  top: [0, D * 1.1, 0.001],
  angled: [8, 6, 10.5],
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
(window as unknown as Record<string, unknown>).__lab = { camera, controls };

installTestLabScene({scene,camera,renderer,floorY:-5,getTarget:()=>controls.target,updateControls:()=>controls.update()});
