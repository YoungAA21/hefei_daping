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
        >品牌<select v-model="filters.brand" required>
          <option v-for="brand in brands" :key="brand" :value="brand">
            {{ brand }}
          </option>
        </select></label
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
              <strong>{{ imageTotal(item) ?? "—" }}</strong
              ><span>张图片</span
              ><span style="margin-left: auto">{{ item.camera }}</span>
            </div>
            <small>{{ timeText(item.updateTime || item.createtime) }}</small>
            <div class="card-actions">
              <button class="primary" @click="base ? openDataset(item) : openAssist(item)">
                {{ base ? "查看与标注 ↗" : "创建辅助打标" }}</button
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
                .filter((i) => imageTotal(i) != null)
                .map((i) => ({ name: i.name, value: Number(imageTotal(i)) }))
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
              :value="draft.name"
              readonly
              aria-readonly="true"
              title="数据集名称由相机和当前时间自动生成" /></label
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
    <Transition name="assist-modal">
      <div
        v-if="assistingItem"
        class="assist-overlay"
        @click.self="closeAssist"
      >
        <section class="assist-dialog" role="dialog" aria-modal="true">
          <div class="assist-dialog-grid"></div>
          <div class="assist-dialog-orb orb-one"></div>
          <div class="assist-dialog-orb orb-two"></div>
          <header class="assist-header">
            <div class="assist-title-mark">✦</div>
            <div>
              <span class="assist-kicker">SUB CAMERA MARKING / CONFIGURATION</span>
              <h2>创建辅助打标</h2>
              <p>为当前数据集配置辅助打标任务</p>
            </div>
            <button class="assist-close" type="button" @click="closeAssist">×</button>
          </header>
          <div class="assist-steps" aria-hidden="true">
            <span class="active"><i>01</i>数据集</span><b></b><span><i>02</i>模型</span><b></b><span><i>03</i>执行</span>
          </div>
          <div class="assist-fields">
            <div class="assist-field">
              <span>品牌</span>
              <strong>{{ assistingItem.brand || filters.brand }}</strong>
            </div>
            <div class="assist-field">
              <span>种类</span>
              <strong>{{ assistingItem.type || filters.type }}</strong>
            </div>
            <div class="assist-field">
              <span>视角</span>
              <strong class="assist-code">CAM / {{ assistingItem.camera }}</strong>
            </div>
            <div class="assist-field assist-field-wide">
              <span>模型选择</span>
              <div class="assist-control-row">
                <select v-model="assistModel" disabled>
                  <option value="">模型接口接入后可选择</option>
                </select>
                <button class="assist-query" type="button" disabled>查询</button>
              </div>
            </div>
            <div class="assist-field assist-field-wide">
              <span>缺陷集合</span>
              <div class="assist-dataset-pill">
                <span class="dataset-pill-icon">▧</span>
                <strong>{{ assistingItem.name }}</strong>
                <small>{{ assistingItem.imageCount ?? 0 }} 张图片</small>
              </div>
            </div>
          </div>
          <footer class="assist-footer">
            <span class="assist-status"><i></i> 模型接口待接入，配置完成后即可创建任务</span>
            <button class="assist-submit" type="button" disabled>创建辅助打标</button>
          </footer>
        </section>
      </div>
    </Transition>
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
  actionError = ref(""),
  assistingItem = ref(null),
  assistModel = ref("");
const filters = reactive({
    brand: "黄山(金皖烟)",
    type: "商标纸",
    camera: "全部",
    foldertype: "train",
  }),
  draft = reactive({});
