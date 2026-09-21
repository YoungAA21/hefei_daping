<template>
  <footer class="ws-pagination">
    <span>共 {{ total }} 条 · 第 {{ page }} / {{ pages }} 页</span>
    <div>
      <button
        :disabled="page <= 1 || disabled"
        @click="$emit('change', page - 1)"
      >
        ← 上一页</button
      ><button
        :disabled="page >= pages || disabled"
        @click="$emit('change', page + 1)"
      >
        下一页 →
      </button>
    </div>
  </footer>
</template>
<script setup>
import { computed } from "vue";
const props = defineProps({
  total: { default: 0 },
  page: { default: 1 },
  size: { default: 20 },
  disabled: Boolean,
});
defineEmits(["change"]);
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)));
</script>
