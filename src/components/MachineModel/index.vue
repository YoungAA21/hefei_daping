<template>
  <div ref="host" class="machine-model" role="button" tabindex="0" :aria-label="`${name}，${stateLabel}，拖动旋转模型，回车查看产线`" @pointerdown="rememberPointer" @click.stop="select" @keydown.enter.stop.prevent="$emit('select', $event)" @dblclick.stop="resetView">
    <span v-if="failure" class="model-message">三维视图暂不可用<br><small>点击查看产线状态</small></span>
    <span v-else-if="!ready" class="model-message">模型加载中…</span>
    <span v-else class="model-hint">拖动旋转 · 双击复位</span>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadPackagingModel } from './sharedModel';
const props=defineProps({ name:String, status:{type:String,default:'missing'} });
const emit=defineEmits(['select']);
const host=ref(null),ready=ref(false),failure=ref(false);
const stateLabel=computed(()=>({normal:'运行中',fault:'检测异常',missing:'未接入'}[props.status]));
let renderer,scene,camera,controls,observer,model,frame=0,disposed=false,startX=0,startY=0,dragged=false;
const materials=[], vertices=[]; let radius=6,center=new THREE.Vector3(), bounds=new THREE.Box3();
function rememberPointer(e){startX=e.clientX;startY=e.clientY;dragged=false;}
function trackPointer(e){if(e.buttons && Math.hypot(e.clientX-startX,e.clientY-startY)>5)dragged=true;}
function select(e){if(!dragged && Math.hypot(e.clientX-startX,e.clientY-startY)<6)emit('select',e);}
function render(){if(disposed||!renderer||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!disposed)renderer.render(scene,camera);});}
function resize(){if(!renderer||!host.value)return;const w=host.value.clientWidth,h=host.value.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();resetView();}
function resetView(){
 if(!camera||!controls)return;
 const direction=new THREE.Vector3(.45,.55,1.65).normalize();
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
 const up=new THREE.Vector3().crossVectors(direction,right).normalize();
 if(vertices.length){
  bounds.getCenter(center);
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const vertex of vertices){const offset=vertex.clone().sub(center),x=offset.dot(right),y=offset.dot(up);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  center.addScaledVector(right,(minX+maxX)/2).addScaledVector(up,(minY+maxY)/2);
 }
 const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;
 let distance=radius*2;
 if(!bounds.isEmpty()){
  distance=0;
  for(const vertex of vertices){
   const delta=vertex.clone().sub(center),depth=delta.dot(direction);
   distance=Math.max(distance,depth+Math.abs(delta.dot(right))/tanH,depth+Math.abs(delta.dot(up))/tanV);
  }
 }
 camera.position.copy(center).addScaledVector(direction,distance*1.025);controls.target.copy(center);controls.update();render();
}
function applyStatus(){for(const material of materials){if(material.name==='Status indicator'){const color={normal:0x50e1ec,fault:0xff604f,missing:0x72868e}[props.status];material.color.setHex(color);material.emissive.setHex(color);material.emissiveIntensity=props.status==='missing'?.08:.6;}if(material.name==='Painted cabinet'){material.color.setHex(props.status==='fault'?0xc58e88:props.status==='missing'?0x87969e:0xc8e1eb);}}render();}
function contextLost(e){e.preventDefault();failure.value=true;}
function contextRestored(){failure.value=false;render();}
onMounted(async()=>{
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
  renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);host.value.prepend(renderer.domElement);host.value.addEventListener('pointermove',trackPointer);
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(30,1,.1,150);
  scene.add(new THREE.HemisphereLight(0xe6f8ff,0x253643,2.5));
  const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-5,10,9);scene.add(key);
  const rim=new THREE.DirectionalLight(0x7aceff,1.8);rim.position.set(6,6,-6);scene.add(rim);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableZoom=false;controls.enablePan=false;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.48;controls.rotateSpeed=.65;controls.addEventListener('change',render);
  observer=new ResizeObserver(resize);observer.observe(host.value);
  const source=await loadPackagingModel();if(disposed)return;
  model=source.clone(true);model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();materials.push(o.material);}});scene.add(model);
  model.updateMatrixWorld(true);
  model.traverse(o=>{if(o.isMesh){const positions=o.geometry.attributes.position;for(let i=0;i<positions.count;i++)vertices.push(new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld));}});
  bounds.setFromObject(model);const sphere=bounds.getBoundingSphere(new THREE.Sphere());center.copy(sphere.center);radius=sphere.radius;
  applyStatus();ready.value=true;resize();
 }catch(error){if(!disposed){failure.value=true;console.error('3D model initialization failed',error);}}
});
watch(()=>props.status,applyStatus);
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();host.value?.removeEventListener('pointermove',trackPointer);materials.forEach(m=>m.dispose());if(renderer){renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}});
</script>
<style scoped>
.machine-model{position:relative;width:340PX;height:170PX;cursor:grab;touch-action:none;outline-offset:3px;}
.machine-model:active{cursor:grabbing;}
.machine-model:focus-visible{outline:1PX solid #68e7ed;border-radius:6PX;}
.machine-model :deep(canvas){display:block;width:100%;height:100%;}
.model-hint{position:absolute;bottom:1PX;left:0;right:0;text-align:center;pointer-events:none;font-size:9PX;color:#c4e9ef;opacity:0;transition:opacity .2s;}
.machine-model:hover .model-hint,.machine-model:focus-visible .model-hint{opacity:.8;}
.model-message{position:absolute;inset:0;display:grid;place-content:center;text-align:center;color:#9bbacb;font-size:12PX;line-height:1.8;}
</style>
