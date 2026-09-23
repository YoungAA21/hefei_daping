<template>
  <div class="validation-page">
    <div class="validation-hero">
      <div>
        <span class="ws-eyebrow">MODEL VALIDATION / QUALITY INTELLIGENCE</span>
        <h1>质量分析</h1>
        <p>通过模型验证结果追踪检测质量，定位模型与产线的改善空间</p>
      </div>
      <button class="validation-create" @click="openCreate">＋ 创建验证任务</button>
    </div>
    <form class="validation-filters" @submit.prevent="search">
      <label>品牌<select v-model="filters.brand"><option v-for="brand in brands" :key="brand">{{ brand }}</option></select></label>
      <label>检测类型<select v-model="filters.type"><option v-for="type in types" :key="type">{{ type }}</option></select></label>
      <label>相机<select v-model="filters.camera"><option v-for="camera in cameras" :key="camera">{{ camera }}</option></select></label>
      <button class="filter-submit" :disabled="loading">分析查询</button>
    </form>
    <div class="validation-stats">
      <div><small>验证任务</small><strong>{{ total }}</strong><span>当前筛选范围</span></div>
      <div><small>已完成</small><strong class="cyan">{{ completed }}</strong><span>可查看验证结果</span></div>
      <div><small>执行中</small><strong class="gold">{{ running }}</strong><span>后台持续更新</span></div>
      <div><small>最近同步</small><strong class="time">{{ updated || "—" }}</strong><span>页面可见时自动刷新</span></div>
    </div>
    <ResourceState :loading="loading && !items.length" :error="error" :empty="!items.length" text="暂无验证任务" @retry="load" />
    <section v-if="items.length" class="validation-board">
      <div class="board-header"><div><span class="board-kicker">VALIDATION REGISTRY</span><h2>验证任务档案</h2></div><span class="live-dot"><i></i> LIVE 10S</span></div>
      <div class="validation-grid">
        <article v-for="item in items" :key="item.id" class="validation-card" :class="{ done: isDone(item), failed: item.valimsg === '验证失败' }" @dblclick="openResult(item)">
          <div class="validation-card-top"><span class="task-chip"><i></i>{{ item.valimsg || "等待中" }}</span><button class="delete-button" :disabled="busy" aria-label="删除验证任务" @click.stop="remove(item)">×</button></div>
          <div class="validation-card-content">
            <div class="validation-card-info">
              <span class="task-id">VALIDATION / {{ String(item.id).padStart(3,"0") }}</span>
              <h3>{{ item.name }}</h3>
              <p class="task-context">{{ item.brand }} <b>·</b> {{ item.type }} <b>·</b> {{ item.camera }}</p>
              <div class="model-chip"><small>验证模型</small><strong>{{ item.model || "—" }}</strong></div>
            </div>
            <div class="progress-orb" :class="statusClass(item)" :style="{ '--progress': progressOf(item) + '%' }"><div><strong>{{ progressOf(item) }}<small>%</small></strong><span>{{ isDone(item) ? "已完成" : "进度" }}</span></div></div>
          </div>
          <div class="validation-card-bottom"><span><small>{{ isDone(item) ? "完成时间" : "创建时间" }}</small><strong>{{ timeText(isDone(item) ? (item.updatetime || item.completetime || item.createtime) : item.createtime) }}</strong></span><button class="result-button" :disabled="!isDone(item)" @click.stop="openResult(item)">{{ isDone(item) ? "查看双图结果" : "等待验证完成" }}<b v-if="isDone(item)">↗</b></button></div>
        </article>
      </div>
      <Pager :total="total" :page="page" :size="20" :disabled="loading" @change="changePage" />
    </section>
    <WorkspaceModal v-if="creating" title="创建新验证任务" :busy="busy" @close="creating = false">
      <form class="create-validation-form" @submit.prevent="createTask">
        <div class="create-intro"><span>MODEL VALIDATION</span><strong>配置一次验证，读取模型真实表现</strong></div>
        <div class="create-grid">
          <label class="wide">验证名称<input v-model.trim="draft.name" required maxlength="100" /></label>
          <label>品牌<select v-model="draft.brand"><option v-for="brand in brands" :key="brand">{{ brand }}</option></select></label>
          <label>检测类型<select v-model="draft.type"><option v-for="type in types" :key="type">{{ type }}</option></select></label>
          <label>视角<select v-model="draft.camera"><option v-for="camera in cameras" :key="camera">{{ camera }}</option></select></label>
        </div>
        <div class="choice-bar"><span>模型选择</span><button type="button" @click="loadChoices" :disabled="choicesLoading">{{ choicesLoading ? "同步中…" : "查询可用模型" }}</button></div>
        <select class="model-select" v-model="draft.model" required :disabled="!choicesReady"><option value="">{{ choicesReady ? "请选择验证模型" : "先查询模型" }}</option><option v-for="model in modelChoices" :key="model.id" :value="model.name">{{ model.name }}</option></select>
        <div class="choice-bar"><span>验证数据集 <em>已选 {{ draft.datasets.length }} 个</em></span></div>
        <div class="dataset-pool"><label v-for="dataset in datasetChoices" :key="dataset.id" :class="{ selected: draft.datasets.includes(dataset.name) }"><input type="checkbox" :value="dataset.name" v-model="draft.datasets" /><span>{{ dataset.name }}</span><small>{{ dataset.imageCount ?? "—" }} 张</small></label><p v-if="choicesReady && !datasetChoices.length">暂无匹配数据集</p></div>
        <p v-if="actionError" class="ws-error-text">{{ actionError }}</p>
        <div class="create-footer"><span><i></i> 任务提交后由后台异步执行</span><button class="validation-create" :disabled="busy || !choicesReady || !draft.model || !draft.datasets.length">{{ busy ? "提交中…" : "开始模型验证" }}</button></div>
      </form>
    </WorkspaceModal>
  </div>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { api, post, userId, pageData, types, cameras, timeText } from "./api";
