<template>
  <div class="image-surface" :class="{ enlarged }">
    <div v-if="!src || failed" class="image-message"><span class="image-symbol">◇</span><strong>{{ failed ? '图片加载失败' : emptyText }}</strong><span>{{ failed ? '请检查图片文件或服务连接' : emptyHint }}</span><button v-if="failed" @click="retry">重新加载</button></div>
    <template v-else>
      <div v-if="loading" class="image-message"><span class="loader"></span><strong>正在加载图片</strong></div>
      <div class="image-scroll" :style="{ opacity: loading ? 0 : 1 }">
        <div class="image-size" :style="{ width: `${scale * 100}%`, height: `${scale * 100}%` }"><img :key="revision" :src="src" :alt="name" @load="loaded" @error="failed = true; loading = false" /></div>
      </div>
      <div v-if="!loading" class="image-tools"><button aria-label="缩小图片" :disabled="scale <= 1" @click="scale = Math.max(1, scale - .5)">−</button><span>{{ Math.round(scale * 100) }}%</span><button aria-label="放大图片" :disabled="scale >= 4" @click="scale = Math.min(4, scale + .5)">＋</button><button @click="scale = 1">适应窗口</button><span class="dimensions">{{ dimensions }}</span></div>
    </template>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({ src: String, name: String, enlarged: Boolean, emptyText: { type: String, default: '等待选择图片' }, emptyHint: { type: String, default: '从右侧列表选择一条缺陷记录' } });
const loading = ref(true), failed = ref(false), scale = ref(1), revision = ref(0), dimensions = ref('');
watch(() => props.src, () => { loading.value = true; failed.value = false; scale.value = 1; dimensions.value = ''; });
function loaded(event) { loading.value = false; dimensions.value = `${event.target.naturalWidth} × ${event.target.naturalHeight}`; }
function retry() { failed.value = false; loading.value = true; revision.value++; }
</script>
<style scoped>
.image-surface{position:relative;flex:1;min-height:0;overflow:hidden;background:radial-gradient(ellipse at center,#17314955,transparent 70%),#020913;border:1PX solid #65d5ff20;border-radius:5PX}
.image-surface::before{content:'';position:absolute;inset:10PX;border:1PX solid #65d5ff18;pointer-events:none;z-index:1;clip-path:polygon(0 0,30PX 0,30PX 2PX,2PX 2PX,2PX 30PX,0 30PX,0 0,100% 0,100% 30PX,calc(100% - 2PX) 30PX,calc(100% - 2PX) 2PX,calc(100% - 30PX) 2PX,calc(100% - 30PX) 0,100% 0,100% 100%,0 100%)}
.image-scroll{position:absolute;inset:22PX 16PX 54PX;overflow:auto;scrollbar-width:thin;scrollbar-color:#366a87 #071625;transition:opacity .3s}
.image-size{display:flex;align-items:center;justify-content:center;min-width:100%;min-height:100%}
img{width:100%;height:100%;object-fit:contain;display:block}
.image-message{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12PX;font-size:11PX;color:#7697af}.image-message strong{color:#bddcea;font-weight:400;font-size:13PX}.image-symbol{font-size:42PX;color:#487691}
.image-tools{position:absolute;bottom:12PX;left:16PX;right:16PX;display:flex;align-items:center;gap:10PX;color:#8eacbd;font-size:11PX}.dimensions{margin-left:auto;font:10PX monospace;color:#557990}
button{border:1PX solid #65d5ff30;background:#0c263c;color:#bdefff;border-radius:3PX;padding:5PX 9PX;cursor:pointer;font-size:11PX}button:hover{border-color:#65e6ff}button:disabled{opacity:.3;cursor:default}.loader{height:26PX;width:26PX;border:2PX solid #65d5ff22;border-top-color:#65e6ff;border-radius:50%;animation:load-spin 1s linear infinite}@keyframes load-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.loader{animation:none}.image-scroll{transition:none}}
</style>
