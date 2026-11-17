import {
  Box3, BoxGeometry, Mesh, MeshStandardMaterial, Object3D, OrthographicCamera, PerspectiveCamera,
  Scene, Vector3, WebGLRenderer,
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
    const floor = new Mesh(new BoxGeometry(size,.6,size), new MeshStandardMaterial());
    floor.position.y = (options.floorY ?? 0)-.3;
    floor.receiveShadow = true;
    scene.add(floor);
    floors.push(floor);
  }
  const material = new MeshStandardMaterial({color:'#8f9295',roughness:1});
  for (const floor of floors) {
    floor.name = 'test-lab-floor';
    floor.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.material = material;
      const old = object.geometry;
      const parameters = old.parameters;
      const wasPlane = old.type === 'PlaneGeometry';
      const width = parameters.width;
      const depth = wasPlane ? parameters.height : parameters.depth;
      const thickness = wasPlane ? .6 : Math.max(.6,parameters.height ?? .6);
      const top = object.position.y+(wasPlane ? 0 : (parameters.height ?? .6)/2);
      object.geometry = new BoxGeometry(width,thickness,depth);
      object.rotation.set(0,0,0);
      object.position.y = top-thickness/2;
      old.dispose();
    });
  }
  const floorBounds = new Box3();
  for (const floor of floors) floorBounds.expandByObject(floor);
  const floorCenter = floorBounds.getCenter(new Vector3());
  const floorRadius = floorBounds.getSize(new Vector3()).length()/2;
  const orthographic = new OrthographicCamera(-1,1,1,-1,camera.near,camera.far);
  const direction = new Vector3(1,1,1).normalize();
  const lookOffset = new Vector3();
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
    // Fit the entire slab between near/far planes, including its closest
    // corner while orbiting on portrait screens. Orthographic framing stays fixed.
    const groundReach = floorRadius+target.distanceTo(floorCenter);
    const renderDistance = distance+Math.max(groundReach,Math.hypot(halfHeight,halfHeight*camera.aspect)*2);
    lookOffset.copy(camera.position).sub(target).normalize();
    orthographic.position.copy(target).addScaledVector(lookOffset,renderDistance);
    orthographic.far = Math.max(camera.far,renderDistance+groundReach+20);
    orthographic.up.copy(camera.up);
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
