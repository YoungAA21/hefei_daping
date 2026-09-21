<template>
  <Teleport to="body"
    ><div class="ws-modal-mask" @click.self="close">
      <section
        ref="dialog"
        class="ws-modal workspace-ui"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        @keydown.esc.stop="close"
        @keydown.tab="trap"
      >
        <header>
          <div>
            <small>AI CONTROL · WORKSPACE</small>
            <h2>{{ title }}</h2>
          </div>
          <button aria-label="关闭" :disabled="busy" @click="close">×</button>
        </header>
        <div class="ws-modal-body"><slot /></div>
      </section></div
  ></Teleport>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
const props = defineProps({ title: String, busy: Boolean });
const emit = defineEmits(["close"]);
const dialog = ref();
let previous;
function close() {
  if (!props.busy) emit("close");
}
function trap(e) {
  const list = [
    ...dialog.value.querySelectorAll(
      'button,input,select,textarea,a[href],[tabindex="0"]',
    ),
  ].filter((n) => !n.disabled && n.getClientRects().length);
  if (!list.length) {
    e.preventDefault();
    return;
  }
  const first = list[0],
    last = list.at(-1);
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === dialog.value)
  ) {
    e.preventDefault();
    last.focus();
  } else if (
    !e.shiftKey &&
    (document.activeElement === last || document.activeElement === dialog.value)
  ) {
    e.preventDefault();
    first.focus();
  }
}
onMounted(() => {
  previous = document.activeElement;
  dialog.value.focus();
});
onBeforeUnmount(() => previous?.focus());
</script>