import { useResource } from "./useResource";
import ResourceState from "./components/ResourceState.vue";
import Pager from "./components/Pager.vue";
import WorkspaceModal from "./components/WorkspaceModal.vue";
const router = useRouter(), brands = ["黄山(金皖烟)", "黄山(新制皖烟)"], filters = reactive({ brand: brands[0], type: types[0], camera: "camera0" }), applied = ref({ ...filters }), items = ref([]), total = ref(0), page = ref(1), busy = ref(false), creating = ref(false), choicesLoading = ref(false), choicesReady = ref(false), modelChoices = ref([]), datasetChoices = ref([]), actionError = ref(""), updated = ref(""), timer = ref(null), failures = ref(0);
const { loading, error, run } = useResource();
const draft = reactive({ name: "", brand: brands[0], type: types[0], camera: cameras[0], model: "", datasets: [] });
const completed = computed(() => items.value.filter(isDone).length), running = computed(() => items.value.filter((item) => !isDone(item)).length);
function isDone(item) { return item.valimsg === "验证完毕"; }
function statusClass(item) { return isDone(item) ? "done" : item.valimsg === "验证失败" ? "failed" : "running"; }
function progressOf(item) { return isDone(item) ? 100 : item.valimsg === "验证失败" ? 0 : item.valimsg === "验证中" ? 62 : 12; }
async function load() { clearTimeout(timer.value); const params = { Userid: userId(), Brand: applied.value.brand, Type: applied.value.type, Camera: applied.value.camera, page: page.value, pageSize: 20 }; const result = await run(async () => pageData(await api("/api/Model/modelvalinfo", { params }), page.value, 20), (data) => { items.value = data.items; total.value = data.total; updated.value = new Date().toLocaleTimeString("zh-CN"); }); schedule(); return result; }
function schedule() { clearTimeout(timer.value); if (!document.hidden) timer.value = setTimeout(load, 10000); }
function search() { applied.value = { ...filters }; page.value = 1; items.value = []; load(); }
function changePage(value) { page.value = value; load(); }
function openResult(item) { if (!isDone(item)) return; router.push({ name: "workspace-images", params: { kind: "validation", id: item.id }, query: { name: item.name, brand: item.brand, type: item.type, camera: item.camera } }); }
async function remove(item) { try { await ElMessageBox.confirm(`删除“${item.name}”？验证图片和结果也会被清理。`, "删除验证任务", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消", confirmButtonClass: "danger-confirm" }); } catch { return; } busy.value = true; try { await api(`/api/Model/deletemodelvali/${item.id}`, { method: "DELETE" }); await load(); ElMessage.success("验证任务已删除"); } catch (e) { ElMessage.error(e.message); } finally { busy.value = false; } }
function openCreate() { Object.assign(draft, { name: `vali_${Date.now()}`, brand: filters.brand, type: filters.type, camera: filters.camera === "全部" ? cameras[0] : filters.camera, model: "", datasets: [] }); modelChoices.value = []; datasetChoices.value = []; choicesReady.value = false; actionError.value = ""; creating.value = true; }
async function loadChoices() { choicesLoading.value = true; choicesReady.value = false; actionError.value = ""; try { const params = { UserId: userId(), Userid: userId(), Brand: draft.brand, Type: draft.type, Camera: draft.camera, page: 1, pageSize: 100 }; const [datasets, models] = await Promise.all([api("/api/BrandCamera/user-datasets", { params }), api("/api/Model/modelinfo", { params })]); datasetChoices.value = pageData(datasets, 1, 100).items; modelChoices.value = pageData(models, 1, 100).items; choicesReady.value = true; } catch (e) { actionError.value = e.message; } finally { choicesLoading.value = false; } }
async function createTask() { if (busy.value || !choicesReady.value) return; busy.value = true; actionError.value = ""; try { await api(`/api/Consult/valiexist/${encodeURIComponent(draft.name)}`); await post("/api/Model/createmodelvali", { name: draft.name, userid: userId(), model: draft.model, datasets: [...draft.datasets], brand: draft.brand, type: draft.type, camera: draft.camera }); creating.value = false; Object.assign(filters, { brand: draft.brand, type: draft.type, camera: draft.camera }); applied.value = { ...filters }; page.value = 1; await load(); ElMessage.success("验证任务已提交"); } catch (e) { actionError.value = e.message; } finally { busy.value = false; } }
function visibility() { if (!document.hidden) load(); }
onMounted(() => { load(); document.addEventListener("visibilitychange", visibility); }); onBeforeUnmount(() => { clearTimeout(timer.value); document.removeEventListener("visibilitychange", visibility); });
</script>
<style scoped>
.validation-page { --v-cyan:#57ddff; --v-blue:#0b2a43; --v-gold:#f1c56e; padding-bottom:16px; }
.validation-hero { display:flex; justify-content:space-between; align-items:flex-end; padding:4px 0 20px; }
.validation-hero h1 { margin:6px 0 4px; font-size:32px; letter-spacing:.08em; color:#effbff; text-shadow:0 0 24px #4adfff55; }
.validation-hero p { margin:0; color:#87a8ba; font-size:13px; }
.validation-create { border:1px solid #55dfff99; border-radius:9px; padding:11px 18px; color:#052339; background:linear-gradient(120deg,#6aeaff,#29acd9); box-shadow:0 0 22px #3bd6ff33; font-weight:700; cursor:pointer; }
.validation-filters { display:flex; align-items:flex-end; gap:12px; padding:14px 16px; border:1px solid #2e6680; border-radius:13px; background:linear-gradient(120deg,#0b2e47cc,#071b30cc); box-shadow:inset 0 1px #ffffff0d,0 12px 30px #0003; }
.validation-filters label { min-width:175px; color:#9fc1d0; font-size:12px; }.validation-filters select { margin-top:6px; width:100%; }
.filter-submit { height:39px; padding:0 22px; border:1px solid #4fd9ff88; border-radius:7px; color:#dffaff; background:#0a5473; font-weight:700; }
.validation-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:16px 0; }.validation-stats>div { position:relative; overflow:hidden; padding:14px 17px; border:1px solid #2b5d76; border-radius:12px; background:linear-gradient(145deg,#0c3049,#071d32); }.validation-stats>div::after { content:""; position:absolute; right:-25px; top:-32px; width:90px; height:90px; border:1px solid #55dfff2b; border-radius:50%; box-shadow:0 0 22px #55dfff1a; }.validation-stats small,.validation-stats span { display:block; color:#7fa5b7; font-size:11px; }.validation-stats strong { display:block; margin:4px 0; color:#f2fbff; font:28px "DIN-Bold",sans-serif; }.validation-stats .cyan { color:var(--v-cyan); }.validation-stats .gold { color:var(--v-gold); }.validation-stats .time { font-size:20px; }
.validation-board { padding:20px; border:1px solid #2b6680; border-radius:16px; background:radial-gradient(circle at 85% 0,#164a5e55,transparent 28%),#061a2c; box-shadow:inset 0 1px #ffffff0b,0 18px 45px #0003; }.board-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }.board-kicker { color:#58d8f4; font:10px monospace; letter-spacing:.18em; }.board-header h2 { margin:4px 0 0; color:#e6faff; font-size:20px; }.live-dot { color:#8bb4c2; font:10px monospace; }.live-dot i { display:inline-block; width:7px; height:7px; margin-right:6px; border-radius:50%; background:#4fe1dc; box-shadow:0 0 12px #4fe1dc; }
.validation-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
.validation-card { position:relative; min-width:0; min-height:230px; overflow:hidden; padding:18px 20px 15px; border:1px solid #285d76; border-radius:15px; background:radial-gradient(ellipse at 88% 48%,#16718922,transparent 34%),linear-gradient(145deg,#0d3049,#071b30 72%); box-shadow:inset 0 1px #ffffff0b,0 12px 26px #0002; transition:transform .25s,border-color .25s,box-shadow .25s; cursor:default; }
.validation-card::before { content:""; position:absolute; inset:0 auto 0 0; width:3px; background:linear-gradient(180deg,#47d9fa,#5288b8); opacity:.75; }
.validation-card::after { content:""; position:absolute; right:-46px; top:30px; width:160px; height:160px; border:1px solid #4edcf51c; border-radius:50%; box-shadow:0 0 34px #4edcf50b,inset 0 0 28px #4edcf50b; pointer-events:none; }
.validation-card:hover { transform:translateY(-4px); border-color:#59dfff; box-shadow:0 18px 34px #0004,0 0 28px #42d9ff1b; }
.validation-card.done::before { background:linear-gradient(180deg,#67f0df,#28b9d4); }
.validation-card.failed::before { background:linear-gradient(180deg,#ffab7d,#ed5265); }
.validation-card-top,.validation-card-content,.validation-card-bottom { position:relative; z-index:1; }
.validation-card-top { display:flex; align-items:center; justify-content:space-between; }
.task-chip { display:inline-flex; align-items:center; gap:7px; padding:5px 9px; border:1px solid #4cbcd344; border-radius:99px; color:#e7c97d; background:#b28c2412; font-size:10px; }
.task-chip i { width:6px; height:6px; border-radius:50%; background:#ecc563; box-shadow:0 0 9px currentColor; }
.validation-card.done .task-chip { color:#68e6dc; border-color:#58ded044; background:#20b9ad12; }.validation-card.done .task-chip i { background:#56e3d7; }
.validation-card.failed .task-chip { color:#ff948b; border-color:#f27c7744; background:#ee535312; }.validation-card.failed .task-chip i { background:#ff7d70; }
.delete-button { width:29px; height:29px; padding:0; border:1px solid #e37e6b44; border-radius:50%; color:#d88c86; background:#aa423014; font-size:18px; line-height:1; cursor:pointer; }.delete-button:hover { color:#fff; border-color:#ff8277; background:#bd3d43; }
.validation-card-content { display:flex; justify-content:space-between; align-items:center; gap:18px; padding:13px 0 14px; }
.validation-card-info { min-width:0; }.task-id { color:#52cde9; font:9px monospace; letter-spacing:.14em; }.validation-card h3 { margin:7px 0 6px; overflow:hidden; color:#edfbff; font-size:17px; text-overflow:ellipsis; white-space:nowrap; }.task-context { margin:0; color:#82a9ba; font-size:11px; }.task-context b { padding:0 3px; color:#4ebed3; font-weight:400; }
.model-chip { display:flex; align-items:baseline; gap:8px; max-width:100%; margin-top:14px; }.model-chip small { flex:0 0 auto; margin:0; color:#648ca0; font-size:10px; }.model-chip strong { overflow:hidden; color:#b9d9e3; font-size:11px; font-weight:500; text-overflow:ellipsis; white-space:nowrap; }
.progress-orb { position:relative; z-index:1; display:grid; flex:0 0 86px; width:86px; height:86px; place-items:center; border-radius:50%; background:conic-gradient(#5addeb var(--progress),#1a3d52 var(--progress)); box-shadow:0 0 22px #39bcd322; }
.progress-orb::before { content:""; position:absolute; inset:5px; border:1px solid #72dff330; border-radius:50%; background:radial-gradient(circle at 40% 30%,#12354a,#071827); }.progress-orb>div { position:relative; display:flex; align-items:center; flex-direction:column; }.progress-orb strong { color:#e9fbff; font:22px "DIN-Bold",sans-serif; }.progress-orb strong small { display:inline; color:#72ddeb; font-size:10px; }.progress-orb span { margin-top:2px; color:#83aebe; font-size:9px; }.progress-orb.done { background:conic-gradient(#63e4d5 var(--progress),#1a3d52 var(--progress)); box-shadow:0 0 24px #41dac322; }.progress-orb.failed { background:conic-gradient(#f07875 var(--progress),#1a3d52 var(--progress)); }
.validation-card-bottom { display:flex; align-items:center; justify-content:space-between; gap:10px; padding-top:12px; border-top:1px solid #38617744; }.validation-card-bottom>span small { display:block; margin-bottom:4px; color:#668a9b; font-size:9px; }.validation-card-bottom>span strong { color:#9bbbc6; font-size:10px; font-weight:500; }.result-button { padding:8px 11px; border:1px solid #4edcf477; border-radius:7px; color:#80eaff; background:linear-gradient(110deg,#0d486455,#0b2b42); font-size:10px; cursor:pointer; transition:.2s; }.result-button:not(:disabled):hover { color:#061e2e; background:linear-gradient(110deg,#7cecff,#43c9e8); box-shadow:0 0 17px #47d8f744; }.result-button:disabled { border-color:#385364; color:#607e8b; background:#132b3b; cursor:not-allowed; }.result-button b { margin-left:8px; font-size:13px; }
.create-validation-form { min-width:min(700px,76vw); }.create-intro { padding:14px 16px; margin-bottom:15px; border:1px solid #3bcde755; border-radius:10px; background:linear-gradient(100deg,#0c486355,#0d263dcc); }.create-intro span { display:block; color:#63ddff; font:10px monospace; letter-spacing:.18em; }.create-intro strong { display:block; margin-top:6px; color:#eafaff; }.create-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:13px; }.create-grid .wide { grid-column:1/-1; }.create-grid label,.create-validation-form>label { color:#96b8c6; font-size:12px; }.create-grid input,.create-grid select,.model-select { width:100%; margin-top:6px; }.choice-bar { display:flex; justify-content:space-between; align-items:center; margin:17px 0 8px; color:#a7cad5; font-size:12px; }.choice-bar em { margin-left:8px; color:#57ddff; font-style:normal; }.choice-bar button { padding:6px 10px; border:1px solid #48cde777; border-radius:6px; color:#79e9ff; background:#0e4560; font-size:11px; }.dataset-pool { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; max-height:170px; overflow:auto; padding:8px; border:1px solid #295770; border-radius:9px; background:#061a2b; }.dataset-pool label { display:flex; align-items:center; gap:8px; padding:10px; border:1px solid #21475e; border-radius:7px; color:#b6d7e0; font-size:11px; cursor:pointer; }.dataset-pool label.selected { border-color:#4fdfff; background:#0f4e6466; box-shadow:0 0 14px #42d9ff1b; }.dataset-pool small { margin-left:auto; color:#77a5b5; }.dataset-pool p { grid-column:1/-1; color:#7798a9; text-align:center; }.create-footer { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:18px; padding-top:15px; border-top:1px solid #34617455; }.create-footer>span { color:#789cab; font-size:11px; }.create-footer i { display:inline-block; width:6px; height:6px; margin-right:6px; border-radius:50%; background:#edc16b; box-shadow:0 0 9px #edc16b; }
@media(max-width:1000px){.validation-grid{grid-template-columns:1fr}.validation-filters{flex-wrap:wrap}.validation-filters label{flex:1}.create-validation-form{min-width:0}.validation-stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.validation-hero{align-items:flex-start;gap:15px;flex-direction:column}.validation-stats{grid-template-columns:1fr}.dataset-pool,.create-grid{grid-template-columns:1fr}}
</style>
