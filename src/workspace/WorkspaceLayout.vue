<template>
  <div class="workspace-ui workspace-shell" :class="{ collapsed, 'production-shell': $route.name === 'workspace-production' }">
    <aside class="ws-sidebar">
      <RouterLink class="ws-brand" to="/workspace/datasets"
        ><span class="brand-symbol">AI</span>
        <div>
          <strong>智能检测中台</strong><small>INTELLIGENT VISION</small>
        </div></RouterLink
      ><button
        class="collapse-button"
        @click="collapsed = !collapsed"
        :aria-label="collapsed ? '展开导航' : '收起导航'"
      >
        {{ collapsed ? "→" : "←" }}
      </button>
      <nav aria-label="中台导航">
        <RouterLink to="/workspace/production" class="ws-nav"
          ><span>◈</span><b>产线状态</b></RouterLink
        >
        <p>模型迭代</p>
        <RouterLink
          v-for="item in menu"
          :key="item.path"
          :to="'/workspace/' + item.path"
          class="ws-nav"
          ><span>{{ item.icon }}</span
          ><b>{{ item.name }}</b
          ><em>↗</em></RouterLink
        >
        <p>质量洞察</p>
        <RouterLink to="/workspace/quality" class="ws-nav"
          ><span>▥</span><b>质量分析</b><em>↗</em></RouterLink
        >
      </nav>
      <div class="sidebar-bottom">
        <span class="orbit-mark">◎</span><strong>从缺陷发现到模型迭代</strong
        ><small>采集 · 标注 · 训练 · 验证</small>
      </div>
    </aside>
    <div class="ws-main">
      <header class="ws-topbar">
        <div>
          <span class="breadcrumb">AI 中台 /</span>
          {{ $route.meta.title || "工作台" }}
        </div>
        <div class="topbar-right">
          <time>{{ clock }}</time
          ><span class="user-chip">{{
            user.username || user.userName || "当前用户"
          }}</span
          ><RouterLink to="/workspace/production">产线状态</RouterLink
          ><button @click="signOut">退出</button>
        </div>
      </header>
      <main
        class="ws-content"
        :class="{
          'screen-content':
            $route.name === 'workspace-production' || $route.name === 'detail',
        }"
      >
        <RouterView v-slot="{ Component }"
          ><Transition name="ws-page" mode="out-in"
            ><component :is="Component" :key="$route.path" /></Transition
        ></RouterView>
      </main>
      <footer class="ws-foot">
        <span>VISION INTELLIGENCE / 合肥</span><span>AI 检测 · 全流程协同</span>
      </footer>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { currentUser, post } from "./api";
import "./workspace.scss";
const menu = [
  { path: "datasets", name: "缺陷数据采集", icon: "▧" },
  { path: "basesets", name: "基础缺陷集", icon: "▦" },
  { path: "models", name: "模型管理", icon: "⬡" },
  { path: "defects", name: "标准缺陷", icon: "◇" },
  { path: "labels", name: "打标缺陷", icon: "⌗" },
];
const collapsed = ref(false),
  clock = ref(new Date().toLocaleString("zh-CN", { hour12: false })),
  user = currentUser(),
  router = useRouter();
const timer = setInterval(
  () => (clock.value = new Date().toLocaleString("zh-CN", { hour12: false })),
  1000,
);
onMounted(() => document.body.classList.add("workspace-active"));
onBeforeUnmount(() => {
  clearInterval(timer);
  document.body.classList.remove("workspace-active");
});
async function signOut() {
  try {
    await post("/api/Auth/logout", "");
  } catch {}
  for (const key of ["token", "access_token", "user_info"])
    localStorage.removeItem(key);
  router.replace("/login");
}
</script>
