<template>
  <div>
    <div class="ws-heading">
      <div>
        <span class="ws-eyebrow">{{
          base ? "FOUNDATION DATASETS" : "DEFECT DATA COLLECTION"
        }}</span>
        <h1>{{ base ? "基础缺陷集" : "缺陷数据采集" }}</h1>
        <p>
          {{
            base
              ? "沉淀高质量样本，为训练与验证提供可靠基础"
              : "汇聚产线缺陷样本，让每一次发现推动模型进化"
          }}
        </p>
      </div>
      <button v-if="!base" class="primary" @click="openCreate">
        ＋ 创建数据集
      </button>
    </div>
    <div class="ws-summary">
      <article class="ws-stat">
        <small>{{ base ? "基础集数量" : "数据集总量" }}</small
        ><strong>{{ loading ? "—" : total }}</strong
        ><span>当前筛选条件</span><em>▦</em>
      </article>
      <article class="ws-stat">
        <small>当前页图片</small><strong>{{ imageCount }}</strong
        ><span>{{ base ? "仅统计返回了图片数的基础集" : "真实样本数量" }}</span
        ><em>▧</em>
      </article>
      <article class="ws-stat">
        <small>相机覆盖</small
        ><strong>{{ new Set(items.map((i) => i.camera)).size }}</strong
        ><span>当前页相机数量</span><em>◎</em>
      </article>
      <article class="ws-stat">
        <small>最近同步</small
        ><strong style="font-size: 24px">{{ updated || "—" }}</strong
        ><span>数据更新时刻</span><em>↻</em>
      </article>
    </div>
    <form class="ws-filters" @submit.prevent="search">
      <label
        >品牌<input
          v-model.trim="filters.brand"
          list="dataset-brands"
          required
        /><datalist id="dataset-brands">
          <option v-for="brand in brands" :key="brand">{{ brand }}</option>
        </datalist></label
      ><label
        >检测类型<select v-model="filters.type">
          <option v-for="type in types" :key="type">{{ type }}</option>
        </select></label
      ><label
        >相机<select v-model="filters.camera">
          <option>全部</option>
          <option v-for="camera in cameras" :key="camera">{{ camera }}</option>
        </select></label
      ><label v-if="base"
        >用途<select v-model="filters.foldertype">
          <option value="train">缺陷训练</option>
          <option value="vali">缺陷验证</option>
        </select></label
      >
      <div class="spacer"></div>
      <button class="primary" :disabled="loading">查询</button>
    </form>
    <div v-if="base" class="ws-note">
      基础集支持图片检视与标注。基础集合并服务尚未开放，待服务端补齐后启用。
    </div>
    <div class="ws-columns">
      <section class="ws-panel">
        <div class="ws-panel-heading">
          <h3>{{ base ? "基础样本库" : "采集数据集" }}</h3>
          <small>DATA ASSETS / {{ items.length }} 个</small>
        </div>
        <ResourceState
          :loading="loading"
          :error="error"
          :empty="!items.length"
          @retry="load"
        />
        <div v-if="!loading && !error" class="ws-card-grid">
          <article
            v-for="(item, index) in items"
            :key="item.id"
            class="ws-dataset-card"
            :style="{ animationDelay: `${(index % 6) * 45}ms` }"
          >
            <div class="dataset-card-top">
              <span class="dataset-symbol">▧</span
              ><span
                class="ws-badge"
                :class="{ gold: !base && item.issub?.includes('未') }"
                >{{
                  base
                    ? filters.foldertype === "train"
                      ? "训练基础集"
                      : "验证基础集"
                    : item.issub || "待处理"
                }}</span
              >
            </div>
            <h3>{{ item.name }}</h3>
            <p class="card-meta">{{ item.brand }} · {{ item.type }}</p>
            <div class="dataset-count">
              <strong>{{ item.imageCount ?? "—" }}</strong
              ><span>张图片</span
              ><span style="margin-left: auto">{{ item.camera }}</span>
            </div>
            <small>{{ timeText(item.updateTime || item.createtime) }}</small>
            <div class="card-actions">
              <button class="primary" @click="openDataset(item)">
                查看与标注 ↗</button
              ><button
                v-if="!base"
                class="danger"
                @click="removeItem(item)"
                :disabled="busy"
              >
                删除
              </button>
            </div>
          </article>
        </div>
        <Pager
          :total="total"
          :page="page"
          :size="size"
          :disabled="loading"
          @change="changePage"
        />
      </section>
      <aside>
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>相机分布</h3>
            <small>当前页</small>
          </div>
          <InsightChart
            :rows="countBy(items, 'camera')"
            kind="donut"
            title="相机分布"
          />
        </section>
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>样本规模</h3>
            <small>当前页前 6 项</small>
          </div>
          <InsightChart
            :rows="
              items
                .slice(0, 6)
                .filter((i) => i.imageCount != null)
                .map((i) => ({ name: i.name, value: Number(i.imageCount) }))
            "
            title="样本规模"
          />
        </section>
      </aside>
    </div>
    <WorkspaceModal
      v-if="creating"
      title="创建采集数据集"
      :busy="busy"
      @close="creating = false"
      ><form class="ws-form" @submit.prevent="create">
        <div class="ws-form-grid">
          <label
            >数据集名称<input
              v-model.trim="draft.name"
              required
              maxlength="100"
              pattern="[^\\/]+" /></label
          ><label
            >品牌<input
              v-model.trim="draft.brand"
              required
              :list="'dataset-brands'" /></label
          ><label
            >检测类型<select v-model="draft.type">
              <option v-for="type in types" :key="type">{{ type }}</option>
            </select></label
          ><label
            >相机<select v-model="draft.camera">
              <option v-for="camera in cameras" :key="camera">
                {{ camera }}
              </option>
            </select></label
          >
        </div>
        <p class="ws-error-text" v-if="actionError">{{ actionError }}</p>
        <div class="ws-form-footer">
          <button type="button" @click="creating = false" :disabled="busy">
            取消</button
          ><button class="primary" :disabled="busy">
            {{ busy ? "正在创建…" : "创建数据集" }}
          </button>
        </div>
      </form></WorkspaceModal
    >
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  api,
  post,
  userId,
  pageData,
  types,
  cameras,
  countBy,
  timeText,
} from "./api";
import { useResource } from "./useResource";
import InsightChart from "./components/InsightChart.vue";
import ResourceState from "./components/ResourceState.vue";
import Pager from "./components/Pager.vue";
import WorkspaceModal from "./components/WorkspaceModal.vue";
const route = useRoute(),
  router = useRouter(),
  base = route.name === "workspace-basesets";
