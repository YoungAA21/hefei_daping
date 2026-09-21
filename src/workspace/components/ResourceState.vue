<template>
  <div v-if="loading" class="resource-state loading" role="status">
    <i></i>正在同步数据…
  </div>
  <div v-else-if="error" class="resource-state error" role="alert">
    <span>{{ error }}</span
    ><button @click="$emit('retry')">重新加载</button>
  </div>
  <div v-else-if="empty" class="resource-state empty">
    <span class="empty-symbol">◇</span><strong>{{ text }}</strong
    ><span>调整筛选条件，或添加新的记录</span>
  </div>
</template>
<script setup>
defineProps({
  loading: Boolean,
  error: String,
  empty: Boolean,
  text: { default: "当前条件下暂无数据" },
});
defineEmits(["retry"]);
</script>
