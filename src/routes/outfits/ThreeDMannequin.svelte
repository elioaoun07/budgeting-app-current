<script context="module" lang="ts">
  // adjust BASE to wherever you placed your files:
  const BASE = '/assets/outfits';
  export const TOPS = [
    `${BASE}/tops/top_black.glb`,
    `${BASE}/tops/top_grey.glb`
  ];
  export const BOTTOMS = [
    `${BASE}/bottoms/pants_black.glb`,
    `${BASE}/bottoms/pants_grey.glb`
  ];
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  export let selectedTop    = 0;
  export let selectedBottom = 0;

  let container: HTMLDivElement;
  let scene, camera, renderer, mixer, clock;
  let THREE, GLTFLoader, OrbitControls, RoomEnvironment;
  let controls: any;
  let topGroup, bottomGroup;

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  async function init() {
    // dynamic imports
    THREE            = await import('three');
    ({ GLTFLoader }  = await import('three/examples/jsm/loaders/GLTFLoader.js'));
    ({ OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js'));
    ({ RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js'));

    // scene + clock
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // camera
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1.5, 4);

    // renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputEncoding      = THREE.sRGBEncoding;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0xf0f0f0, 1);
    container.appendChild(renderer.domElement);

    // environment map
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;

    // extra fill light
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));

    // load base model
    const loader = new GLTFLoader();
    loader.load(
      `${BASE}/base.glb`,
      (gltf) => {
        const base = gltf.scene;
        scene.add(base);

        // center it
        const box = new THREE.Box3().setFromObject(base);
        const center = box.getCenter(new THREE.Vector3());
        base.position.sub(center); // move pivot to (0,0,0)

        // re-fit camera to box
        const size = box.getSize(new THREE.Vector3()).length();
        camera.near = size / 100;
        camera.far  = size * 10;
        camera.updateProjectionMatrix();
        camera.position.set(center.x, center.y + size * 0.2, center.z + size * 0.8);
        controls.target.copy(new THREE.Vector3(0, size * 0.1, 0));
        controls.update();

        // setup clothing groups
        topGroup    = new THREE.Group();
        bottomGroup = new THREE.Group();
        base.add(topGroup, bottomGroup);

        // animations
        mixer = new THREE.AnimationMixer(base);
        if (gltf.animations.length) mixer.clipAction(gltf.animations[0]).play();

        // initial swap
        swapClothing(topGroup,    TOPS[selectedTop]);
        swapClothing(bottomGroup, BOTTOMS[selectedBottom]);
      },
      undefined,
      (err) => console.error('Base load error', err)
    );

    window.addEventListener('resize', onResize);
    onResize();
  }

  function animate() {
    requestAnimationFrame(animate);
    mixer?.update(clock.getDelta());
    controls.update();
    renderer.render(scene, camera);
  }

  // react to changes
  $: if (GLTFLoader   && topGroup)    swapClothing(topGroup,    TOPS[selectedTop]);
  $: if (GLTFLoader   && bottomGroup) swapClothing(bottomGroup, BOTTOMS[selectedBottom]);

  async function swapClothing(group, url: string) {
    group.clear?.();
    try {
      const gltf = await new Promise<any>((res, rej) =>
        new GLTFLoader().load(url, res, undefined, rej)
      );
      group.add(gltf.scene);
    } catch (e) {
      console.error('Clothing load failed', url, e);
    }
  }

  onMount(async () => {
    if (!browser) return;
    await init();
    animate();
  });

  onDestroy(() => {
    window.removeEventListener('resize', onResize);
    renderer?.dispose();
  });
</script>

<style>
  .canvas-container {
    width: 100%;
    max-width: 700px;
    aspect-ratio: 16/9;
    margin: 2rem auto;
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    background: #fff;
  }
</style>

<div class="canvas-container" bind:this={container}></div>