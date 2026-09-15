<template>
  <div class="image-comparison" :class="{ enlarged }">
    <section aria-label="原图"><header><span>原图</span><em>ORIGINAL</em></header><NgImageSurface :src="image?.imageUrl" :name="`${image?.name || ''} 原图`" :empty-text="image ? '暂无原图' : '等待选择图片'" :empty-hint="image ? '接口未返回原图地址' : '从右侧列表选择一条缺陷记录'" /></section>
    <section aria-label="检测图"><header><span>检测图</span><em>DETECTED</em></header><NgImageSurface :src="image?.detectedImageUrl" :name="`${image?.name || ''} 检测图`" :empty-text="image ? '暂无检测图' : '等待选择图片'" :empty-hint="image ? '该记录暂未返回检测图地址' : '从右侧列表选择一条缺陷记录'" /></section>
  </div>
</template>
<script setup>
import NgImageSurface from './NgImageSurface.vue';
defineProps({ image: Object, enlarged: Boolean });
</script>
<style scoped>
.image-comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10PX;flex:1;min-height:0}
section{display:flex;flex-direction:column;min-height:0;min-width:0}
header{display:flex;justify-content:space-between;align-items:center;min-height:28PX;color:#bdefff;font-size:11PX}
header em{color:#557f96;font-size:8PX;font-style:normal;letter-spacing:1PX}
section:nth-child(2) header{color:#ffcc66}
.image-comparison:not(.enlarged) :deep(.dimensions){display:none}
.image-comparison:not(.enlarged) :deep(.image-tools){left:8PX;right:8PX;gap:5PX;flex-wrap:wrap}
.image-comparison:not(.enlarged) :deep(.image-tools button){padding:4PX 6PX}
@media(max-width:1400px){.image-comparison:not(.enlarged){grid-template-columns:1fr;grid-template-rows:repeat(2,minmax(0,1fr));gap:6PX}}
</style>