const { loading, error, updated, run } = useResource();
const items = ref([]),
  total = ref(0),
  page = ref(1),
  size = 12,
  brands = ref(["黄山(金皖烟)", "黄山(新制皖烟)"]),
  creating = ref(false),
  busy = ref(false),
  actionError = ref("");
const filters = reactive({
    brand: "黄山(金皖烟)",
    type: "商标纸",
    camera: "全部",
    foldertype: "train",
  }),
  draft = reactive({});
let applied = { ...filters };
const imageCount = computed(() =>
  items.value.reduce((n, i) => n + (Number(i.imageCount) || 0), 0),
);
function load() {
  const f = { ...applied },
    p = page.value;
  items.value = [];
  return run(
    async () => {
      const data = base
        ? await api(
            `/api/BaseSet/allbasesets/${encodeURIComponent(f.brand)}/${f.foldertype}`,
          )
        : await api("/api/BrandCamera/user-datasets", {
            params: {
              UserId: userId(),
              Brand: f.brand,
              Type: f.type,
              Camera: f.camera,
              page: p,
              pageSize: size,
            },
          });
      return pageData(
        data,
        p,
        size,
        (i) =>
          (!f.type || i.type === f.type) &&
          (f.camera === "全部" || i.camera === f.camera),
      );
    },
    (data) => {
      items.value = data.items;
      total.value = data.total;
    },
  );
}
function search() {
  applied = { ...filters };
  page.value = 1;
  load();
}
function changePage(value) {
  page.value = value;
  load();
}
function openCreate() {
  Object.assign(draft, {
    name: `${filters.camera === "全部" ? "camera0" : filters.camera}_${Date.now()}`,
    brand: filters.brand,
    type: filters.type,
    camera: filters.camera === "全部" ? "camera0" : filters.camera,
  });
  actionError.value = "";
  creating.value = true;
}
async function create() {
  if (busy.value) return;
  busy.value = true;
  actionError.value = "";
  try {
    await post("/api/BrandCamera/create-datasets", {
      ...draft,
      userId: userId(),
      imageCount: 0,
      updateTime: new Date().toISOString(),
      lastPicTime: new Date().toISOString(),
    });
    creating.value = false;
    Object.assign(filters, {
      brand: draft.brand,
      type: draft.type,
      camera: draft.camera,
    });
    search();
    ElMessage.success("数据集已创建");
  } catch (e) {
    actionError.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function removeItem(item) {
  try {
    await ElMessageBox.confirm(
      `删除“${item.name}”及其中所有图片？删除后无法恢复。`,
      "删除数据集",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    await post("/api/BrandCamera/delete-dataset", { datasetId: item.id });
    if (items.value.length === 1 && page.value > 1) page.value--;
    await load();
    ElMessage.success("数据集已删除");
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
function openDataset(item) {
  router.push({
    name: "workspace-images",
    params: { kind: base ? "base" : "dataset", id: item.id },
    query: {
      name: item.name,
      brand: item.brand,
      type: item.type,
      camera: item.camera,
    },
  });
}
onMounted(() => {
  load();
  api("/api/Brand/brandinfo")
    .then((data) => {
      if (Array.isArray(data))
        brands.value = [
          ...new Set([
            ...brands.value,
            ...data.map((i) => i.brand).filter(Boolean),
          ]),
        ];
    })
    .catch(() => {});
});
</script>