let applied = { ...filters };
const imageCount = computed(() =>
  items.value.reduce((n, i) => n + (Number(imageTotal(i)) || 0), 0),
);
function imageTotal(item) {
  const value =
    item?.imageCount ??
    item?.imagecount ??
    item?.imageNum ??
    item?.imageCountNum ??
    item?.count ??
    item?.totalCount;
  const count = value === undefined || value === null || value === "" ? null : Number(value);
  return Number.isFinite(count) ? count : null;
}
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
      const result = pageData(
        data,
        p,
        size,
        (i) =>
          (!f.type || i.type === f.type) &&
          (f.camera === "全部" || i.camera === f.camera),
      );
      if (base && result.items.length) {
        const enriched = await Promise.all(
          result.items.map(async (item) => {
            try {
              const pageSize = 100;
              let page = 1;
              let count = 0;
              while (page <= 100) {
                const imageData = await api("/api/BaseSet/basesetimages", {
                  params: { basesetid: item.id, page, pageSize },
                });
                const result = pageData(imageData, page, pageSize);
                count += result.items.length;
                if (result.items.length < pageSize) break;
                page += 1;
              }
              return { ...item, imageCount: count };
            } catch {
              return { ...item, imageCount: null };
            }
          }),
        );
        return { ...result, items: enriched };
      }
      return result;
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
  const camera = filters.camera === "全部" ? cameras[0] : filters.camera;
  Object.assign(draft, {
    name: makeDatasetName(camera),
    brand: filters.brand,
    type: filters.type,
    camera,
  });
  actionError.value = "";
  creating.value = true;
}
async function create() {
  if (busy.value) return;
  busy.value = true;
  actionError.value = "";
  try {
    if (!draft.camera || draft.camera === "全部") {
      throw new Error("创建数据集时必须选择具体相机，不能使用“全部”");
    }
    const now = new Date();
    await post("/api/BrandCamera/create-datasets", {
      userId: userId(),
      name: makeDatasetName(draft.camera, now),
      brand: draft.brand,
      type: draft.type,
      camera: draft.camera,
      imageCount: 0,
      updateTime: now.toISOString(),
      lastPicTime: now.toISOString(),
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
function makeDatasetName(camera, date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${camera}_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}${pad(date.getHours())}${pad(date.getMinutes())}${pad(
    date.getSeconds(),
  )}`;
}
async function removeItem(item) {
  try {
    await ElMessageBox.confirm(
      `删除“${item.name}”及其中所有图片？删除后无法恢复。`,
      "删除数据集",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消", confirmButtonClass: "danger-confirm" },
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
function openAssist(item) {
  assistingItem.value = item;
  assistModel.value = "";
}
function closeAssist() {
  if (!busy.value) assistingItem.value = null;
}
onMounted(() => {
  load();
});
</script>

<style scoped>
.assist-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 28px;
  background: rgba(2, 8, 20, 0.78);
  backdrop-filter: blur(14px) saturate(130%);
}
.assist-dialog {
  position: relative;
  width: min(720px, 100%);
  overflow: hidden;
  border: 1px solid rgba(83, 211, 255, 0.5);
  border-radius: 22px;
  padding: 30px 34px 26px;
  color: #e8f8ff;
  background: linear-gradient(145deg, rgba(9, 35, 62, .98), rgba(4, 16, 35, .98));
  box-shadow: 0 28px 90px rgba(0, 0, 0, .55), 0 0 60px rgba(37, 197, 255, .15), inset 0 1px rgba(255,255,255,.12);
}
.assist-dialog::before { content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; padding: 1px; background: linear-gradient(120deg, #43ddff, transparent 35%, transparent 68%, #f0c875); mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude; }
.assist-dialog-grid { position: absolute; inset: 0; opacity: .18; background-image: linear-gradient(rgba(75,190,232,.17) 1px, transparent 1px), linear-gradient(90deg, rgba(75,190,232,.17) 1px, transparent 1px); background-size: 30px 30px; mask-image: linear-gradient(to bottom, #000, transparent 80%); }
.assist-dialog-orb { position: absolute; width: 180px; height: 180px; border-radius: 50%; filter: blur(2px); opacity: .15; pointer-events: none; }
.orb-one { top: -90px; right: 40px; background: #18cfff; box-shadow: 0 0 70px 35px #18cfff; }
.orb-two { bottom: -120px; left: -40px; background: #e7ac46; box-shadow: 0 0 70px 25px #e7ac46; }
.assist-header, .assist-fields, .assist-footer, .assist-steps { position: relative; z-index: 1; }
.assist-header { display: flex; align-items: center; gap: 15px; }
.assist-title-mark { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid rgba(99,224,255,.8); border-radius: 12px; color: #65e5ff; font-size: 23px; box-shadow: 0 0 25px rgba(50,210,255,.3), inset 0 0 15px rgba(50,210,255,.15); animation: assist-pulse 2.4s ease-in-out infinite; }
.assist-kicker { color: #75d9f5; font-size: 10px; letter-spacing: .18em; }
.assist-header h2 { margin: 3px 0 2px; font-size: 25px; letter-spacing: .08em; }
.assist-header p { margin: 0; color: #8daabd; font-size: 12px; }
.assist-close { display: flex; align-items: center; justify-content: center; flex: 0 0 34px; margin-left: auto; width: 34px; height: 34px; padding: 0 0 2px; border: 1px solid rgba(149,191,211,.35); border-radius: 50%; color: #b9d4e1; background: rgba(8,30,50,.7); font-family: Arial, sans-serif; font-size: 23px; line-height: 1; cursor: pointer; transition: .25s; }
.assist-close:hover { color: #fff; border-color: #65e5ff; transform: rotate(90deg); }
.assist-steps { display: flex; align-items: center; gap: 11px; margin: 26px 0 22px; color: #617e91; font-size: 11px; letter-spacing: .06em; }
.assist-steps span { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.assist-steps i { display: grid; place-items: center; width: 24px; height: 24px; border: 1px solid currentColor; border-radius: 50%; font-style: normal; font-size: 10px; }
.assist-steps .active { color: #5ee4ff; }
.assist-steps b { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(71,207,244,.7), rgba(81,114,137,.3)); }
.assist-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.assist-field { min-height: 70px; padding: 13px 15px; border: 1px solid rgba(104,178,211,.25); border-radius: 12px; background: rgba(7, 28, 49, .7); box-shadow: inset 0 1px rgba(255,255,255,.04); animation: assist-rise .55s both; }
.assist-field:nth-child(2) { animation-delay: .06s; } .assist-field:nth-child(3) { animation-delay: .12s; } .assist-field:nth-child(4) { animation-delay: .18s; } .assist-field:nth-child(5) { animation-delay: .24s; }
.assist-field-wide { grid-column: 1 / -1; }
.assist-field > span { display: block; color: #86a9ba; font-size: 12px; margin-bottom: 8px; }
.assist-field strong { color: #f4fbff; font-size: 16px; letter-spacing: .03em; }
.assist-code { color: #62ddff !important; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 14px !important; }
.assist-control-row { display: flex; gap: 10px; }
.assist-control-row select { flex: 1; min-width: 0; }
.assist-control-row select, .assist-query { height: 40px; border: 1px solid rgba(83,198,235,.45); border-radius: 7px; color: #9bb8c8; background: rgba(7, 24, 43, .9); padding: 0 12px; }
.assist-query { width: 82px; color: #16324a; background: #38bee5; font-weight: 700; opacity: .45; }
.assist-dataset-pill { display: flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 12px; border: 1px solid rgba(87,202,234,.35); border-radius: 7px; background: rgba(5, 21, 39, .72); }
.dataset-pill-icon { color: #5ddfff; font-size: 19px; } .assist-dataset-pill strong { flex: 1; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .assist-dataset-pill small { color: #7c9eaf; }
.assist-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(112,179,207,.18); }
.assist-status { color: #81a6b5; font-size: 11px; } .assist-status i { display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: #efbd63; box-shadow: 0 0 10px #efbd63; }
.assist-submit { min-width: 150px; height: 42px; border: 0; border-radius: 7px; color: #062136; background: linear-gradient(100deg, #5bdfff, #35b5dd); font-weight: 700; opacity: .42; cursor: not-allowed; }
.assist-modal-enter-active, .assist-modal-leave-active { transition: opacity .25s ease; } .assist-modal-enter-active .assist-dialog, .assist-modal-leave-active .assist-dialog { transition: transform .32s ease, opacity .25s ease; } .assist-modal-enter-from, .assist-modal-leave-to { opacity: 0; } .assist-modal-enter-from .assist-dialog, .assist-modal-leave-to .assist-dialog { opacity: 0; transform: translateY(18px) scale(.96); }
@keyframes assist-rise { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: none; } }
@keyframes assist-pulse { 50% { box-shadow: 0 0 35px rgba(50,210,255,.5), inset 0 0 18px rgba(50,210,255,.25); } }
@media (max-width: 640px) { .assist-overlay { padding: 12px; } .assist-dialog { padding: 24px 18px 20px; } .assist-fields { grid-template-columns: 1fr; } .assist-field-wide { grid-column: auto; } .assist-footer { align-items: stretch; flex-direction: column; } .assist-submit { width: 100%; } }
.ws-card-grid { perspective: 900px; }
.ws-dataset-card { position: relative; overflow: hidden; border: 1px solid rgba(71, 192, 224, .28); background: linear-gradient(145deg, rgba(11, 43, 66, .94), rgba(5, 22, 39, .97)); box-shadow: inset 0 1px rgba(255,255,255,.06), 0 12px 28px rgba(0,0,0,.16); transform: translateZ(0); transition: transform .3s ease, border-color .3s ease, box-shadow .3s ease; }
.ws-dataset-card::after { content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; background: linear-gradient(120deg, rgba(93,225,255,.3), transparent 28%, transparent 74%, rgba(240,194,95,.25)); opacity: .45; }
.ws-dataset-card:hover { transform: translateY(-6px) rotateX(1deg); border-color: rgba(85, 222, 255, .82); box-shadow: 0 18px 34px rgba(0,0,0,.28), 0 0 26px rgba(47, 200, 243, .2); }
.ws-dataset-card > * { position: relative; z-index: 1; }
.dataset-symbol { display: inline-grid; place-items: center; width: 28px; height: 28px; border: 1px solid rgba(85,222,255,.55); border-radius: 8px; color: #63dcff; background: rgba(50,190,230,.1); box-shadow: 0 0 12px rgba(50,190,230,.2); }
.ws-dataset-card h3 { letter-spacing: .03em; }
.ws-dataset-card .dataset-count strong { color: #64ddff; text-shadow: 0 0 14px rgba(74,216,255,.32); }
.ws-dataset-card .card-actions .primary { min-height: 36px; border-color: rgba(83, 211, 255, .55); box-shadow: 0 0 12px rgba(83,211,255,.12); }
</style>
