<template>
  <div class="embedded-detail"><Detail /></div>
</template>

<script setup>
import Detail from "../view/detail.vue";
</script>

<style scoped>
.embedded-detail {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.embedded-detail :deep(.container) {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  grid-template-rows: 8% minmax(0, 62%) 30% !important;
  overflow: hidden;
}

.embedded-detail :deep(.top) {
  height: 100%;
}

.embedded-detail :deep(.home),
.embedded-detail :deep(.data) {
  min-height: 0;
}
</style>
