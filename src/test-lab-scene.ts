import {
  Mesh, MeshStandardMaterial, Object3D, OrthographicCamera, PerspectiveCamera,
  PlaneGeometry, Scene, Vector3, WebGLRenderer,
} from 'three';

type Options = {
  scene: Scene; camera: PerspectiveCamera; renderer: WebGLRenderer;
  getTarget: () => Vector3; floors?: Object3D[]; floorY?: number;
  floorSize?: number; shadows?: Object3D[]; updateControls?: () => void;
};

/** Shared presentation only. Physics, subject geometry and animation stay in each test. */
export function installTestLabScene(options: Options): void {
  if (!new URLSearchParams(location.search).has('lab')) return;
  const {scene, camera, renderer, getTarget, updateControls} = options;
  const floors = options.floors ?? [];
  if (!floors.length) {
    const size = options.floorSize ?? 30;
    const floor = new Mesh(new PlaneGeometry(size, size), new MeshStandardMaterial());
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = options.floorY ?? 0;
    floor.receiveShadow = true;
    scene.add(floor);
    floors.push(floor);
  }
  const material = new MeshStandardMaterial({color:'#8f9295',roughness:1});
  for (const floor of floors) {
    floor.name = 'test-lab-floor';
    floor.traverse(object => { if (object instanceof Mesh) object.material = material; });
  }
  const orthographic = new OrthographicCamera(-1,1,1,-1,camera.near,camera.far);
  const direction = new Vector3(1,1,1).normalize();
  let isometric = false, floorVisible = true;
  const render = renderer.render.bind(renderer);
  renderer.render = (renderScene, renderCamera) => {
    if (renderScene !== scene || renderCamera !== camera) return render(renderScene,renderCamera);
    for (const floor of [...floors,...(options.shadows ?? [])]) floor.visible = floorVisible;
    if (!isometric) return render(scene,camera);
    const target = getTarget(), distance = camera.position.distanceTo(target);
    const halfHeight = Math.tan(camera.fov*Math.PI/360)*distance*2.4;
    orthographic.left = -halfHeight*camera.aspect;
    orthographic.right = halfHeight*camera.aspect;
    orthographic.top = halfHeight;
    orthographic.bottom = -halfHeight;
    orthographic.position.copy(target).addScaledVector(direction,distance);
    orthographic.up.set(0,1,0);
    orthographic.lookAt(target);
    orthographic.updateProjectionMatrix();
    render(scene,orthographic);
  };
  window.testLabScene = {
    camera, orthographic, floors,
    setIsometric(enabled: boolean) {
      isometric = enabled;
      if (enabled) {
        const target = getTarget(), distance = camera.position.distanceTo(target);
        camera.position.copy(target).addScaledVector(direction,distance);
        camera.up.set(0,1,0); camera.lookAt(target); updateControls?.();
      }
    },
    setFloorVisible(visible: boolean) {
      floorVisible = visible;
      for (const floor of [...floors,...(options.shadows ?? [])]) floor.visible = visible;
    },
    getState: () => ({isometric,floorVisible,floorColor:material.color.getHexString()}),
  };
}

declare global {
  interface Window {
    testLabScene?: {
      camera: PerspectiveCamera; orthographic: OrthographicCamera; floors: Object3D[];
      setIsometric: (enabled: boolean) => void; setFloorVisible: (visible: boolean) => void;
      getState: () => {isometric: boolean; floorVisible: boolean; floorColor: string};
    };
  }
}
