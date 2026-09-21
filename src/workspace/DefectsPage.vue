<template>
  <div>
    <div class="ws-heading">
      <div>
        <span class="ws-eyebrow">{{
          linked ? "LABEL TAXONOMY" : "DEFECT STANDARD LIBRARY"
        }}</span>
        <h1>{{ linked ? "打标缺陷" : "标准缺陷" }}</h1>
        <p>
          {{
            linked
              ? "连接业务缺陷与模型类别，建立一致的识别语言"
              : "统一缺陷定义、质量等级与图像样例"
          }}
        </p>
      </div>
      <button class="primary" @click="openAdd">
        ＋ {{ linked ? "新增标签" : "新增标准缺陷" }}
      </button>
    </div>
    <div class="ws-summary">
      <article class="ws-stat">
        <small>标准缺陷</small><strong>{{ records.length }}</strong
        ><span>已加载的缺陷条目</span><em>◇</em>
      </article>
      <article class="ws-stat">
        <small>{{ linked ? "标签类别" : "缺陷大类" }}</small
        ><strong>{{
          linked ? labels.length : new Set(records.map((i) => i.type)).size
        }}</strong
        ><span>{{ linked ? "模型识别类别" : "覆盖产品类别" }}</span
        ><em>⌗</em>
      </article>
      <article class="ws-stat">
        <small>{{ linked ? "已关联缺陷" : "已配置样例" }}</small
        ><strong>{{
          records.filter((i) =>
            linked
              ? i.label >= 0
              : !!i.imagepath && !i.imagepath.includes("none.png"),
          ).length
        }}</strong
        ><span>当前全部记录</span><em>▧</em>
      </article>
      <article class="ws-stat">
        <small>当前筛选</small><strong>{{ filtered.length }}</strong
        ><span>符合条件的条目</span><em>⌕</em>
      </article>
    </div>
    <div class="ws-filters">
      <label class="grow"
        >搜索<input v-model="query" placeholder="缺陷名称、编号、描述" /></label
      ><label
        >产品类别<select v-model="type">
          <option value="">全部类别</option>
          <option
            v-for="t in [...new Set(records.map((i) => i.type))]"
            :key="t"
          >
            {{ t }}
          </option>
        </select></label
      ><label
        >子类别<select v-model="subtype">
          <option value="">全部子类别</option>
          <option
            v-for="t in [
              ...new Set(
                records
                  .filter((i) => !type || i.type === type)
                  .map((i) => i.subtype),
              ),
            ]"
            :key="t"
          >
            {{ t }}
          </option>
        </select></label
      ><button @click="load" :disabled="loading">刷新</button>
    </div>
    <div class="defect-layout">
      <section class="ws-panel defect-gallery-panel">
        <div class="ws-panel-heading">
          <div>
            <h3>{{ linked ? "标注缺陷图谱" : "标准缺陷图鉴" }}</h3>
            <small>{{ updated ? "数据更新于 " + updated : "实时缺陷样例" }}</small>
          </div>
          <span class="live-signal"><i></i> LIVE VIEW</span>
        </div>
        <ResourceState
          :loading="loading"
          :error="error"
          :empty="!filtered.length"
          @retry="load"
        />
        <div v-if="!loading && !error" class="defect-gallery">
          <article
            v-for="(item, index) in visible"
            :key="item.uid"
            class="defect-card"
            :style="{ '--card-index': index }"
            @pointermove="tiltCard"
            @pointerleave="resetCard"
          >
            <div class="hologram-scene">
              <span class="holo-beam"></span>
              <span class="orbit orbit-one"></span>
              <span class="orbit orbit-two"></span>
              <span class="orbit orbit-three"></span>
              <button class="defect-visual" @click="preview = item" :aria-label="'查看' + item.name">
                <img
                  v-if="assetUrl(item.imagepath)"
                  :src="assetUrl(item.imagepath)"
                  alt="缺陷样例"
                  @error="imageError"
                /><span v-else class="visual-placeholder">◇</span>
                <span class="scan-line"></span>
                <span class="visual-corner corner-tl"></span><span class="visual-corner corner-br"></span>
                <em>{{ linked ? "LABEL" : "STANDARD" }}</em>
              </button>
              <div class="card-platform" aria-hidden="true">
                <i></i><i></i><i></i><i></i>
              </div>
            </div>
            <div class="defect-card-body">
              <div class="defect-card-title"><strong>{{ item.name }}</strong><span>{{ item.level || "—" }}</span></div>
              <small class="defect-code">{{ item.uid }} · {{ item.type }} / {{ item.subtype }}</small>
              <p>{{ linked ? labelName(item.label) : (item.description || "已建立标准检测规则") }}</p>
              <div class="defect-card-actions">
                <button class="text-button" @click="preview = item">查看详情</button>
                <button class="text-button" @click="edit(item)">{{ linked ? "修改关联" : "编辑" }}</button>
                <button v-if="!linked" class="text-button danger" :disabled="busy" @click="remove(item)">删除</button>
              </div>
            </div>
          </article>
        </div>
        <Pager :total="filtered.length" :page="page" :disabled="loading" @change="page = $event" />
      </section>
      <aside>
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>{{ linked ? "标签分布" : "质量等级分布" }}</h3>
            <small>当前筛选</small>
          </div>
          <InsightChart
            :rows="
              countBy(filtered, linked ? (i) => labelName(i.label) : 'level')
            "
            kind="donut"
            title="缺陷分布"
          />
        </section>
        <section v-if="linked" class="ws-panel">
          <div class="ws-panel-heading">
            <h3>标签类别</h3>
            <small>{{ labels.length }} 项</small>
          </div>
          <div class="label-list">
            <div v-for="(label, index) in labels" :key="label.id">
              <span
                ><small>{{ index.toString().padStart(2, "0") }}</small>
                {{ label.labelname }}</span
              ><button
                class="text-button danger"
                :disabled="
                  busy || labelInUse(index) || index !== labels.length - 1
                "
                @click="deleteLabel(label, index)"
                :title="
                  labelInUse(index)
                    ? '此标签仍有关联缺陷'
                    : index !== labels.length - 1
                      ? '保持既有类别序号，暂不删除中间标签'
                      : ''
                "
              >
                删除
              </button>
            </div>
          </div>
          <small>沿用客户端类别顺序；保留已有类别编号。</small>
        </section>
        <section v-else class="ws-panel">
          <div class="ws-panel-heading"><h3>产品类别分布</h3></div>
          <InsightChart :rows="countBy(filtered, 'type')" title="产品类别" />
        </section>
      </aside>
    </div>
    <WorkspaceModal
      v-if="editing"
      :title="
        linked
          ? draft.uid
            ? '修改标签关联'
            : '新增模型标签'
          : draft.uid && existing
            ? '编辑标准缺陷'
            : '新增标准缺陷'
      "
      :busy="busy"
      @close="editing = false"
      ><form class="ws-form" @submit.prevent="save">
        <template v-if="linked"
          ><label v-if="!draft.uid"
            >标签名称<input
              v-model.trim="draft.labelname"
              required
              maxlength="80" /></label
          ><template v-else
            ><h3>{{ draft.name }}</h3>
            <label
              >模型标签<select v-model.number="draft.label">
                <option :value="-1">不属于深度学习缺陷</option>
                <option
                  v-for="(label, index) in labels"
                  :key="label.id"
                  :value="index"
                >
                  {{ label.labelname }}
                </option>
              </select></label
            ></template
          ></template
        ><template v-else
          ><div class="ws-form-grid">
            <label
              >缺陷编号<input
                v-model.trim="draft.uid"
                required
                :disabled="existing"
                maxlength="80" /></label
            ><label
              >缺陷名称<input
                v-model.trim="draft.name"
                required
                maxlength="150" /></label
            ><label
              >产品类别<input
                v-model.trim="draft.type"
                required
                list="defect-types"
              /><datalist id="defect-types">
                <option>小盒</option>
                <option>条盒</option>
              </datalist></label
            ><label>子类别<input v-model.trim="draft.subtype" required /></label
            ><label
              >质量等级<select v-model="draft.level">
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select></label
            ><label
              >样例图片<input
                type="file"
                accept="image/png,image/jpeg,image/bmp,image/webp"
                @change="file = $event.target.files[0]"
            /></label>
          </div>
          <label
            >缺陷描述<textarea
              v-model.trim="draft.description"
              rows="3"
              maxlength="2000"
            ></textarea></label
        ></template>
        <p v-if="actionError" class="ws-error-text">{{ actionError }}</p>
        <div class="ws-form-footer">
          <button type="button" :disabled="busy" @click="editing = false">
            取消</button
          ><button class="primary" :disabled="busy">
            {{ busy ? "保存中…" : "保存" }}
          </button>
        </div>
      </form></WorkspaceModal
    >
    <WorkspaceModal v-if="preview" :title="preview.name" @close="preview = null"
      ><div class="defect-preview">
        <img
          v-if="assetUrl(preview.imagepath)"
          :src="assetUrl(preview.imagepath)"
          alt="标准缺陷示例"
          @error="imageError"
        />
        <p>{{ preview.description || "暂无描述" }}</p>
        <small
          >{{ preview.uid }} · {{ preview.type }} / {{ preview.subtype }} ·
          {{ preview.level }}</small
        >
      </div></WorkspaceModal
    >
  </div>
