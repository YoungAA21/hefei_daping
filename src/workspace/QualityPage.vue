<template>
  <div>
    <div class="ws-heading">
      <div>
        <span class="ws-eyebrow">QUALITY INTELLIGENCE</span>
        <h1>质量分析</h1>
        <p>从班次缺陷分布，定位产线质量改善重点</p>
      </div>
      <button :disabled="loading || !!error || !rows.length" @click="exportCsv">
        导出当前分析 ↓
      </button>
    </div>
    <form class="ws-filters" @submit.prevent="load">
      <label
        >产线<input
          v-model.trim="filters.line"
          list="quality-lines"
          required
        /><datalist id="quality-lines">
          <option v-for="line in lines" :key="line">{{ line }}</option>
        </datalist></label
      ><label>日期<input type="date" v-model="filters.date" required /></label
      ><label
        >班次<select v-model="filters.shiftName">
          <option value="">默认班次</option>
          <option v-for="shift in shifts" :key="shift">{{ shift }}</option>
        </select></label
      >
      <div class="spacer"></div>
      <button class="primary" :disabled="loading">分析查询</button>
    </form>
    <ResourceState :loading="loading" :error="error" @retry="load" /><template
      v-if="!error"
      ><div class="ws-summary">
        <article class="ws-stat">
          <small>缺陷检出次数</small
          ><strong>{{ loaded ? sum.toLocaleString() : "—" }}</strong
          ><span>各缺陷类别计数之和</span><em>▥</em>
        </article>
        <article class="ws-stat">
          <small>检出缺陷种类</small
          ><strong>{{
            loaded ? rows.filter((i) => i.value > 0).length : "—"
          }}</strong
          ><span>当前查询范围</span><em>◇</em>
        </article>
        <article class="ws-stat">
          <small>首位缺陷占比</small
          ><strong>{{
            sum ? (((rows[0]?.value || 0) / sum) * 100).toFixed(1) + "%" : "—"
          }}</strong
          ><span>{{ rows[0]?.name || "暂无缺陷" }}</span
          ><em>↗</em>
        </article>
        <article class="ws-stat">
          <small>当前班次</small
          ><strong style="font-size: 24px">{{
            statistics.shiftName || "—"
          }}</strong
          ><span
            >{{ applied.line || "等待查询" }} · {{ applied.date || "—" }}</span
          ><em>◷</em>
        </article>
      </div>
      <div class="ws-panel-heading">
        <h3>缺陷分布总览</h3>
        <small
          >{{ timeText(statistics.startTime) }} 至
          {{ timeText(statistics.endTime) }}</small
        >
      </div>
      <div class="ws-charts">
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>高频缺陷 TOP 10</h3>
            <small>按检出次数排序</small>
          </div>
          <InsightChart :rows="rows.slice(0, 10)" title="高频缺陷" />
        </section>
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>质量等级占比</h3>
            <small>等级统计</small>
          </div>
          <InsightChart :rows="levelRows" kind="donut" title="质量等级分布" />
          <p v-if="levelError" class="ws-error-text">{{ levelError }}</p>
        </section>
      </div>
      <div class="ws-columns">
        <section class="ws-panel">
          <div class="ws-panel-heading">
            <h3>缺陷明细与累计占比</h3>
            <small>{{ rows.length }} 个类别</small>
          </div>
          <ResourceState
            :empty="loaded && !rows.length"
            text="当前班次未检出缺陷"
          />
          <div class="ws-table-wrap">
            <table class="ws-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>缺陷类型</th>
                  <th>检出次数</th>
                  <th>占比</th>
                  <th>累计占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in ranked" :key="row.name">
                  <td>
                    <span class="ws-badge" :class="{ gold: index < 3 }">{{
                      String(index + 1).padStart(2, "0")
                    }}</span>
                  </td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.value.toLocaleString() }}</td>
                  <td>
                    {{ row.percent.toFixed(1) }}%
                    <div class="ws-progress">
                      <i :style="{ width: row.percent + '%' }"></i>
                    </div>
                  </td>
                  <td>{{ row.cumulative.toFixed(1) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <aside>
          <section class="ws-panel">
            <div class="ws-panel-heading"><h3>改善关注</h3></div>
            <div class="focus-ring">
              <strong>{{ rows[0]?.value || 0 }}</strong
              ><span>首位缺陷检出</span>
            </div>
            <h3>{{ rows[0]?.name || "暂无重点缺陷" }}</h3>
            <p class="quality-description">
              {{
                sum
                  ? "优先检查高频缺陷对应的检测点位与工艺环节，结合原图与检测图复核。"
                  : "选择产线、日期与班次，查看真实质量分布。"
              }}
            </p>
            <RouterLink to="/">前往产线查看图片 ↗</RouterLink>
          </section>
          <div class="ws-note">
            统计按缺陷检出次数汇总，同一图片可能包含多个缺陷。检出次数不等同于不合格产品数。
          </div>
        </aside>
      </div></template
    >
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { api, timeText } from "./api";
import { useResource } from "./useResource";
import InsightChart from "./components/InsightChart.vue";
import ResourceState from "./components/ResourceState.vue";
const filters = reactive({
    line: "高4",
    date: new Date().toLocaleDateString("sv-SE"),
    shiftName: "",
  }),
  applied = ref({}),
  lines = ref(["高1", "高2", "高3", "高4", "高5", "高6", "高7", "高8", "高9"]),
  shifts = ref([]),
  statistics = ref({}),
  levels = ref({}),
  loaded = ref(false),
  levelError = ref("");
const { loading, error, run } = useResource();
const rows = computed(() =>
    Object.entries(statistics.value.defects || {})
      .map(([name, value]) => ({ name, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value),
  ),
  sum = computed(() => rows.value.reduce((s, r) => s + r.value, 0)),
  levelRows = computed(() =>
    Object.entries(levels.value.levels || {}).map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    })),
  ),
  ranked = computed(() => {
    let accumulated = 0;
    return rows.value.map((row) => {
      accumulated += row.value;
      return {
        ...row,
        percent: sum.value ? (row.value / sum.value) * 100 : 0,
        cumulative: sum.value ? (accumulated / sum.value) * 100 : 0,
      };
    });
  });
function load() {
  const params = { ...filters };
  if (!params.shiftName) delete params.shiftName;
  loaded.value = false;
  statistics.value = {};
  levels.value = {};
  levelError.value = "";
  return run(
    async () => {
      const results = await Promise.allSettled([
        api("/api/ShiftDefectStatistics/by-line", { params }),
        api("/api/ShiftDefectStatistics/level-counts", { params }),
      ]);
      if (results[0].status === "rejected") throw results[0].reason;
      return results;
    },
    (results) => {
      statistics.value = results[0].value || {};
      if (results[1].status === "fulfilled")
        levels.value = results[1].value || {};
      else levelError.value = results[1].reason.message;
      applied.value = params;
      loaded.value = true;
    },
  );
}
function exportCsv() {
  const quote = (v) =>
    '"' +
    String(v)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const data = [
    ["产线", "日期", "班次", "缺陷", "检出次数", "占比%"],
    ...ranked.value.map((r) => [
      applied.value.line,
      applied.value.date,
      statistics.value.shiftName,
      r.name,
      r.value,
      r.percent.toFixed(2),
    ]),
  ]
    .map((r) => r.map(quote).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + data], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `质量分析_${applied.value.line}_${applied.value.date}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
onMounted(() => {
  load();
  api("/api/ShiftDefectStatistics/shifts")
    .then((data) => (shifts.value = Array.isArray(data) ? data : []))
    .catch(() => {});
  api("/api/Brand/brandinfo")
    .then((data) => {
      if (Array.isArray(data))
        lines.value = [...new Set(data.map((i) => i.line).filter(Boolean))];
    })
    .catch(() => {});
});
</script>
<style scoped>
.focus-ring {
  width: 150px;
  height: 150px;
  border: 9px solid #30596766;
  border-top-color: #70d6c9;
  border-right-color: #eac078;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 18px auto 25px;
  box-shadow: 0 0 35px #64decd12;
}
.focus-ring strong {
  font: 36px "DIN-Bold";
}
.focus-ring span {
  font-size: 10px;
  color: #93acb8;
}
.quality-description {
  font-size: 12px;
  line-height: 1.9;
  color: #84a4b7;
  margin: 12px 0 22px;
}
</style>
