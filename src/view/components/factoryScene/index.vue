<template>
  <section ref="host" class="factory-scene" aria-label="九条产线三维车间总览">
    <div class="scene-heading"><span class="scene-index">01 / FACTORY</span><h2>生产车间总览</h2><span class="scene-subtitle">九线协同 · 实时监测</span></div>
    <div class="scene-legend"><span><i class="running"></i>运行</span><span><i class="fault"></i>异常</span><span><i class="stopped"></i>停止</span></div>
    <div ref="viewport" class="scene-viewport"></div>
    <div v-if="unavailable" class="scene-unavailable">当前设备无法显示三维场景，请通过产线标签查看详情。</div>
    <div class="scene-labels">
      <button v-for="(machine, index) in machines" :key="machine.des" class="line-label" :class="[status(machine), { selected: hovered === index }]"
        :style="labelStyle(index)" :aria-label="`${machine.name}，${statusText(machine)}${machine.faultPoints?.length ? '，异常检测点：' + machine.faultPoints.map(point => point.point).join('、') : ''}`"
        @mouseenter="setHovered(index)" @mouseleave="setHovered(-1)" @focus="setHovered(index)" @blur="setHovered(-1)"
        @click.stop="emit('select', machine, $event)">
        <span class="machine-visual"><span class="status-halo" aria-hidden="true"></span><img :src="machine.img" :alt="machine.name" class="original-machine"><span class="running-flow" aria-hidden="true"></span></span>
        <span class="line-label-main"><span class="status-symbol" aria-hidden="true">{{ status(machine) === 'fault' ? '!' : machine.isUsing ? '▶' : 'Ⅱ' }}</span><strong>{{ machine.name }}</strong></span>
        <span v-if="machine.faultPoints?.length" class="line-faults" :title="machine.faultPoints.map(point => point.point).join(' / ')">异常点 · {{ machine.faultPoints.map(point => point.point).join(' / ') }}</span>
      </button>
    </div>
    <div class="scene-footer"><span class="view-hint"><i></i>斜俯视角 <b> / </b> 点击产线查看详情</span><span class="floor-caption">3 × 3 <b> / </b> 生产作业区</span></div>
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps({ machines: { type: Array, required: true } });
const emit = defineEmits(['select']);
const host = ref(null), viewport = ref(null), labels = ref([]), hovered = ref(-1), unavailable = ref(false);
const status = machine => machine.faultPoints?.length ? 'fault' : machine.isUsing ? 'running' : 'stopped';
const statusText = machine => ({ running: '运行中', fault: `检测异常 · ${machine.faultPoints?.length || 0}处`, stopped: '已停止' })[status(machine)];
let scene, camera, renderer, observer, disposed = false;
let width = 1, height = 1, pointerStart = null;
const lineGroups = [], anchors = [], materials = new Map();
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();