</template>
<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { api, post, countBy, assetUrl } from "./api";
import { useResource } from "./useResource";
import InsightChart from "./components/InsightChart.vue";
import ResourceState from "./components/ResourceState.vue";
import Pager from "./components/Pager.vue";
import WorkspaceModal from "./components/WorkspaceModal.vue";
const linked = useRoute().name === "workspace-labels",
  records = ref([]),
  labels = ref([]),
  query = ref(""),
  type = ref(""),
  subtype = ref(""),
  page = ref(1),
  editing = ref(false),
  existing = ref(false),
  busy = ref(false),
  actionError = ref(""),
  file = ref(null),
  preview = ref(null),
  draft = reactive({});
const { loading, error, updated, run } = useResource();
const filtered = computed(() =>
  records.value.filter(
    (i) =>
      (!type.value || i.type === type.value) &&
      (!subtype.value || i.subtype === subtype.value) &&
      [i.name, i.uid, i.description]
        .join(" ")
        .toLowerCase()
        .includes(query.value.toLowerCase()),
  ),
);
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * 20, page.value * 20),
);
watch([query, type, subtype], () => (page.value = 1));
watch(type, () => (subtype.value = ""));
function load() {
  return run(
    () =>
      Promise.all([
        api(
          linked ? "/api/Defects/linkdefectsinfo" : "/api/Defects/defectsinfo",
        ),
        linked ? api("/api/MarkDefects/markdefectslabel") : [],
      ]),
    ([a, b]) => {
      records.value = Array.isArray(a) ? a : [];
      labels.value = Array.isArray(b) ? b : [];
      page.value = Math.min(
        page.value,
        Math.max(1, Math.ceil(filtered.value.length / 20)),
      );
    },
  );
}
function labelName(value) {
  return Number(value) === -1
    ? "非深度学习缺陷"
    : labels.value[Number(value)]?.labelname || `未识别类别 ${value ?? "—"}`;
}
function labelInUse(index) {
  return records.value.some((i) => Number(i.label) === index);
}
function openAdd() {
  Object.keys(draft).forEach((k) => delete draft[k]);
  Object.assign(draft, {
    uid: "",
    name: "",
    description: "",
    type: "小盒",
    subtype: "小盒商标纸",
    level: "A",
    imagepath: "",
    labelname: "",
  });
  existing.value = false;
  file.value = null;
  actionError.value = "";
  editing.value = true;
}
function edit(item) {
  Object.assign(draft, item);
  existing.value = true;
  file.value = null;
  actionError.value = "";
  editing.value = true;
}
async function save() {
  if (busy.value) return;
  busy.value = true;
  actionError.value = "";
  try {
    if (linked) {
      await post(
        draft.uid
          ? "/api/MarkDefects/changelinkdefectsinfo"
          : "/api/MarkDefects/addmarkdefects",
        draft.uid ? { ...draft } : { id: 0, labelname: draft.labelname },
      );
    } else {
      let imagepath = draft.imagepath;
      if (file.value) {
        const ext = file.value.name.split(".").pop();
        const form = new FormData();
        form.append(
          "file",
          file.value,
          `defect_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`,
        );
        const result = await post("/api/Defects/uploadImage", form);
        imagepath =
          typeof result === "string"
            ? result.match(/\/images\/.*$/)?.[0] || result
            : result?.imagepath || result?.url || result?.path;
        if (!imagepath) throw new Error("图片上传结果缺少地址，请核对返回格式");
      }
      await post(
        existing.value
          ? "/api/Defects/changedefectsinfo"
          : "/api/Defects/adddefectsinfo",
        { ...draft, imagepath },
      );
    }
    editing.value = false;
    await load();
    ElMessage.success("已保存");
  } catch (e) {
    actionError.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function remove(item) {
  try {
    await ElMessageBox.confirm(`删除标准缺陷“${item.name}”？`, "删除确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  busy.value = true;
  try {
    await post("/api/Defects/deletedefectsinfo", item);
    await load();
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
async function deleteLabel(label, index) {
  if (labelInUse(index) || index !== labels.value.length - 1) return;
  try {
    await ElMessageBox.confirm(
      `删除“${label.labelname}”前，请确认已有标注和模型也不再使用该类别。`,
      "删除标签",
      {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    await api(`/api/MarkDefects/${label.id}`, { method: "DELETE" });
    await load();
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
function imageError(event) {
  event.target.style.visibility = "hidden";
  event.target.parentElement.setAttribute("title", "图片未能加载");
}
function tiltCard(event) {
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  card.style.setProperty("--card-rotate-x", `${-y * 9}deg`);
  card.style.setProperty("--card-rotate-y", `${x * 11}deg`);
  card.style.setProperty("--card-glow-x", `${(x + 0.5) * 100}%`);
  card.style.setProperty("--card-glow-y", `${(y + 0.5) * 100}%`);
}
function resetCard(event) {
  const card = event.currentTarget;
  card.style.setProperty("--card-rotate-x", "0deg");
  card.style.setProperty("--card-rotate-y", "0deg");
  card.style.setProperty("--card-glow-x", "50%");
  card.style.setProperty("--card-glow-y", "35%");
}
onMounted(load);
</script>
<style scoped>
.defect-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}
.defect-gallery-panel { min-width: 0; }
.defect-gallery-panel > .ws-panel-heading { align-items: center; }
.live-signal {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  border: 1px solid rgba(92, 224, 216, .25);
  border-radius: 999px;
  color: #74d8d0;
  font: 9px monospace;
  letter-spacing: 1px;
}
.live-signal i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #69e4d4;
  box-shadow: 0 0 10px #69e4d4;
  animation: live-pulse 1.6s ease-in-out infinite;
}
.defect-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px 16px;
  padding: 8px 2px 12px;
  perspective: 1500px;
  perspective-origin: center top;
}
.defect-card {
  position: relative;
  min-width: 0;
  min-height: 346px;
  padding-top: 4px;
  overflow: visible;
  transform: rotateX(var(--card-rotate-x, 0deg)) rotateY(var(--card-rotate-y, 0deg)) translateZ(0);
  transform-style: preserve-3d;
  transform-origin: center 58%;
  will-change: transform;
  animation: defect-rise .46s both cubic-bezier(.2,.8,.2,1);
  animation-delay: calc(var(--card-index) * 35ms);
  transition: transform .18s ease-out, filter .25s ease;
}
.defect-card::before {
  content: "";
  position: absolute;
  left: 7%;
  right: 7%;
  top: 52px;
  height: 220px;
  z-index: -1;
  pointer-events: none;
  border-radius: 50%;
  background: radial-gradient(circle at var(--card-glow-x, 50%) var(--card-glow-y, 38%), rgba(79, 236, 226, .24), rgba(32, 145, 176, .08) 36%, transparent 70%);
  filter: blur(3px);
  opacity: .7;
  transition: opacity .25s ease, transform .25s ease;
}
.defect-card:hover {
  transform: rotateX(var(--card-rotate-x, 0deg)) rotateY(var(--card-rotate-y, 0deg)) translateZ(24px) translateY(-5px);
  filter: drop-shadow(0 22px 22px rgba(0, 0, 0, .34)) drop-shadow(0 0 18px rgba(44, 211, 207, .2));
}
.defect-card:hover::before { opacity: 1; transform: scale(1.08); }
.hologram-scene {
  position: relative;
  height: 222px;
  transform-style: preserve-3d;
  isolation: isolate;
}
.holo-beam {
  position: absolute;
  left: 24%;
  right: 24%;
  top: 60px;
  height: 118px;
  z-index: 0;
  clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%);
  background: linear-gradient(to bottom, rgba(123, 240, 233, .23), rgba(54, 189, 210, .07) 62%, transparent);
  filter: blur(2px);
  animation: beam-breathe 2.8s ease-in-out infinite;
}
.orbit {
  position: absolute;
  left: 50%;
  z-index: 1;
  border: 1px solid rgba(129, 230, 222, .48);
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(74, 219, 222, .14), inset 0 0 10px rgba(74, 219, 222, .12);
  transform: translateX(-50%) rotateX(68deg);
}
.orbit-one { top: 78px; width: 82%; height: 62px; animation: orbit-pulse 4.2s ease-in-out infinite; }
.orbit-two { top: 111px; width: 66%; height: 48px; animation: orbit-pulse 4.2s ease-in-out -1.2s infinite; }
.orbit-three { top: 143px; width: 49%; height: 34px; animation: orbit-pulse 4.2s ease-in-out -2.4s infinite; }
.defect-visual {
  position: absolute;
  left: 50%;
  top: 2px;
  z-index: 5;
  width: 72%;
  height: 116px;
  padding: 0 !important;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(103, 230, 225, .58);
  border-radius: 7px;
  background: radial-gradient(circle at 50% 35%, rgba(43, 160, 185, .25), rgba(4, 19, 32, .95) 70%);
  clip-path: polygon(8% 0, 92% 0, 100% 16%, 100% 84%, 92% 100%, 8% 100%, 0 84%, 0 16%);
  transform: translateX(-50%) translateZ(46px);
  box-shadow: 0 0 0 1px rgba(109, 226, 220, .18), 0 16px 26px rgba(0, 0, 0, .38), 0 0 22px rgba(42, 204, 220, .18);
  animation: hologram-float 3.6s ease-in-out infinite;
}
.defect-visual img { width: 100%; height: 100%; object-fit: cover; transition: transform .45s ease, filter .45s ease; }
.defect-card:hover .defect-visual img { transform: scale(1.08); filter: saturate(1.2) contrast(1.06); }
.visual-placeholder { display: grid; place-items: center; height: 100%; color: #69d9d2; font-size: 42px; opacity: .7; }
.defect-visual em { position: absolute; left: 10px; top: 9px; padding: 3px 6px; border: 1px solid rgba(113, 225, 216, .55); border-radius: 3px; color: #9aeae1; background: rgba(4, 25, 40, .72); font: 8px monospace; letter-spacing: 1px; }
.scan-line { position: absolute; left: 0; right: 0; top: -20%; height: 2px; background: linear-gradient(90deg, transparent, #65e8de, transparent); opacity: .6; box-shadow: 0 0 10px #65e8de; animation: scan 3.8s linear infinite; }
.visual-corner { position: absolute; width: 12px; height: 12px; border-color: #71e4d8; border-style: solid; opacity: .85; }
.corner-tl { left: 7px; top: 7px; border-width: 1px 0 0 1px; }.corner-br { right: 7px; bottom: 7px; border-width: 0 1px 1px 0; }
.card-platform {
  position: absolute;
  left: 13%;
  right: 13%;
  top: 134px;
  height: 82px;
  z-index: 3;
  pointer-events: none;
  transform-style: preserve-3d;
}
.card-platform::before {
  content: "";
  position: absolute;
  inset: 24px -18px 0;
  background: radial-gradient(ellipse, rgba(49, 218, 231, .5), transparent 68%);
  filter: blur(10px);
}
.card-platform i {
  position: absolute;
  left: 0;
  right: 0;
  height: 54px;
  display: block;
  border: 1px solid rgba(126, 236, 232, .62);
  background: linear-gradient(145deg, rgba(126, 239, 232, .42), rgba(83, 124, 182, .18) 55%, rgba(220, 189, 126, .2));
  clip-path: polygon(50% 0, 100% 35%, 50% 70%, 0 35%);
  box-shadow: 0 0 20px rgba(61, 211, 224, .22);
}
.card-platform i:nth-child(1) { top: 0; opacity: .9; }
.card-platform i:nth-child(2) { top: 13px; transform: scale(.92); opacity: .68; }
.card-platform i:nth-child(3) { top: 26px; transform: scale(.84); opacity: .48; }
.card-platform i:nth-child(4) { top: 39px; transform: scale(.76); opacity: .3; }
.defect-card:hover .card-platform { transform: translateZ(12px) scale(1.06); }
.defect-card-body {
  position: relative;
  z-index: 6;
  width: 92%;
  min-height: 112px;
  margin: -6px auto 0;
  padding: 13px 14px 11px;
  border: 1px solid rgba(89, 213, 216, .5);
  border-radius: 7px;
  background: linear-gradient(145deg, rgba(16, 58, 72, .96), rgba(5, 25, 40, .98));
  clip-path: polygon(5% 0, 95% 0, 100% 13%, 100% 87%, 95% 100%, 5% 100%, 0 87%, 0 13%);
  transform: translateZ(18px);
  box-shadow: inset 0 0 24px rgba(90, 218, 214, .07), 0 12px 22px rgba(0, 0, 0, .28);
}
.defect-card-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.defect-card-title strong { overflow: hidden; color: #d9f6f5; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.defect-card-title span { flex: 0 0 auto; color: #f2ca74; font: 700 11px monospace; }
.defect-code { display: block; margin-top: 5px; color: #6d9eac; font: 10px monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.defect-card-body p { height: 15px; overflow: hidden; margin: 7px 0; color: #8baeba; font-size: 10px; line-height: 15px; text-overflow: ellipsis; white-space: nowrap; }
.defect-card-actions { display: flex; gap: 8px; border-top: 1px solid rgba(53, 102, 119, .45); padding-top: 8px; }
.defect-card-actions .text-button { font-size: 10px; }
@keyframes defect-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scan { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: .65; } 88% { opacity: .65; } 100% { transform: translateY(150px); opacity: 0; } }
@keyframes live-pulse { 50% { opacity: .35; transform: scale(.65); } }
@keyframes hologram-float { 0%, 100% { transform: translateX(-50%) translateY(0) translateZ(46px); } 50% { transform: translateX(-50%) translateY(-7px) translateZ(52px); } }
@keyframes orbit-pulse { 0%, 100% { opacity: .34; transform: translateX(-50%) rotateX(68deg) scale(.94); } 50% { opacity: .82; transform: translateX(-50%) rotateX(68deg) scale(1.05); } }
@keyframes beam-breathe { 0%, 100% { opacity: .38; } 50% { opacity: .85; } }
.defect-thumb {
  width: 64px;
  height: 48px;
  padding: 0 !important;
  overflow: hidden;
  display: grid;
  place-items: center;
}
.defect-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.label-list {
  max-height: 350px;
  overflow: auto;
  margin-bottom: 14px;
}
.label-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #244050;
  padding: 9px 0;
  font-size: 12px;
}
.label-list small {
  margin-right: 6px;
  color: #68bfb9;
}
.defect-preview {
  text-align: center;
}
.defect-preview img {
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
}
.defect-preview p {
  margin: 16px 0;
}
@media (max-width: 1100px) {
  .defect-layout { grid-template-columns: minmax(0, 1fr) 250px; gap: 12px; }
  .defect-gallery { grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 10px; }
}
</style>
