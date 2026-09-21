<template>
  <div>
    <div class="ws-heading">
      <div>
        <span class="ws-eyebrow">MODEL LIFECYCLE MANAGEMENT</span>
        <h1>模型管理</h1>
        <p>从样本训练到效果验证，跟踪模型全生命周期</p>
      </div>
      <div class="heading-actions">
        <button @click="openTask('train')">＋ 创建训练</button
        ><button class="primary" @click="openTask('validation')">
          ＋ 创建验证
        </button>
      </div>
    </div>
    <div class="ws-tabs">
      <button
        v-for="item in tabs"
        :key="item.key"
        :class="{ active: tab === item.key }"
        @click="switchTab(item.key)"
      >
        {{ item.name }}
      </button>
    </div>
    <div class="ws-summary">
      <article class="ws-stat">
        <small>{{ tabs.find((i) => i.key === tab).name }}总量</small
        ><strong>{{ total }}</strong
        ><span>当前筛选条件</span><em>⬡</em>
      </article>
      <article class="ws-stat">
        <small>相机覆盖</small
        ><strong>{{ new Set(items.map((i) => i.camera)).size }}</strong
        ><span>当前页</span><em>◎</em>
      </article>
      <article class="ws-stat">
        <small>{{ tab === "library" ? "已验证模型" : "已完成任务" }}</small
        ><strong>{{ items.filter(isComplete).length }}</strong
        ><span>当前页</span><em>✓</em>
      </article>
      <article class="ws-stat">
        <small>最近同步</small
        ><strong style="font-size: 24px">{{ updated || "—" }}</strong
        ><span>{{ tab === "library" ? "手动刷新" : "页面可见时自动更新" }}</span
        ><em>↻</em>
      </article>
    </div>
    <form class="ws-filters" @submit.prevent="search">
      <label>品牌<input v-model.trim="filters.brand" required /></label
      ><label
        >检测类型<select v-model="filters.type">
          <option v-for="type in types" :key="type">{{ type }}</option>
        </select></label
      ><label
        >相机<select v-model="filters.camera">
          <option>全部</option>
          <option v-for="camera in cameras" :key="camera">{{ camera }}</option>
        </select></label
      >
      <div class="spacer"></div>
      <button class="primary" :disabled="loading">查询</button>
    </form>
    <div class="ws-columns">
      <section class="ws-panel">
        <div class="ws-panel-heading">
          <h3>{{ tabs.find((i) => i.key === tab).name }}</h3>
          <small>{{
            tab === "library" ? "MODEL REGISTRY" : "TASK MONITOR"
          }}</small>
        </div>
        <ResourceState
          :loading="loading && !items.length"
          :error="error"
          :empty="!items.length"
          @retry="load"
        />
        <div v-if="items.length" class="ws-table-wrap">
          <table class="ws-table">
            <thead>
              <tr>
                <th>模型 / 任务</th>
                <th>相机</th>
                <th>状态</th>
                <th>{{ tab === "library" ? "训练代数" : "创建时间" }}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>
                  <strong>{{ item.name }}</strong
                  ><small style="display: block"
                    >{{ item.brand }} · {{ item.type }}</small
                  ><small v-if="tab === 'library'" style="display: block"
                    >创建者：{{
                      creators[item.userid] || item.username || "—"
                    }}</small
                  >
                </td>
                <td>{{ item.camera }}</td>
                <td>
                  <span class="ws-badge" :class="{ gold: !isComplete(item) }">{{
                    statusOf(item)
                  }}</span>
                  <div
                    v-if="
                      tab === 'train' &&
                      Number.isFinite(Number(item.progress)) &&
                      item.progress != null
                    "
                    class="ws-progress"
                  >
                    <i
                      :style="{
                        width:
                          Math.max(0, Math.min(100, Number(item.progress))) +
                          '%',
                      }"
                    ></i>
                  </div>
                </td>
                <td>
                  {{
                    tab === "library"
                      ? (item.generation ?? "—")
                      : timeText(item.createtime)
                  }}
                </td>
                <td class="actions">
                  <template v-if="tab === 'library'"
                    ><button @click="openParams(item)">参数 / 下发</button
                    ><button @click="viewImages(item, 'train')">
                      样本
                    </button></template
                  ><button
                    v-if="tab === 'validation'"
                    :disabled="item.valimsg !== '验证完毕'"
                    @click="viewImages(item, 'validation')"
                  >
                    查看结果</button
                  ><button
                    v-if="tab !== 'train' || isFailed(item)"
                    class="danger"
                    :disabled="busy"
                    @click="remove(item)"
                  >
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pager
          :total="total"
          :page="page"
          :disabled="loading"
          @change="changePage"
        />
      </section>
      <aside>
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>状态分布</h3>
            <small>当前页</small>
          </div>
          <InsightChart
            :rows="countBy(items, statusOf)"
            kind="donut"
            title="模型任务状态"
          />
        </section>
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>相机覆盖</h3>
            <small>当前页</small>
          </div>
          <InsightChart :rows="countBy(items, 'camera')" title="模型相机分布" />
        </section>
      </aside>
    </div>
    <WorkspaceModal
      v-if="creating"
      :title="taskKind === 'train' ? '创建模型训练' : '创建模型验证'"
      :busy="busy"
      @close="creating = false"
      ><form class="ws-form" @submit.prevent="createTask">
        <div class="ws-form-grid">
          <label
            >任务名称<input
              v-model.trim="task.name"
              required
              maxlength="100"
              pattern="[^\\/]+" /></label
          ><label>品牌<input v-model.trim="task.brand" required /></label
          ><label
            >检测类型<select v-model="task.type">
              <option v-for="type in types" :key="type">{{ type }}</option>
            </select></label
          ><label
            >相机<select v-model="task.camera">
              <option v-for="camera in cameras" :key="camera">
                {{ camera }}
              </option>
            </select></label
          ><template v-if="taskKind === 'train'"
            ><label
              >训练代数<input
                type="number"
                v-model.number="task.epochs"
                min="1"
                max="10000"
                required /></label
            ><label
              >批次大小<input
                type="number"
                v-model.number="task.batchsize"
                min="1"
                max="1024"
                required /></label
          ></template>
        </div>
        <div class="ws-panel-heading">
          <h3>选择数据集{{ taskKind === "validation" ? "与模型" : "" }}</h3>
          <button
            type="button"
            @click="refreshChoices"
            :disabled="choicesLoading"
          >
            {{ choicesLoading ? "加载中…" : "按以上条件加载" }}
          </button>
        </div>
        <p class="ws-note">
          选择与任务相同品牌、类型、相机的数据集。修改条件后需要重新加载候选项。
        </p>
        <template v-if="choicesMatch"
          ><template v-if="taskKind === 'validation'"
            ><label
              >验证模型<select v-model="task.model" required>
                <option value="">请选择模型</option>
                <option
                  v-for="model in modelChoices"
                  :key="model.id"
                  :value="model.name"
                >
                  {{ model.name }}
                </option>
              </select></label
            ><Pager
              :page="modelPage"
              :total="modelTotal"
              :disabled="choicesLoading"
              @change="changeModelPage"
          /></template>
          <div class="ws-checkbox-list">
            <label v-for="dataset in datasetChoices" :key="dataset.id"
              ><input
                type="checkbox"
                :value="dataset.name"
                v-model="task.datasets"
              />{{ dataset.name }}
              <small>{{ dataset.imageCount ?? "—" }} 张</small></label
            ><small v-if="!datasetChoices.length">暂无可选数据集</small>
          </div>
          <Pager
            :page="datasetPage"
            :total="datasetTotal"
            :disabled="choicesLoading"
            @change="changeDatasetPage"
          /><small>已选 {{ task.datasets.length }} 个数据集</small></template
        >
        <p v-if="actionError" class="ws-error-text">{{ actionError }}</p>
        <div class="ws-form-footer">
          <button type="button" :disabled="busy" @click="creating = false">
            取消</button
          ><button
            class="primary"
            :disabled="
              busy || choicesLoading || !choicesMatch || !task.datasets.length
            "
          >
            {{ busy ? "正在提交…" : "提交任务" }}
          </button>
        </div>
      </form></WorkspaceModal
    >
    <WorkspaceModal
      v-if="paramModel"
      title="模型参数与下发"
      :busy="busy"
      @close="paramModel = null"
      ><div class="ws-form">
        <h3>{{ paramModel.name }}</h3>
        <p class="muted">
          {{ paramModel.brand }} · {{ paramModel.type }} ·
          {{ paramModel.camera }}
        </p>
        <ResourceState
          :loading="paramsLoading"
          :error="paramError"
          @retry="openParams(paramModel)"
        />
        <form
          v-if="paramRows.length && !paramError && !paramsLoading"
          @submit.prevent="saveParams"
        >
          <div class="ws-table-wrap">
            <table class="ws-table">
              <thead>
                <tr>
                  <th>缺陷</th>
                  <th>最少数量</th>
                  <th>最多数量</th>
                  <th>置信度阈值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paramRows" :key="row.name">
                  <td>{{ row.name }}</td>
                  <td>
                    <input
                      v-model.number="row.minNum"
                      type="number"
                      min="0"
                      step="1"
                      required
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="row.maxNum"
                      type="number"
                      :min="row.minNum"
                      step="1"
                      required
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="row.score"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      required
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="ws-form-footer">
            <button class="primary" :disabled="busy">保存参数</button>
          </div>
        </form>
        <p class="ws-error-text" v-if="actionError">{{ actionError }}</p>
        <div class="ws-note">
          设备下发通道等待服务端版本核对。设备回执接入后，才能确认模型已生效。
        </div>
        <button disabled>下发到产线 · 待接通设备回执</button>
      </div></WorkspaceModal
    >
  </div>
