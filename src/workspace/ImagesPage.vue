<template>
  <div>
    <div class="ws-heading">
      <div>
        <span class="ws-eyebrow">VISUAL ANNOTATION STUDIO</span>
        <h1>{{ readonly ? "样本检视" : "图片标注工作台" }}</h1>
        <p>
          {{ route.query.name || "数据集" }} · {{ route.query.brand }} ·
          {{ route.query.type }} · {{ route.query.camera }}
        </p>
      </div>
      <div class="heading-actions">
        <button @click="goBack">← 返回</button
        ><button v-if="kind === 'dataset'" @click="importing = true">
          采集产线图片</button
        ><button v-if="kind === 'dataset'" @click="openAssist">辅助打标</button
        ><button
          v-if="!readonly"
          class="primary"
          :disabled="busy || !selected || !dirty || !ready"
          @click="save"
        >
          {{ busy ? "保存中…" : "保存标注" }}
        </button>
      </div>
    </div>
    <ResourceState
      :loading="loading"
      :error="error"
      :empty="!images.length"
      @retry="load"
    />
    <div v-if="images.length && !error && !loading" class="annotation-layout">
      <aside class="ws-panel image-catalog">
        <div class="ws-panel-heading">
          <h3>图片目录</h3>
          <small>{{ total }} 张</small>
        </div>
        <button
          v-for="(item, index) in images"
          :key="item.imageid"
          class="catalog-item"
          :class="{ active: selected?.imageid === item.imageid }"
          @click="select(item)"
        >
          <img :src="assetUrl(item.imageurl)" alt="" loading="lazy" /><span
            >{{ item.name
            }}<small
              >{{ item.yoloinfos?.length || 0 }} 个标注 ·
              {{ String(index + 1).padStart(2, "0") }}</small
            ></span
          ></button
        ><Pager
          :total="total"
          :page="page"
          :size="12"
          :disabled="busy"
          @change="changePage"
        />
      </aside>
      <section class="ws-panel annotation-view">
        <div class="ws-panel-heading">
          <h3>{{ selected?.name }}</h3>
          <span class="ws-badge gold" v-if="dirty">未保存</span>
        </div>
        <div class="annotation-toolbar">
          <button
            v-if="!readonly"
            @click="drawing = !drawing"
            class="draw-button"
            :class="{ primary: drawing }"
            :disabled="!ready"
          >
            {{ drawing ? "完成绘制" : "绘制矩形" }}</button
          ><label v-if="!readonly" class="draw-category"
            >缺陷类别<select v-model.number="toolbarCategory">
              <option
                v-for="(label, index) in labels"
                :key="label.id"
                :value="index"
              >
                {{ label.labelname }}
              </option>
            </select></label
          ><label
            >缩放
            <input
              type="range"
              v-model.number="zoom"
              min="100"
              max="300"
              step="25" /></label
          ><button @click="zoom = 100">{{ zoom }}% / 复位</button
          ><span>{{ width }} × {{ height }}</span>
        </div>
        <div class="annotation-scroll">
          <div class="annotation-canvas" :style="{ width: zoom + '%' }">
            <img
              ref="photo"
              :src="assetUrl(selected?.imageurl)"
              alt="待标注缺陷图片"
              draggable="false"
              @load="imageLoaded"
              @error="imageFailed"
            /><svg
              v-if="ready"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              @pointerdown="startDraw"
              @pointermove="moveDraw"
              @pointerup="endDraw"
              @pointercancel="cancelDraw"
              :class="{ drawing }"
            >
              <g
                v-for="(box, index) in boxes"
                :key="index"
                @pointerdown.stop="chooseBox(index)"
              >
                <rect
                  :x="box.centerX - box.width / 2"
                  :y="box.centerY - box.height / 2"
                  :width="box.width"
                  :height="box.height"
                  :class="{ selected: index === activeBox }"
                />
                <title>
                  {{ labelName(box.defect) }} · 标注 {{ index + 1 }}
                </title>
              </g>
              <rect
                v-if="pending"
                class="pending"
                :x="pending.x"
                :y="pending.y"
                :width="pending.w"
                :height="pending.h"
              />
            </svg>
          </div>
          <p v-if="imageError" class="ws-error-text">
            图片加载失败，请检查图片服务。<button @click="retryImage">
              重试
            </button>
          </p>
        </div>
        <small>{{
          readonly
            ? "样本标注仅供检视"
            : "选择缺陷类别后，在图片上拖拽绘制矩形。点击框可修改坐标，Ctrl + S 保存。"
        }}</small>
        <div v-if="kind === 'validation'" class="validation-result">
          <h3>模型检测结果</h3>
          <img
            v-if="assetUrl(selected?.valiimageurl)"
            :src="assetUrl(selected?.valiimageurl)"
            alt="模型检测结果"
          />
          <p v-else class="muted">该记录未返回检测图</p>
        </div>
      </section>
      <aside class="ws-panel annotation-labels">
        <div class="ws-panel-heading">
          <h3>标注信息</h3>
          <small>{{ boxes.length }} 个</small>
        </div>
        <p v-if="labelError" class="ws-error-text">{{ labelError }}</p>
        <div class="box-list">
          <button
            v-for="(box, index) in boxes"
            :key="index"
            :class="{ primary: index === activeBox }"
            @click="activeBox = index"
          >
            <span
              >{{ String(index + 1).padStart(2, "0") }} ·
              {{ labelName(box.defect) }}</span
            ><small
              >{{ (box.width * width).toFixed(0) }} ×
              {{ (box.height * height).toFixed(0) }}</small
            >
          </button>
        </div>
        <div v-if="boxes[activeBox] && !readonly" class="ws-form">
          <div class="ws-form-grid">
            <label v-for="(label, key) in coordinateLabels" :key="key"
              >{{ label
              }}<input
                type="number"
                min="0"
                max="1"
                step="0.001"
                v-model.number="boxes[activeBox][key]"
                @input="dirty = true"
            /></label>
          </div>
          <button class="danger" @click="removeBox">删除此标注</button>
        </div>
        <div class="ws-note" style="margin-top: 18px">
          {{
            readonly
              ? "对照图片，检查模型检测与人工标注的差异。"
              : "坐标按图片尺寸归一化保存，缩放不会改变标注位置。"
          }}
        </div>
        <button
          v-if="!readonly"
          class="danger"
          :disabled="busy"
          @click="deleteImage"
        >
          删除图片
        </button>
      </aside>
    </div>
    <WorkspaceModal
      v-if="importing"
      title="采集产线缺陷图片"
      :busy="busy"
      @close="importing = false"
      ><form class="ws-form" @submit.prevent="importImages">
        <p class="ws-note">
          按日期从服务器采集当前品牌、类型与相机的缺陷图片。
        </p>
        <div class="ws-form-grid">
          <label
            >开始日期<input type="date" v-model="startDate" required /></label
          ><label
            >结束日期<input type="date" v-model="endDate" required
          /></label>
        </div>
        <p class="ws-error-text">{{ actionError }}</p>
        <div class="ws-form-footer">
          <button class="primary" :disabled="busy">
            {{ busy ? "采集中…" : "开始采集" }}
          </button>
        </div>
      </form></WorkspaceModal
    >
    <WorkspaceModal
      v-if="assisting"
      title="模型辅助打标"
      :busy="busy"
      @close="assisting = false"
      ><form class="ws-form" @submit.prevent="assist">
        <p class="ws-note">
          提交后由服务器处理图片，完成后刷新当前数据集查看标注。
        </p>
        <label
          >选择模型<select v-model="assistModelId" required>
            <option value="">请选择</option>
            <option
              v-for="model in assistModels"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name }}
            </option>
          </select></label
        >
        <p class="ws-error-text">{{ actionError }}</p>
        <div class="ws-form-footer">
          <button class="primary" :disabled="busy || !assistModelId">
            提交辅助打标
          </button>
        </div>
      </form></WorkspaceModal
    >
  </div>
