<template>
  <div ref="viewport" class="embedded-production">
    <div class="production-frame" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', transform: `scale(${scale})` }"><Home /></div>
    <div :style="{ height: canvasHeight * scale + 'px' }" aria-hidden="true"></div>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Home from '../view/home.vue';
const viewport = ref(null), canvasWidth = ref(1440), canvasHeight = ref(900), scale = ref(1);
let observer;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (!width || !height) return;
    scale.value = Math.min(1, width / 1440, height / 900);
    canvasWidth.value = width / scale.value;
    canvasHeight.value = height / scale.value;
  });
  observer.observe(viewport.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>
<style scoped>
.embedded-production { position:relative; height:100%; min-height:0; overflow:auto; }
.production-frame { position:absolute; top:0; left:0; transform-origin:top left; container-type:size; }
.embedded-production :deep(.container) { width:100%; height:100%; }
.embedded-production :deep(.top) { height:8%; }
.embedded-production :deep(.home) { height:60%; }
/* Separate depth lanes: actual canvas sizes change, labels and alerts remain legible. */
.embedded-production :deep(.machine-grid) { width:96%; height:100%; padding:16PX 0 12PX; box-sizing:border-box; transform:none; gap:12PX; isolation:isolate; }
.embedded-production :deep(.machine-row) { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:24PX; width:86%; min-height:0; flex:1; transform-style:flat; margin:0; }
.embedded-production :deep(.machine-row:nth-child(1)) { width:70%; flex:.78; z-index:1; transform:translateX(15%); }
.embedded-production :deep(.machine-row:nth-child(2)) { width:85%; flex:1; z-index:2; transform:translateX(4%); }
.embedded-production :deep(.machine-row:nth-child(3)) { width:96%; flex:1.24; z-index:3; transform:translateX(-2%); }
/* Reserve the diagonal offset inside each lane, keeping the next lane and charts clear. */
.embedded-production :deep(.machine-item[class*="pos-"]) { position:relative; align-self:start; width:100%; height:calc(100% - 28PX); max-width:none; min-width:0; min-height:0; transform:none; opacity:1; }
.embedded-production :deep(.machine-item:nth-child(2)) { transform:translateY(14PX); }
.embedded-production :deep(.machine-item:nth-child(3)) { transform:translateY(28PX); }
.embedded-production :deep(.machine-content) { width:100%; height:100%; min-height:0; gap:0; transform-style:flat; }
.embedded-production :deep(.machine-content::before) { display:none; }
.embedded-production :deep(.machine-img-status) { position:relative; display:grid; grid-template-columns:minmax(0,1fr) 96PX; align-items:center; width:100%; flex:1; min-height:0; gap:4PX; }
.embedded-production :deep(.machine-img-container) { width:100%; height:100%; min-width:0; min-height:0; padding:0; background:none; overflow:hidden; }
.embedded-production :deep(.machine-model) { width:100%; height:100%; }
.embedded-production :deep(.machine-name) { min-width:120PX; margin:0; padding:3PX 14PX; font-size:14PX; flex-shrink:0; }
.embedded-production :deep(.machine-name em) { font-size:9PX; margin-top:0; }
.embedded-production :deep(.fault-points) { position:relative; right:auto; top:auto; grid-column:2; width:96PX; min-width:0; max-width:96PX; max-height:100%; padding:5PX 6PX; font-size:10PX; pointer-events:none; overflow-wrap:anywhere; animation:none; }
.embedded-production :deep(.machine-row:first-child .machine-img-container) { filter:brightness(.85) saturate(.85); }
.embedded-production :deep(.machine-row:last-child .machine-img-container) { filter:drop-shadow(0 8PX 6PX #0005); }
.embedded-production :deep(.fault-title) { font-size:10PX; padding-bottom:3PX; margin-bottom:3PX; }
.embedded-production :deep(.fault-point) { padding-block:1PX; }
.embedded-production :deep(.data) { height:32%; padding:0 12px 12px; }
.embedded-production :deep(.pageTop) { height:100%; }
.embedded-production :deep(.logout-btn) { top:24px; }
</style>