</template>
<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import { useRouter } from "vue-router";
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
const router = useRouter(),
  tabs = [
    { key: "library", name: "模型库" },
    { key: "train", name: "训练任务" },
    { key: "validation", name: "验证任务" },
  ],
  tab = ref("library"),
  items = ref([]),
  total = ref(0),
  page = ref(1),
  busy = ref(false),
  creators = reactive({}),
  filters = reactive({ brand: "黄山(金皖烟)", type: "商标纸", camera: "全部" });
let applied = { ...filters },
  timer,
  disposed = false,
  failures = 0;
const { loading, error, updated, run } = useResource();
const creating = ref(false),
  taskKind = ref("train"),
  task = reactive({}),
  datasetChoices = ref([]),
  modelChoices = ref([]),
  datasetPage = ref(1),
  modelPage = ref(1),
  datasetTotal = ref(0),
  modelTotal = ref(0),
  choicesLoading = ref(false),
  choiceKey = ref(""),
  actionError = ref(""),
  paramModel = ref(null),
  paramRows = ref([]),
  paramsLoading = ref(false),
  paramError = ref("");
let choiceVersion = 0,
  paramVersion = 0;
const taskKey = computed(() => [task.brand, task.type, task.camera].join("|")),
  choicesMatch = computed(() => taskKey.value === choiceKey.value);