</template>
<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { api, post, userId, pageData, assetUrl, validateBoxes } from "./api";
import { useResource } from "./useResource";
import ResourceState from "./components/ResourceState.vue";
import Pager from "./components/Pager.vue";
import WorkspaceModal from "./components/WorkspaceModal.vue";
const route = useRoute(),
  router = useRouter(),
  kind = route.params.kind,
  id = Number(route.params.id),
  readonly = !["dataset", "base"].includes(kind);
const { loading, error, run } = useResource();
const images = ref([]),
  selected = ref(null),
  boxes = ref([]),
  labels = ref([]),
  labelError = ref(""),
  category = ref(0),
  activeBox = ref(-1),
  page = ref(1),
  total = ref(0),
  busy = ref(false),
  dirty = ref(false),
  drawing = ref(false),
  photo = ref(),
  ready = ref(false),
  imageError = ref(false),
  width = ref(0),
  height = ref(0),
  zoom = ref(100),
  pending = ref(null),
  importing = ref(false),
  assisting = ref(false),
  assistModels = ref([]),
  assistModelId = ref(""),
  actionError = ref("");
const today = new Date().toLocaleDateString("sv-SE"),
  startDate = ref(today),
  endDate = ref(today),
  coordinateLabels = {
    centerX: "中心 X",
    centerY: "中心 Y",
    width: "宽度",
    height: "高度",
  };
