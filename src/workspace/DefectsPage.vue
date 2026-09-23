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
                  .map((i) => i.subtype)
                  .filter(Boolean),
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
          <div class="atlas-floor" aria-hidden="true"></div>
          <article
            v-for="item in visible"
            :key="item.uid"
            class="defect-card"
          >
            <div class="hologram-scene">
              <div class="projection-beam" aria-hidden="true"></div>
              <div class="orbital orbital-outer" aria-hidden="true"></div>
              <div class="orbital orbital-inner" aria-hidden="true"></div>
              <div class="projection-base" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
            <button class="defect-visual" @click="preview = item" :aria-label="'查看' + item.name + '完整图片'">
              <img v-if="assetUrl(item.imagepath) && !failedImages[item.imagepath]" :src="assetUrl(item.imagepath)" :alt="item.name + '缺陷样例'" loading="lazy" @error="failedImages[item.imagepath] = true" />
              <span v-else class="visual-placeholder"><b>◇</b>{{ failedImages[item.imagepath] ? '图片加载失败' : '暂无样例图片' }}</span>
              <span class="preview-hint">查看完整图片 ↗</span>
            </button>
              <span class="hologram-caption">{{ item.name }}</span>
            </div>
            <div class="defect-card-body">
              <div class="defect-card-title"><strong>{{ item.name }}</strong><span>{{ item.level || "—" }}</span></div>
              <small class="defect-code">{{ item.uid }} · {{ categoryText(item) }}</small>
              <p>{{ linked ? labelName(item.label) : (item.description || "已建立标准检测规则") }}</p>
              <div class="defect-card-actions">
                <button class="text-button" @click="preview = item">查看详情</button>
                <button class="text-button" @click="edit(item)">{{ linked ? "修改关联" : "编辑" }}</button>
                <button v-if="!linked" class="text-button danger" :disabled="busy" @click="remove(item)">删除</button>
              </div>
            </div>
          </article>
        </div>
        <Pager :total="filtered.length" :page="page" :size="9" :disabled="loading" @change="page = $event" />
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
      ><form class="ws-form defect-editor-form" @submit.prevent="save">
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
              >产品类别<select v-model="draft.type" required :disabled="existing">
                <option>小盒</option>
                <option>条盒</option>
                <option>箱装</option>
              </select></label
            ><label
              >子类别<select v-model="draft.subtype" :disabled="existing">
                <option value="">无子类别</option>
                <option v-for="option in subtypeOptions" :key="option" :value="option">
                  {{ option }}
                </option>
              </select></label
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
          >{{ preview.uid }} · {{ categoryText(preview) }} ·
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
  failedImages = reactive({}),
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
const subtypeOptions = computed(() => {
  const values = [
    ...new Set(
      records.value
        .filter((item) => item.type === draft.type && item.subtype)
        .map((item) => item.subtype),
    ),
  ];
  if (draft.type === "小盒" && !values.includes("小盒外形"))
    values.unshift("小盒外形");
  return values;
});
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * 9, page.value * 9),
);
watch([query, type, subtype], () => (page.value = 1));
watch(type, () => (subtype.value = ""));
watch(
  () => draft.type,
  () => {
    if (draft.subtype && !subtypeOptions.value.includes(draft.subtype))
      draft.subtype = subtypeOptions.value[0] || "";
  },
);
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
      records.value = Array.isArray(a)
        ? a
            .map((item) => {
              const type = String(item.type || "").replace(/\s+/g, "").trim();
              return {
                ...item,
                type: type.includes("小盒框架纸")
                  ? "小盒框架纸"
                  : type.includes("小盒")
                    ? "小盒"
                    : type,
                subtype: String(item.subtype || "").replace(/\s+/g, "").trim(),
              };
            })
            .filter((item) => item.type !== "小盒框架纸")
            .map((item) =>
              item.type === "条盒" && item.subtype === "箱装"
                ? { ...item, type: "箱装", subtype: "" }
                : item,
            )
            .filter((item, index, list) => {
              const key = item.uid
                ? `uid:${item.uid}`
                : `value:${item.name}|${item.type}|${item.subtype}|${item.level}|${item.description}|${item.imagepath}`;
              return (
                list.findIndex((candidate) => {
                  const candidateKey = candidate.uid
                    ? `uid:${candidate.uid}`
                    : `value:${candidate.name}|${candidate.type}|${candidate.subtype}|${candidate.level}|${candidate.description}|${candidate.imagepath}`;
                  return candidateKey === key;
                }) === index
              );
            })
        : [];
      labels.value = Array.isArray(b) ? b : [];
      page.value = Math.min(
        page.value,
        Math.max(1, Math.ceil(filtered.value.length / 9)),
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
function categoryText(item) {
  return item?.subtype ? `${item.type} / ${item.subtype}` : item?.type || "—";
}
function openAdd() {
  Object.keys(draft).forEach((k) => delete draft[k]);
  Object.assign(draft, {
    uid: "",
    name: "",
    description: "",
    type: "小盒",
    subtype: "小盒外形",
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
      confirmButtonClass: "danger-confirm",
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
        confirmButtonClass: "danger-confirm",
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
onMounted(load);
</script>
<style scoped>
.defect-layout { display:grid; grid-template-columns:minmax(0,1fr) 260px; gap:20px; align-items:start; }
.defect-gallery-panel { min-width:0; background:radial-gradient(ellipse at 50% 35%,#10425766,transparent 65%),#091c2a; }
.defect-gallery-panel > .ws-panel-heading { align-items:center; }
.live-signal { color:#81b6bc; font:10px monospace; letter-spacing:1px; }
.live-signal i { display:inline-block; width:6px; height:6px; margin-right:6px; background:#64e4df; border-radius:50%; box-shadow:0 0 12px #64e4df; }
.defect-gallery { isolation:isolate; position:relative; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:26px 18px; padding:22px 8px 24px; }
.atlas-floor { position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(ellipse at 50% 42%,#1cbfe51c,transparent 64%),repeating-linear-gradient(30deg,transparent 0 94px,#71d4de09 95px 96px),repeating-linear-gradient(150deg,transparent 0 94px,#71d4de09 95px 96px); mask-image:linear-gradient(transparent,#000 15%,#000 85%,transparent); }
.defect-card { position:relative; min-width:0; --glow:#7cdedc; }
.defect-card:nth-of-type(3n+2) { --glow:#adbeef; }
.hologram-scene { position:relative; height:275px; isolation:isolate; perspective:800px; }
.projection-beam { position:absolute; left:15%; right:15%; bottom:37px; height:170px; clip-path:polygon(0 0,100% 0,70% 100%,30% 100%); background:linear-gradient(180deg,transparent,#83dcdf0b 30%,#9ceee731); pointer-events:none; }
.orbital { position:absolute; left:50%; width:94%; height:70px; border:1px solid #8ccdda35; border-radius:50%; transform:translateX(-50%); pointer-events:none; box-shadow:0 0 20px #6ad9ea0b,inset 0 0 18px #6ad9ea08; }
.orbital-outer { top:24px; animation:orbit-breathe 5s ease-in-out infinite; }
.orbital-inner { top:155px; width:78%; height:49px; border-color:#aedbd94d; }
.projection-base { position:absolute; left:50%; bottom:16px; width:74%; height:70px; transform:translateX(-50%); pointer-events:none; }
.projection-base i { position:absolute; inset:0; border:1px solid #9de4e082; border-radius:50%; background:radial-gradient(ellipse,#bcece51f,transparent 66%); box-shadow:0 0 15px #8cddd624; }
.projection-base i:nth-child(2) { inset:10px 13%; border-color:#9fd8e9a6; }
.projection-base i:nth-child(3) { inset:19px 25%; background:#e9e1d3; box-shadow:0 0 20px #c4ede58c,0 0 40px #62cfee55; border:0; }
.projection-base b { position:absolute; inset:31px -5% -8px; z-index:-1; background:#72cde013; border:1px solid #74cfe82e; transform:rotateX(62deg) rotateZ(-30deg); box-shadow:0 12px 0 #7fc7df0a,0 24px 0 #7fc7df06; }
.defect-card .defect-visual { position:absolute; inset:8px 12% auto; width:76%; height:158px; padding:8px; display:grid; place-items:center; overflow:visible; border:0; border-radius:8px; background:radial-gradient(ellipse,#142f4080,transparent 72%); transform:translateY(0); cursor:zoom-in; }
.defect-visual img,.defect-visual .visual-placeholder { animation:hologram-float 5s ease-in-out infinite; }
.defect-card:nth-of-type(2n) .defect-visual img { animation-delay:-2s; }
.defect-card .defect-visual:hover { background:radial-gradient(ellipse,#22546a88,transparent 72%); transform:none; }
.defect-visual img { display:block; width:100%; height:100%; min-height:0; object-fit:contain; filter:drop-shadow(0 10px 10px #0007) drop-shadow(0 0 7px #87e1e52b); }
.defect-card:hover .projection-base { filter:brightness(1.3); }
.defect-card:hover .orbital { border-color:#b3eeeb99; }
.hologram-caption { position:absolute; left:5%; right:5%; bottom:86px; text-align:center; color:#e1f2ee; font-size:13px; text-shadow:0 0 12px #a6e8e7a0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.visual-placeholder { display:grid; gap:8px; text-align:center; color:#adcbd0; font-size:11px; }
.visual-placeholder b { color:#ffe6a9; font-size:46px; font-weight:400; filter:drop-shadow(0 0 12px #f3d99f77); }
.preview-hint { position:absolute; bottom:-10px; color:#b4d8df; font-size:10px; opacity:0; transition:opacity .2s; }
.defect-visual:hover .preview-hint,.defect-visual:focus-visible .preview-hint { opacity:1; }
.defect-card-body { position:relative; margin:0 8px; padding:12px 10px 8px; border-top:1px solid #80cbc547; background:linear-gradient(180deg,#78c9cb0c,transparent); }
.defect-card-title { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.defect-card-title strong { color:#dff0ef; font-size:14px; overflow-wrap:anywhere; }
.defect-card-title span { flex-shrink:0; color:#f5d398; font:600 12px/20px monospace; }
.defect-code { display:block; margin-top:6px; color:#85a9ba; font-size:11px; overflow-wrap:anywhere; }
.defect-card-body p { min-height:38px; margin:8px 0; color:#9eb8c6; font-size:12px; line-height:19px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.defect-card-actions { display:flex; gap:4px; }
.defect-card-actions .text-button { font-size:11px; padding:4px 6px; border-color:transparent; }
.defect-card-actions .danger { margin-left:auto; }
.label-list { max-height:350px; overflow:auto; margin-bottom:14px; }
.label-list > div { display:flex; align-items:center; justify-content:space-between; gap:8px; border-bottom:1px solid #244050; padding:10px 0; font-size:12px; }
.label-list small { margin-right:6px; color:#68bfb9; }
.defect-preview { text-align:center; }
.defect-preview img { display:block; width:100%; height:55vh; object-fit:contain; background:#071522; border-radius:8px; }
.defect-preview p { margin:16px 0; }
.defect-editor-form { position:relative; overflow:hidden; padding:4px 2px 2px; }
.defect-editor-form::before { content:""; position:absolute; inset:0; pointer-events:none; border:1px solid rgba(82,213,241,.24); border-radius:14px; background:linear-gradient(135deg,rgba(49,168,202,.08),transparent 38%,rgba(222,177,77,.06)); }
.defect-editor-form > * { position:relative; z-index:1; }
.defect-editor-form .ws-form-grid { gap:14px; padding:18px; border:1px solid rgba(80,186,217,.2); border-radius:12px; background:linear-gradient(135deg,rgba(7,38,61,.72),rgba(7,20,37,.76)); box-shadow:inset 0 1px rgba(255,255,255,.06),0 0 24px rgba(26,174,218,.07); }
.defect-editor-form label { color:#91b5c5; letter-spacing:.03em; }
.defect-editor-form input,.defect-editor-form select,.defect-editor-form textarea { border-color:rgba(81,198,231,.38); background:rgba(3,21,38,.9); box-shadow:inset 0 0 12px rgba(31,157,204,.06); transition:border-color .2s,box-shadow .2s,transform .2s; }
.defect-editor-form input:focus,.defect-editor-form select:focus,.defect-editor-form textarea:focus { border-color:#5edfff; box-shadow:0 0 16px rgba(78,215,255,.2),inset 0 0 12px rgba(31,157,204,.12); transform:translateY(-1px); }
.defect-editor-form textarea { min-height:86px; resize:vertical; }
.defect-editor-form .ws-form-footer { margin-top:18px; padding:14px 4px 0; border-top:1px solid rgba(91,179,207,.2); }
.defect-editor-form .ws-form-footer .primary { min-width:130px; box-shadow:0 0 20px rgba(45,203,241,.2); }
@keyframes hologram-float { 50% { transform:translateY(-8px); } }
@keyframes orbit-breathe { 50% { opacity:.5; transform:translateX(-50%) translateY(6px); } }
@media(max-width:1300px) { .defect-layout { grid-template-columns:minmax(0,1fr); } .defect-layout > aside { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; } }
@media(max-width:850px) { .defect-gallery { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:580px) { .defect-gallery,.defect-layout > aside { grid-template-columns:minmax(0,1fr); } }
@media(prefers-reduced-motion:reduce) { .defect-visual img,.defect-visual .visual-placeholder,.orbital { animation:none !important; } }
</style>