function material(color, metalness = .3, roughness = .55) {
  const key = `${color}-${metalness}-${roughness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  return materials.get(key);
}
function box(parent, x, y, z, w, h, d, color, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}
function floorMark(x, z, w, d, color = 0x6e8797) { return box(scene, x, .045, z, w, .025, d, color, false); }

function createFactory() {
  // The slab, aisles, equipment and shadows share one world coordinate system.
  box(scene, 0, -.55, 0, 47, 1.1, 30, 0x263d50);
  box(scene, 0, -.015, 0, 46.7, .04, 29.7, 0x354b5a, false);
  const grid = new THREE.GridHelper(46, 46, 0x506675, 0x405765);
  grid.position.y = .015; grid.scale.z = 29.5 / 46; scene.add(grid);
  // Two continuous logistics lanes, with solid safety boundaries and centre dashes.
  for (const z of [-4.45, 4.45]) {
    floorMark(0, z, 44, 2.05, 0x273e4c);
    for (const edge of [-1, 1]) floorMark(0, z + edge * .94, 44, .065, 0xc6ac65);
    for (let x = -21; x <= 21; x += 2.8) floorMark(x, z, 1.05, .055, 0x8495a0);
  }
  for (const x of [-7.5, 7.5]) {
    floorMark(x, 0, 1.6, 27.2, 0x273e4c);
    for (const edge of [-1, 1]) floorMark(x + edge * .72, 0, .055, 27.2, 0xb69f61);
  }
  // Cutaway rear wall and structural columns establish the scale of the workshop.
  box(scene, 0, .7, -14.4, 46.6, 1.4, .28, 0x69808e);
  box(scene, -23, .7, 0, .28, 1.4, 29, 0x597381);
  for (const x of [-22.6, -7.5, 7.5, 22.6]) {
    box(scene, x, 2.3, -14.2, .36, 4.6, .42, 0x92a6ad);
    box(scene, x, .3, -14.2, .65, .6, .7, 0xbba15f);
  }
  for (const z of [-8.9, 0, 8.9]) {
    box(scene, -22.8, 1.8, z, .4, 3.6, .4, 0x80969f);
    for (let stripe = 0; stripe < 4; stripe++) box(scene, -22.56, .35 + stripe * .28, z, .025, .12, .42, 0xbda568, false);
  }
  // Low utility cabinets along the rear wall.
  for (let i = 0; i < 6; i++) {
    box(scene, -19 + i * 1.1, .8, -13.35, .95, 1.6, .65, 0x9aaeb5);
    box(scene, -19 + i * 1.1, 1.1, -12.99, .5, .35, .025, 0x203d4a, false);
  }
  props.machines.forEach((machine, index) => createLine(index));
}

function createLine(index) {
  const group = new THREE.Group();
  const row = Math.floor(index / 3) - 1;
  group.position.set((index % 3 - 1) * 15 + row * 2, 0, row * 8.9);
  group.userData.lineIndex = index; scene.add(group); lineGroups.push(group);
  // Keep the user's original equipment images; only build their floor work cells.
  box(group, 0, .055, 0, 12.7, .06, 5.65, 0x415b67, false);
  for (const z of [-2.82, 2.82]) box(group, 0, .095, z, 12.7, .025, .055, 0x7e9298, false);
  for (const x of [-6.35, 6.35]) box(group, x, .095, 0, .055, .025, 5.65, 0x7e9298, false);
  anchors.push(new THREE.Vector3(group.position.x, .2, group.position.z + 2.2));
}

function updateStatus() { render(); }
watch(() => props.machines.map(machine => [machine.isUsing, machine.faultPoints?.length]), updateStatus, { deep: true });

function labelStyle(index) {
  if (unavailable.value) return { left: `${17 + index % 3 * 33}%`, top: `${35 + Math.floor(index / 3) * 27}%`, width: '24%' };
  const point = labels.value[index];
  return point ? { left: `${point.x}px`, top: `${point.y}px`, width: `${point.width}px`, zIndex: Math.round(point.y) } : { visibility: 'hidden' };
}
function render() {
  if (!renderer || disposed) return;
  renderer.render(scene, camera);
  labels.value = anchors.map((anchor, index) => {
    const p = anchor.clone().project(camera);
    const edge = anchor.clone().add(new THREE.Vector3(11.7 * (.92 + Math.floor(index / 3) * .04), 0, 0)).project(camera);
    return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2, width: Math.min(Math.abs(edge.x - p.x) * width / 2, width * .255, height * .55) };
  });
}
function setHovered(index) {
  hovered.value = index;
  lineGroups.forEach((group, i) => {
    // Highlight only the cell footing, without changing machine status colours.
    group.children[0].material = material(i === index ? 0x496e7b : 0x415b67);
  });
  render();
}
function fitCamera() {
  if (!camera || !viewport.value) return;
  width = viewport.value.clientWidth; height = viewport.value.clientHeight;
  if (!width || !height) return;
  camera.updateMatrixWorld();
  const bounds = new THREE.Box3(new THREE.Vector3(-24, -1.2, -15.5), new THREE.Vector3(24, 4.8, 15.5));
  let maxX = 0;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const p = new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    maxX = Math.max(maxX, Math.abs(p.x));
  }
  // Frame the work cells instead of shrinking the entire slab to a centred model.
  // Independent floor framing uses the wide panel while preserving image proportions.
  camera.left = -maxX * 1.045; camera.right = maxX * 1.045;
  const anchorHeights = anchors.map(anchor => anchor.clone().applyMatrix4(camera.matrixWorldInverse).y);
  const maxAnchorY = Math.max(...anchorHeights), minAnchorY = Math.min(...anchorHeights);
  const imageHeight = Math.min(width * .255, height * .55) / 1.9;
  const topPadding = imageHeight * .88 + 8, bottomPadding = imageHeight * .12 + 50;
  const scaleY = Math.max(1, height - topPadding - bottomPadding) / (maxAnchorY - minAnchorY);
  camera.top = maxAnchorY + topPadding / scaleY;
  camera.bottom = minAnchorY - bottomPadding / scaleY;
  camera.updateProjectionMatrix(); renderer.setSize(width, height); render();
}
function pick(event) {
  const rect = viewport.value.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(lineGroups, true)[0];
  if (!hit) return -1;
  let object = hit.object;
  while (object.parent && object.userData.lineIndex == null) object = object.parent;
  return object.userData.lineIndex ?? -1;
}
function onPointerMove(event) {
  if (pointerStart || !renderer) return;
  const index = pick(event);
  if (index !== hovered.value) setHovered(index);
  viewport.value.style.cursor = index >= 0 ? 'pointer' : 'default';
}
function onPointerDown(event) { pointerStart = { x: event.clientX, y: event.clientY }; }
function onPointerUp(event) {
  if (!pointerStart) return;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y); pointerStart = null;
  if (distance > 5) return;
  const index = pick(event);
  if (index >= 0) {
    const label = host.value.querySelectorAll('.line-label')[index];
    emit('select', props.machines[index], { currentTarget: label });
  }
}
function onPointerLeave() { pointerStart = null; setHovered(-1); }

onMounted(() => {
  try {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-35, 35, 22, -22, .1, 200);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0); viewport.value.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xcceaff, 0x26394b, 2));
    const sun = new THREE.DirectionalLight(0xe5f3ff, 3.1);
    sun.position.set(-15, 35, 16); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -33, right: 33, top: 30, bottom: -30, near: 1, far: 90 });
    sun.shadow.normalBias = .045; sun.shadow.bias = -.0002; scene.add(sun);
    const rim = new THREE.DirectionalLight(0x64bded, 1.4); rim.position.set(18, 12, -18); scene.add(rim);
    createFactory();
    camera.position.set(-5, 48, 70); camera.lookAt(0, 0, 0); fitCamera(); updateStatus();
    observer = new ResizeObserver(fitCamera); observer.observe(viewport.value);
    viewport.value.addEventListener('pointermove', onPointerMove);
    viewport.value.addEventListener('pointerdown', onPointerDown);
    viewport.value.addEventListener('pointerup', onPointerUp);
    viewport.value.addEventListener('pointerleave', onPointerLeave);

  } catch (error) {
    unavailable.value = true;
    console.error('三维车间初始化失败', error);
  }
});
onBeforeUnmount(() => {
  disposed = true; observer?.disconnect();
  if (viewport.value) {
    viewport.value.removeEventListener('pointermove', onPointerMove);
    viewport.value.removeEventListener('pointerdown', onPointerDown);
    viewport.value.removeEventListener('pointerup', onPointerUp);
    viewport.value.removeEventListener('pointerleave', onPointerLeave);
  }
  const geometries = new Set(), usedMaterials = new Set(materials.values());
  scene?.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) usedMaterials.add(object.material); if (object.shadow) object.shadow.map?.dispose(); });
  geometries.forEach(geometry => geometry.dispose()); usedMaterials.forEach(item => item.dispose());
  renderer?.dispose(); renderer?.domElement.remove();
});
</script>

<style scoped>
.factory-scene { position: relative; width: 100%; height: 100%; min-height: 0; overflow: hidden; border: 1PX solid #65d5ff25; border-radius: 5PX; background: radial-gradient(ellipse at 48% 52%, #1b415966, #07182c66 65%, #041021aa); isolation: isolate; }
.scene-heading { position: absolute; left: 18PX; top: 15PX; display: flex; align-items: center; gap: 12PX; z-index: 2; pointer-events: none; }
.scene-index { font: 10PX monospace; letter-spacing: 1.5PX; color: #66c6dc; }
h2 { margin: 0; color: #d6e9f2; font-size: 16PX; font-weight: 500; letter-spacing: 2PX; }
.scene-subtitle { color: #6e96ac; font-size: 10PX; padding-left: 12PX; border-left: 1PX solid #587d9266; }
.scene-legend { position: absolute; top: 18PX; right: 18PX; display: flex; gap: 14PX; color: #98b2c1; font-size: 10PX; z-index: 2; }
.scene-legend span { display: flex; align-items: center; gap: 5PX; }
.scene-legend i, .line-label i { width: 5PX; height: 5PX; border-radius: 50%; display: inline-block; background: var(--status); box-shadow: 0 0 6PX color-mix(in srgb, var(--status) 50%, transparent); flex-shrink: 0; }
.running { --status: #46e4c5; } .fault { --status: #ff6a66; } .stopped { --status: #a3b1bf; }
.scene-viewport, .scene-labels { position: absolute; inset: 45PX 8PX 36PX; }
.scene-viewport { touch-action: none; }
.scene-viewport :deep(canvas) { display: block; width: 100%; height: 100%; opacity: .3; }
.scene-labels { pointer-events: none; }
.line-label { position: absolute; transform: translate(-50%, -88%); border: 0; padding: 0; background: transparent; color: #d7e7ef; cursor: pointer; pointer-events: auto; font-family: inherit; transition: filter .2s; }
.machine-visual { position: relative; display: block; isolation: isolate; }
.original-machine { display: block; width: 100%; height: auto; filter: drop-shadow(9PX 15PX 6PX #0008); transition: transform .25s, filter .25s; pointer-events: none; }
.line-label-main { position: absolute; top: 78%; left: 74%; transform: translateX(-50%) rotate(-20deg) skewX(-18deg) scaleY(.78); transform-origin: center; display: flex; align-items: center; justify-content: center; gap: 7PX; white-space: nowrap; width: max-content; padding: 5PX 11PX; border: 1PX solid color-mix(in srgb, var(--status) 36%, transparent); border-radius: 1PX; background: color-mix(in srgb, var(--status) 9%, transparent); color: var(--status); text-shadow: 0 0 7PX color-mix(in srgb, var(--status) 40%, transparent); }
.status-symbol { display: grid; place-items: center; width: 12PX; height: 12PX; color: var(--status); font: bold 10PX Arial, sans-serif; }
.status-halo { position: absolute; z-index: -1; left: 8%; right: 4%; bottom: -4PX; height: 34%; border-radius: 50%; transform: skewX(-22deg); background: radial-gradient(ellipse, color-mix(in srgb, var(--status) 32%, transparent), transparent 70%); pointer-events: none; }
.running .original-machine { filter: drop-shadow(9PX 15PX 6PX #0008) drop-shadow(0 0 4PX #46e4c533); }
.running-flow { display: none; }
.running .running-flow { position: absolute; display: block; width: 35%; height: 3PX; bottom: 15%; left: 9%; transform: rotate(-22deg); border-radius: 50%; background: linear-gradient(90deg, transparent, #70ffe3, transparent); box-shadow: 0 0 8PX #46e4c599; animation: conveyor-flow 2.8s linear infinite; pointer-events: none; }
.fault .original-machine { filter: drop-shadow(9PX 15PX 6PX #0008) drop-shadow(0 0 7PX #ff504c99); }
.fault .status-halo { height: 45%; animation: fault-breathe 1.8s ease-in-out infinite; background: radial-gradient(ellipse, #ff504c66, #ff504c22 45%, transparent 72%); }
.fault .status-symbol { color: #ff8986; animation: fault-breathe 1.8s ease-in-out infinite; }
.fault .line-label-main { background: #ff504c16; text-shadow: 0 0 8PX #ff504c88; }
.stopped .original-machine { filter: grayscale(.9) brightness(.75) drop-shadow(9PX 15PX 6PX #0008); }
.stopped .status-halo { opacity: .3; }
@keyframes conveyor-flow { 0% { translate: 0 0; opacity: 0; } 20%, 75% { opacity: .85; } 100% { translate: 110% -40%; opacity: 0; } }
@keyframes fault-breathe { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .running .running-flow, .fault .status-halo, .fault .status-symbol { animation: none; } }
.line-label strong { font-size: 14PX; font-weight: 600; letter-spacing: 2PX; }
.line-label.selected .original-machine, .line-label:hover .original-machine, .line-label:focus-visible .original-machine { transform: translateY(-5PX); }
.line-label:focus-visible { outline: 1PX solid #9eeaff; border-radius: 4PX; }
.line-label.selected .line-label-main { border-color: var(--status); }
.line-faults { position: absolute; top: calc(100% + 8PX); left: 74%; transform: translateX(-50%); display: none; color: #ffb9a8; font-size: 9PX; background: #431f23ed; padding: 3PX 6PX; max-width: 95%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
.line-label.fault:hover .line-faults, .line-label.fault:focus-visible .line-faults { display: block; }
.line-label:hover, .line-label:focus-visible { z-index: 999 !important; }
.scene-footer { position: absolute; bottom: 10PX; left: 18PX; right: 18PX; display: flex; justify-content: space-between; align-items: center; color: #6c94ab; font-size: 10PX; gap: 10PX; }
.view-hint { display: flex; align-items: center; gap: 7PX; }
.view-hint i { display: block; width: 8PX; height: 8PX; border: 1PX solid #6d9aaf; transform: rotate(30deg) skewY(-15deg); }
.view-hint b { color: #3d617a; font-weight: normal; }
.floor-caption { color: #82a4b9; letter-spacing: 1PX; } .floor-caption b { margin: 0 6PX; font-weight: normal; color: #3d617a; }
.scene-unavailable { position: absolute; top: 14%; left: 0; right: 0; text-align: center; color: #94b2c7; font-size: 12PX; }
@media (max-width: 1400PX) { .scene-heading { gap: 8PX; left: 12PX; } .scene-subtitle { display: none; } h2 { font-size: 14PX; } .scene-legend { gap: 8PX; right: 12PX; } .line-label-main { padding: 4PX 8PX; gap: 5PX; } .line-label strong { font-size: 12PX; } }
</style>