const toolbarCategory = computed({
  get() {
    const active = boxes.value[activeBox.value];
    return active ? Number(active.defect) : Number(category.value);
  },
  set(value) {
    const next = Number(value);
    category.value = next;
    const active = boxes.value[activeBox.value];
    if (active) {
      active.defect = next;
      dirty.value = true;
    }
  },
});
let anchor = null;
const sources = {
  dataset: ["/api/BrandCamera/dataset-images", "datasetId"],
  base: ["/api/BaseSet/basesetimages", "basesetid"],
  validation: ["/api/Model/comparedvaliimages", "valiId"],
  train: ["/api/Model/modeltrainimages", "modelId"],
  modelvali: ["/api/Model/modelvaliimages", "modelId"],
};
function load() {
  ready.value = false;
  return run(
    async () => {
      const source = sources[kind];
      if (!source || !Number.isInteger(id) || id < 1)
        throw new Error("无效的数据集");
      return pageData(
        await api(source[0], {
          params: { [source[1]]: id, page: page.value, pageSize: 12 },
        }),
        page.value,
        12,
      );
    },
    (data) => {
      images.value = data.items;
      total.value = data.total;
      setImage(data.items[0] || null);
    },
  );
}
function setImage(item) {
  selected.value = item;
  boxes.value = (item?.yoloinfos || []).map((b) => ({
    ...b,
    defect: labels.value.length ? labelIndex(b.defect) : b.defect,
  }));
  activeBox.value = -1;
  dirty.value = false;
  drawing.value = false;
  pending.value = null;
  anchor = null;
  zoom.value = 100;
  ready.value = false;
  imageError.value = false;
  if (photo.value?.complete && photo.value?.naturalWidth)
    requestAnimationFrame(imageLoaded);
}
async function canDiscard() {
  if (busy.value) return false;
  if (!dirty.value) return true;
  try {
    await ElMessageBox.confirm(
      "当前图片有未保存标注，离开后将丢失。",
      "离开图片",
      {
        confirmButtonText: "放弃修改",
        cancelButtonText: "继续编辑",
        type: "warning",
      },
    );
    return true;
  } catch {
    return false;
  }
}
async function select(item) {
  if (item === selected.value) return;
  if (await canDiscard()) setImage(item);
}
async function changePage(value) {
  if (await canDiscard()) {
    page.value = value;
    load();
  }
}
function imageLoaded() {
  if (!photo.value?.naturalWidth) return;
  width.value = photo.value.naturalWidth;
  height.value = photo.value.naturalHeight;
  ready.value = true;
  imageError.value = false;
}
function imageFailed() {
  ready.value = false;
  imageError.value = true;
}
function retryImage() {
  const img = photo.value;
  img.src = assetUrl(selected.value?.imageurl);
}
function position(e) {
  const r = e.currentTarget.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
    y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
  };
}
function startDraw(e) {
  if (
    !drawing.value ||
    readonly ||
    busy.value ||
    !labels.value.length ||
    e.button !== 0
  )
    return;
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  anchor = position(e);
  pending.value = { x: anchor.x, y: anchor.y, w: 0, h: 0 };
}
function moveDraw(e) {
  if (!anchor) return;
  const p = position(e);
  pending.value = {
    x: Math.min(p.x, anchor.x),
    y: Math.min(p.y, anchor.y),
    w: Math.abs(p.x - anchor.x),
    h: Math.abs(p.y - anchor.y),
  };
}
function endDraw(e) {
  if (!anchor) return;
  moveDraw(e);
  const p = pending.value;
  if (p.w * width.value > 3 && p.h * height.value > 3) {
    boxes.value.push({
      defect: category.value,
      centerX: Number((p.x + p.w / 2).toFixed(6)),
      centerY: Number((p.y + p.h / 2).toFixed(6)),
      width: Number(p.w.toFixed(6)),
      height: Number(p.h.toFixed(6)),
    });
    activeBox.value = boxes.value.length - 1;
    dirty.value = true;
  }
  cancelDraw();
}
function cancelDraw() {
  pending.value = null;
  anchor = null;
}
function chooseBox(index) {
  activeBox.value = index;
}
function removeBox() {
  boxes.value.splice(activeBox.value, 1);
  activeBox.value = -1;
  dirty.value = true;
}
function labelName(value) {
  const numeric = Number(value);
  const label =
    (Number.isInteger(numeric) && numeric >= 0
      ? labels.value[numeric]
      : null) ||
    labels.value.find((item) => String(item.id) === String(value));
  return label?.labelname || `类别 ${value}`;
}
function labelIndex(value) {
  // The service has returned both list indexes and stable string IDs over time.
  // Keep the editor on indexes, then convert back to the service ID when needed.
  if (typeof value === "string" && !/^-?\d+$/.test(value)) {
    const byId = labels.value.findIndex((item) => String(item.id) === value);
    if (byId >= 0) return byId;
  }
  const index = Number(value);
  return Number.isInteger(index) && index >= 0 && index < labels.value.length
    ? index
    : Math.max(0, labels.value.findIndex((item) => String(item.id) === String(value)));
}
function apiDefectValue(index) {
  const label = labels.value[index];
  const id = label?.id;
  return typeof id === "string" && !/^-?\d+$/.test(id) ? id : index;
}
async function save() {
  if (readonly || busy.value || !dirty.value || !selected.value || !ready.value)
    return;
  if (!validateBoxes(boxes.value)) {
    ElMessage.warning("标注坐标必须在图片范围内，宽高必须大于 0");
    return;
  }
  const snapshot = boxes.value.map((b) => ({ ...b }));
  busy.value = true;
  try {
    await api(
      kind === "base"
        ? "/api/BaseSet/basesetimage/yolo"
        : "/api/BrandCamera/save-yoloinfos",
      {
        method: "PUT",
        data: {
          imageid: selected.value.imageid,
          yoloinfos: snapshot.map((b) => ({
            defect: apiDefectValue(Number(b.defect)),
            centerX: Number(b.centerX),
            centerY: Number(b.centerY),
            width: Number(b.width),
            height: Number(b.height),
          })),
        },
      },
    );
    selected.value.yoloinfos = snapshot;
    dirty.value = JSON.stringify(boxes.value) !== JSON.stringify(snapshot);
    ElMessage.success("标注已保存");
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
async function deleteImage() {
  try {
    await ElMessageBox.confirm(
      `永久删除图片“${selected.value.name}”及标注？`,
      "删除图片",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    if (kind === "base")
      await api(`/api/BaseSet/basesetimage/${selected.value.imageid}`, {
        method: "DELETE",
      });
    else
      await post("/api/BrandCamera/delete-image", {
        datasetId: id,
        fileName: selected.value.name,
      });
    dirty.value = false;
    if (images.value.length === 1 && page.value > 1) page.value--;
    await load();
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
async function importImages() {
  if (!(await canDiscard())) return;
  actionError.value = "";
  const start = new Date(startDate.value + "T00:00:00"),
    end = new Date(endDate.value + "T00:00:00");
  if (
    !Number.isFinite(+start) ||
    end < start ||
    (+end - +start) / 86400000 > 30
  ) {
    actionError.value = "请选择有效日期范围，每次最多采集 31 天";
    return;
  }
  const dateNames = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
    dateNames.push(d.toLocaleDateString("sv-SE").replaceAll("-", ""));
  busy.value = true;
  try {
    await post("/api/BrandCamera/downLoad-ngimages", {
      datasetId: id,
      brand: route.query.brand,
      type: route.query.type,
      camera: String(route.query.camera || "").replace(/^camera/, ""),
      dateNames,
    });
    importing.value = false;
    dirty.value = false;
    page.value = 1;
    await load();
    ElMessage.success("采集请求已完成，列表已刷新");
  } catch (e) {
    actionError.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function openAssist() {
  if (!(await canDiscard())) return;
  assisting.value = true;
  actionError.value = "";
  assistModels.value = [];
  try {
    const data = await api("/api/Model/modelinfo", {
      params: {
        Userid: userId(),
        Brand: route.query.brand,
        Type: route.query.type,
        Camera: route.query.camera,
        page: 1,
        pageSize: 100,
      },
    });
    assistModels.value = pageData(
      data,
      1,
      100,
      (i) =>
        i.brand === route.query.brand &&
        i.type === route.query.type &&
        i.camera === route.query.camera,
    ).items;
  } catch (e) {
    actionError.value = e.message;
  }
}
async function assist() {
  busy.value = true;
  actionError.value = "";
  try {
    const model = assistModels.value.find((i) => i.id === assistModelId.value);
    if (!model) throw new Error("请选择模型");
    await post("/api/Model/subcameraset", {
      dataset: {
        id,
        name: route.query.name,
        brand: route.query.brand,
        type: route.query.type,
        camera: route.query.camera,
        userId: userId(),
      },
      model,
    });
    assisting.value = false;
    ElMessage.success("辅助打标任务已提交");
  } catch (e) {
    actionError.value = e.message;
  } finally {
    busy.value = false;
  }
}
function goBack() {
  router.push(
    kind === "base"
      ? "/workspace/basesets"
      : readonly
        ? "/workspace/models"
        : "/workspace/datasets",
  );
}
function beforeUnload(e) {
  if (dirty.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
function keyboard(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    save();
  }
}
onBeforeRouteLeave(canDiscard);
onMounted(() => {
  load();
  api("/api/MarkDefects/markdefectslabel")
    .then((data) => {
      labels.value = Array.isArray(data) ? data : [];
      if (selected.value && !dirty.value) {
        boxes.value = (selected.value.yoloinfos || []).map((b) => ({
          ...b,
          defect: labelIndex(b.defect),
        }));
      }
    })
    .catch((e) => (labelError.value = e.message));
  window.addEventListener("beforeunload", beforeUnload);
  window.addEventListener("keydown", keyboard);
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", beforeUnload);
  window.removeEventListener("keydown", keyboard);
});
</script>
<style scoped>
.annotation-layout {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr) 255px;
  gap: 18px;
  height: calc(100vh - 190px);
  min-height: 500px;
}
.annotation-layout .ws-panel {
  padding: 16px;
  min-height: 0;
  overflow: hidden;
}
.image-catalog { overflow: auto !important; }
.catalog-item {
  display: flex;
  width: 100%;
  text-align: left;
  align-items: center;
  gap: 10px;
  margin-bottom: 9px;
  padding: 7px;
  font-size: 10px;
  background: #102638;
}
.catalog-item img {
  width: 46px;
  height: 44px;
  object-fit: cover;
}
.catalog-item span {
  overflow-wrap: anywhere;
  min-width: 0;
}
.catalog-item small {
  display: block;
  font-size: 9px;
}
.catalog-item.active {
  border-color: #68dbcc;
  background: #1d4b53;
}
.image-catalog :deep(.ws-pagination) {
  flex-direction: column;
}
.annotation-view {
  min-width: 0;
}
.annotation-view h3 {
  overflow-wrap: anywhere;
}
.annotation-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.annotation-toolbar button {
  min-height: 38px;
  padding: 8px 15px;
  font-size: 12px;
}
.annotation-toolbar .draw-button {
  min-width: 118px;
  border-color: rgba(91, 222, 255, .65);
  color: #dffaff;
  background: linear-gradient(135deg, rgba(27, 98, 131, .9), rgba(8, 44, 70, .95));
  box-shadow: 0 0 16px rgba(59, 213, 255, .15), inset 0 0 12px rgba(91, 222, 255, .08);
  font-weight: 700;
}
.annotation-toolbar .draw-button.primary { box-shadow: 0 0 24px rgba(59, 213, 255, .42), inset 0 0 16px rgba(91, 222, 255, .18); }
.draw-category { flex-direction: row !important; align-items: center; gap: 7px; }
.draw-category select { min-width: 130px; min-height: 38px; }
.annotation-toolbar label {
  flex-direction: row;
  align-items: center;
}
.annotation-toolbar input {
  width: 80px;
}
.annotation-scroll {
  height: calc(100% - 128px);
  min-height: 180px;
  overflow: auto;
  background: repeating-conic-gradient(#102534 0% 25%, #122a3a 0% 50%) 50%/20px
    20px;
  border: 1px solid #305468;
  margin-bottom: 15px;
}
.annotation-canvas {
  position: relative;
  line-height: 0;
}
.annotation-canvas img {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}
.annotation-canvas svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.annotation-canvas svg.drawing {
  cursor: crosshair;
}
.annotation-canvas rect {
  fill: #60d8d914;
  stroke: #66ebe1;
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
}
.annotation-canvas rect.selected {
  fill: #f4bd5829;
  stroke: #ffd077;
  stroke-width: 2.5;
}
.annotation-canvas rect.pending {
  stroke: #fff;
  stroke-dasharray: 5;
  pointer-events: none;
}
.box-list {
  display: grid;
  gap: 8px;
  max-height: 190px;
  overflow: auto;
  margin: 15px 0;
}
.box-list button {
  text-align: left;
  font-size: 11px;
}
.box-list small {
  display: block;
  font-size: 10px;
}
.annotation-labels input {
  width: 100%;
}
.validation-result {
  margin-top: 12px;
}
.validation-result img {
  width: 100%;
  margin-top: 12px;
}
@media (max-width: 1350px) {
  .annotation-layout {
    grid-template-columns: 170px minmax(0, 1fr);
  }
  .annotation-labels {
    grid-column: 1/-1;
  }
  .annotation-labels .box-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 800px) {
  .annotation-layout {
    grid-template-columns: 1fr;
  }
  .image-catalog {
    max-height: 230px;
  }
  .annotation-labels {
    grid-column: auto;
  }
}

@media (max-height: 820px) {
  .annotation-layout { height: calc(100vh - 165px); min-height: 420px; }
  .annotation-layout .ws-panel { padding: 12px; }
  .annotation-toolbar { margin-bottom: 6px; }
  .annotation-scroll { height: calc(100% - 112px); }
}
</style>