watch(taskKey, () => {
  task.datasets = [];
  task.model = "";
  choiceKey.value = "";
  choicesLoading.value = false;
  choiceVersion++;
});
function statusOf(item) {
  return tab.value === "library"
    ? Number(item.validate) === 1
      ? "已验证"
      : "待验证"
    : tab.value === "train"
      ? item.trainmsg || "等待中"
      : item.valimsg || "等待中";
}
function isComplete(item) {
  return tab.value === "library"
    ? Number(item.validate) === 1
    : tab.value === "train"
      ? item.trainmsg === "训练完成"
      : item.valimsg === "验证完毕";
}
function isFailed(item) {
  return (
    !!item.trainmsg && !["等待中", "训练中", "训练完成"].includes(item.trainmsg)
  );
}
async function load() {
  clearTimeout(timer);
  const current = tab.value,
    p = page.value,
    f = { ...applied };
  const ok = await run(
    async () => {
      const params = {
        Userid: userId(),
        Brand: f.brand,
        Type: f.type,
        Camera: f.camera,
        page: p,
        pageSize: 20,
      };
      const data = await api(
        `/api/Model/${current === "library" ? "modelinfo" : current === "train" ? "modeltraininfo" : "modelvalinfo"}`,
        {
          params:
            current === "train"
              ? { ...params, uuid: String(userId()) }
              : params,
        },
      );
      return pageData(
        data,
        p,
        20,
        (i) =>
          i.brand === f.brand &&
          i.type === f.type &&
          (f.camera === "全部" || i.camera === f.camera),
      );
    },
    (data) => {
      items.value = data.items;
      total.value = data.total;
      if (current === "library") loadCreators(data.items);
    },
  );
  if (disposed || current !== tab.value) return;
  failures = ok ? 0 : failures + 1;
  if (current !== "library" && !document.hidden)
    timer = setTimeout(
      load,
      Math.min(60000, 10000 * 2 ** Math.min(failures, 3)),
    );
}
async function loadCreators(rows) {
  await Promise.allSettled(
    [...new Set(rows.map((i) => i.userid).filter(Boolean))]
      .filter((id) => !creators[id])
      .map(async (id) => {
        try {
          creators[id] = await api(`/api/Auth/username/${id}`);
        } catch {
          creators[id] = `用户 ${id}`;
        }
      }),
  );
}
function search() {
  applied = { ...filters };
  page.value = 1;
  items.value = [];
  load();
}
function switchTab(key) {
  tab.value = key;
  page.value = 1;
  items.value = [];
  failures = 0;
  load();
}
function changePage(value) {
  page.value = value;
  items.value = [];
  load();
}
function viewImages(item, kind) {
  router.push({
    name: "workspace-images",
    params: { kind, id: item.id },
    query: {
      name: item.name,
      brand: item.brand,
      type: item.type,
      camera: item.camera,
    },
  });
}
async function remove(item, force = false) {
  try {
    await ElMessageBox.confirm(
      `删除“${item.name}”？关联图片或模型文件也可能被清理。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  busy.value = true;
  try {
    const route =
      tab.value === "library"
        ? "deletemodel"
        : tab.value === "train"
          ? "deletemodelfail"
          : "deletemodelvali";
    await api(`/api/Model/${route}/${item.id}`, {
      method: "DELETE",
      params: tab.value === "library" ? { force } : undefined,
    });
    if (items.value.length === 1 && page.value > 1) page.value--;
    await load();
    ElMessage.success("已删除");
  } catch (e) {
    if (e.status === 409 && tab.value === "library" && !force) {
      busy.value = false;
      try {
        await ElMessageBox.confirm(
          `模型仍被相机使用：${Array.isArray(e.data) ? e.data.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("、") : "请先核对正在使用该模型的产线"}。强制删除可能影响后续模型加载，是否继续？`,
          "模型正在使用",
          {
            type: "warning",
            confirmButtonText: "强制删除",
            cancelButtonText: "取消",
          },
        );
        await forceDelete(item);
      } catch {}
    } else ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
async function forceDelete(item) {
  busy.value = true;
  try {
    await api(`/api/Model/deletemodel/${item.id}`, {
      method: "DELETE",
      params: { force: true },
    });
    if (items.value.length === 1 && page.value > 1) page.value--;
    await load();
  } catch (e) {
    ElMessage.error(e.message);
  } finally {
    busy.value = false;
  }
}
function openTask(kind) {
  taskKind.value = kind;
  Object.assign(task, {
    name: `${kind === "train" ? "train" : "vali"}_${Date.now()}`,
    brand: filters.brand,
    type: filters.type,
    camera: filters.camera === "全部" ? "camera0" : filters.camera,
    epochs: 120,
    batchsize: 16,
    datasets: [],
    model: "",
  });
  datasetChoices.value = [];
  modelChoices.value = [];
  choiceKey.value = "";
  actionError.value = "";
  creating.value = true;
}
async function refreshChoices() {
  datasetPage.value = 1;
  modelPage.value = 1;
  task.datasets = [];
  task.model = "";
  await loadChoices();
}
async function loadChoices() {
  const version = ++choiceVersion,
    key = taskKey.value;
  choicesLoading.value = true;
  actionError.value = "";
  try {
    const params = {
      UserId: userId(),
      Brand: task.brand,
      Type: task.type,
      Camera: task.camera,
      page: datasetPage.value,
      pageSize: 20,
    };
    const results = await Promise.all([
      api("/api/BrandCamera/user-datasets", { params }),
      taskKind.value === "validation"
        ? api("/api/Model/modelinfo", {
            params: { ...params, Userid: userId(), page: modelPage.value },
          })
        : Promise.resolve({ items: [], totalCount: 0 }),
    ]);
    if (version !== choiceVersion || key !== taskKey.value) return;
    const ds = pageData(results[0], datasetPage.value, 20),
      models = pageData(results[1], modelPage.value, 20);
    datasetChoices.value = ds.items;
    datasetTotal.value = ds.total;
    modelChoices.value = models.items;
    modelTotal.value = models.total;
    choiceKey.value = key;
  } catch (e) {
    if (version === choiceVersion) actionError.value = e.message;
  } finally {
    if (version === choiceVersion) choicesLoading.value = false;
  }
}
function changeDatasetPage(value) {
  datasetPage.value = value;
  loadChoices();
}
function changeModelPage(value) {
  modelPage.value = value;
  loadChoices();
}
async function createTask() {
  if (busy.value || !choicesMatch.value || !task.datasets.length) return;
  busy.value = true;
  actionError.value = "";
  try {
    const training = taskKind.value === "train";
    await api(
      `/api/Consult/${training ? "modelexist" : "valiexist"}/${encodeURIComponent(task.name)}`,
    );
    const body = {
      name: task.name,
      userid: userId(),
      brand: task.brand,
      type: task.type,
      camera: task.camera,
      datasets: [...task.datasets],
    };
    if (training) {
      body.epochs = task.epochs;
      body.batchsize = task.batchsize;
    } else {
      if (!task.model) throw new Error("请选择验证模型");
      body.model = task.model;
    }
    await post(
      `/api/Model/${training ? "createmodel" : "createmodelvali"}`,
      body,
    );
    creating.value = false;
    Object.assign(filters, {
      brand: task.brand,
      type: task.type,
      camera: task.camera,
    });
    applied = { ...filters };
    switchTab(taskKind.value);
    ElMessage.success("任务已提交，等待服务器执行");
  } catch (e) {
    actionError.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function openParams(item) {
  const version = ++paramVersion;
  paramModel.value = item;
  paramRows.value = [];
  paramError.value = "";
  actionError.value = "";
  paramsLoading.value = true;
  try {
    const data = await post("/api/Camera/getcamerainfo", item);
    if (version !== paramVersion) return;
    if (
      !data?.name?.length ||
      !["maxNum", "minNum", "score"].every(
        (key) =>
          Array.isArray(data[key]) && data[key].length === data.name.length,
      )
    )
      throw new Error("相机参数不完整，暂不能编辑");
    paramRows.value = data.name.map((name, index) => ({
      name,
      maxNum: data.maxNum[index],
      minNum: data.minNum[index],
      score: data.score[index],
    }));
  } catch (e) {
    if (version === paramVersion) paramError.value = e.message;
  } finally {
    if (version === paramVersion) paramsLoading.value = false;
  }
}
async function saveParams() {
  if (busy.value) return;
  busy.value = true;
  actionError.value = "";
  try {
    if (
      !paramRows.value.every(
        (r) =>
          Number.isInteger(r.minNum) &&
          r.minNum >= 0 &&
          Number.isInteger(r.maxNum) &&
          r.maxNum >= r.minNum &&
          Number.isFinite(r.score) &&
          r.score >= 0 &&
          r.score <= 1,
      )
    )
      throw new Error("请检查数量范围和置信度阈值");
    const camera = Object.fromEntries(
      ["name", "maxNum", "minNum", "score"].map((key) => [
        key,
        paramRows.value.map((r) => r[key]),
      ]),
    );
    await post("/api/Camera/uploadcamerainfo", {
      model: paramModel.value,
      camera,
    });
    ElMessage.success("模型参数已保存");
  } catch (e) {
    actionError.value = e.message;
  } finally {
    busy.value = false;
  }
}
function visibility() {
  clearTimeout(timer);
  if (!document.hidden && tab.value !== "library") load();
}
onMounted(() => {
  load();
  document.addEventListener("visibilitychange", visibility);
});
onBeforeUnmount(() => {
  disposed = true;
  choiceVersion++;
  paramVersion++;
  clearTimeout(timer);
  document.removeEventListener("visibilitychange", visibility);
});
</script>
