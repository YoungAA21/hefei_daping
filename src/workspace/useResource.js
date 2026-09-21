import { ref, onBeforeUnmount } from "vue";
export function useResource() {
  const loading = ref(false),
    error = ref(""),
    updated = ref("");
  let version = 0;
  async function run(task, apply) {
    const current = ++version;
    loading.value = true;
    error.value = "";
    try {
      const result = await task();
      if (current === version) {
        apply(result);
        updated.value = new Date().toLocaleTimeString("zh-CN");
      }
      return true;
    } catch (e) {
      if (current === version) error.value = e.message;
      return false;
    } finally {
      if (current === version) loading.value = false;
    }
  }
  onBeforeUnmount(() => {
    version++;
  });
  return { loading, error, updated, run };
}
