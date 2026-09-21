<template>
  <div class="embedded-production"><Home /></div>
</template>
<script setup>
import Home from '../view/home.vue';
</script>
<style scoped>
.embedded-production{height:100%;min-height:0;position:relative;overflow:hidden;margin:0;padding:0}
.embedded-production :deep(.container){width:100%;height:100% !important;min-height:0 !important;overflow:hidden}
.embedded-production :deep(.top){height:7%}
.embedded-production :deep(.home){height:68%}
.embedded-production :deep(.data){height:25%;padding:0 12px 10px}
@media(max-width:1250px){.embedded-production :deep(.machine-grid){transform:translateY(-2vh) scale(.82)}}
</style>
