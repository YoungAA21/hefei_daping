<template>
  <aside class="line-insights" aria-label="全部产线班次缺陷统计">
    <header><span class="panel-index">04</span><h2>整体缺陷统计</h2><span class="tag">9 条产线汇总</span></header>
    <div class="filters">
      <label>日期<input type="date" aria-label="统计日期" :value="date || beijingToday()" @change="selectDate($event.target.value)"></label>
      <button type="button" @click="date = ''">今天</button>
      <label>班次<select v-model="shift" aria-label="统计班次"><option value="">{{ historical ? '默认班次' : '当前班次' }}</option><option>甲班</option><option>乙班</option></select></label>
    </div>
    <div class="summary"><div><span>班次缺陷总次数</span><strong>{{ total('totalDefectCount') }}</strong></div><div><span>班次总产量</span><strong>{{ total('productionCount') }}</strong></div><span class="coverage">{{ Object.keys(statistics).length }}/9 已返回</span></div>
    <div class="grade-overview">
      <div class="grade-ring" :style="{ background: ringBackground }" role="img" :aria-label="gradeDescription"><div><span>缺陷等级构成</span><strong>{{ hasData ? number(aggregate.total) : '—' }}</strong><small>累计次数</small></div></div>
      <div class="grade-list"><div v-for="grade in visibleGrades" :key="grade" :class="`grade-${grade}`"><span><i></i>{{ grade === 'other' ? '未分级' : grade + '级' }}</span><strong>{{ hasData ? number(aggregate.counts[grade]) : '—' }}<small> 次</small></strong><em>{{ hasData ? percent(aggregate.counts[grade]) : '—' }}</em></div></div>
    </div>
    <div class="ranking-heading"><h3>缺陷类型排行</h3><span>按名称汇总 · 数量降序</span></div>
    <div class="ranking-chart"><StatisticsChart v-if="aggregate.defects.length" :rows="aggregate.defects" /><div v-else class="empty-state">{{ loading && !hasData ? '正在读取缺陷统计…' : hasData ? '本班次暂无缺陷' : '暂时无法获取统计数据' }}</div></div>
    <div class="request-state" role="status" :class="{ error: failures.length }">{{ loading ? '正在更新…' : failures.length ? `${failures.length} 条产线获取失败 · 15 秒后重试` : `更新于 ${updatedAt || '—'} · 15 秒刷新` }}</div>
    <footer><span>{{ failures.length ? '仅汇总已返回的产线' : '同图多缺陷分别计数' }}</span><span>滚动查看全部缺陷类型</span></footer>
  </aside>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { getShiftDefectStatistics } from '@/api/api/LargeScreenData';
import StatisticsChart from './StatisticsChart.vue';
import { aggregateDefects } from './defectMetrics';
import { normalizeScore } from './scoreMetrics';
const emit = defineEmits(['statistics-change']);
const lines = Array.from({ length: 9 }, (_, i) => `高${i + 1}`);
const grades = ['X', 'A', 'B', 'C'];
const colors = { X: '#ff7588', A: '#ffad69', B: '#ffcf69', C: '#65e6ff', other: '#89b9d2' };
const shift = ref(''), date = ref(''), statistics = ref({}), failures = ref([]), loading = ref(false), updatedAt = ref('');
const beijingToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const historical = computed(() => !!date.value && date.value !== beijingToday());
function selectDate(value) { date.value = !value || value === beijingToday() ? '' : value; }
const number = value => value == null ? '—' : Number(value).toLocaleString('zh-CN');
const total = key => { const data = Object.values(statistics.value); return data.length ? number(data.reduce((sum, item) => sum + (item[key] ?? 0), 0)) : '—'; };
const hasData = computed(() => Object.keys(statistics.value).length > 0);
const aggregate = computed(() => aggregateDefects(Object.values(statistics.value)));
const visibleGrades = computed(() => aggregate.value.counts.other ? [...grades, 'other'] : grades);
const percent = value => aggregate.value.total ? `${(value / aggregate.value.total * 100).toFixed(1)}%` : '0.0%';
const gradeDescription = computed(() => visibleGrades.value.map(grade => `${grade}：${hasData.value ? aggregate.value.counts[grade] : '暂无数据'}`).join('；'));
const ringBackground = computed(() => {
  if (!aggregate.value.total) return '#65d5ff18';
  let start = 0;
  return `conic-gradient(${visibleGrades.value.map(grade => { const end = start + aggregate.value.counts[grade] / aggregate.value.total * 100; const segment = `${colors[grade]} ${start}% ${end}%`; start = end; return segment; }).join(',')})`;
});
const scores = computed(() => lines.map(name => ({ name, ...normalizeScore(statistics.value[name]), note: failures.value.includes(name) ? '获取失败' : statistics.value[name] ? `${statistics.value[name].date} · ${statistics.value[name].shiftName}` : '等待数据' })));
watch([scores, date, shift], () => emit('statistics-change', { rows: scores.value, context: `${date.value || beijingToday()} · ${shift.value || (historical.value ? '默认班次' : '当前班次')}` }), { immediate: true });
let timer, controller, generation = 0;
async function refresh() {
  controller?.abort();
  controller = new AbortController();
  const current = ++generation, requestedShift = shift.value, requestedDate = date.value, signal = controller.signal;
  loading.value = true;
  const results = await Promise.allSettled(lines.map(async line => {
    const response = await getShiftDefectStatistics({ line, ...(requestedDate ? { date: requestedDate } : {}), ...(requestedShift ? { shiftName: requestedShift } : {}) }, signal);
    if (response?.status !== 200 || !response.data) throw new Error(response?.message || '获取失败');
    return response.data;
  }));
  if (current !== generation) return;
  const next = {}, failed = [];
  results.forEach((result, i) => { if (result.status === 'fulfilled') next[lines[i]] = result.value; else failed.push(lines[i]); });
  statistics.value = next; failures.value = failed; loading.value = false;
  updatedAt.value = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
  timer = setTimeout(refresh, 15000);
}
watch([date, shift], () => { clearTimeout(timer); statistics.value = {}; failures.value = []; refresh(); });
onMounted(refresh);
onBeforeUnmount(() => { ++generation; clearTimeout(timer); controller?.abort(); });
</script>

<style scoped>
.line-insights { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: 0 14PX; border: 1PX solid #65d5ff44; border-radius: 5PX; color: #d8eeff; background: radial-gradient(ellipse at top left, #0e739b26, transparent 65%), linear-gradient(145deg, #05192ef0, #030c1bf5); }
header { display: flex; align-items: center; gap: 9PX; height: 38PX; flex-shrink: 0; border-bottom: 1PX solid #65d5ff22; }
h2 { margin: 0; font-size: clamp(12PX, .88vw, 18PX); font-weight: 500; letter-spacing: 1PX; }
.panel-index { color: #65e6ff; font: 14PX DIN-Bold, monospace; }
.tag { margin-left: auto; color: #7194ac; font-size: 10PX; }
.filters { display: flex; align-items: center; gap: 7PX; padding: 10PX 0; }
label { display: flex; align-items: center; gap: 5PX; min-width: 0; color: #8aa9be; font-size: 11PX; }
label:first-child { flex: 1.3; } label:last-child { flex: 1; }
select, input, button { box-sizing: border-box; min-width: 0; height: 26PX; padding: 0 5PX; border: 1PX solid #65d5ff44; border-radius: 3PX; background: #09213a; color: #d8eeff; font: inherit; cursor: pointer; }
select, input { flex: 1; width: 100%; } input { color-scheme: dark; } button { font-size: 10PX; color: #65e6ff; }
:focus-visible { outline: 1PX solid #65e6ff; }
.summary { display: flex; align-items: center; gap: 28PX; padding: 2PX 0 10PX; }
.summary > div { display: flex; flex-direction: column; gap: 4PX; }
.summary span { color: #8aa9be; font-size: 10PX; }
.summary strong { font: clamp(18PX, 1.4vw, 28PX) DIN-Bold, monospace; color: #ffcf69; }
.summary > div:nth-child(2) strong { color: #65e6ff; }
.coverage { margin-left: auto; white-space: nowrap; }
.grade-overview { display: flex; align-items: center; gap: 28PX; padding: 12PX 16PX; margin-bottom: 10PX; background: #123c5622; border: 1PX solid #65d5ff18; border-radius: 4PX; }
.grade-ring { width: 104PX; height: 104PX; border-radius: 50%; padding: 8PX; box-sizing: border-box; flex-shrink: 0; box-shadow: 0 0 24PX #65e6ff0a; }
.grade-ring > div { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 50%; background: #07192d; gap: 3PX; }
.grade-ring span, .grade-ring small { font-size: 9PX; color: #7194ac; }
.grade-ring strong { font: 25PX DIN-Bold, monospace; color: #d8eeff; }
.grade-list { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10PX; }
.grade-list > div { display: flex; align-items: center; justify-content: space-between; gap: 8PX; font-size: 11PX; }
.grade-list i { display: inline-block; width: 5PX; height: 5PX; border-radius: 50%; background: currentColor; margin-right: 6PX; }
.grade-list strong { margin-left: auto; font: 16PX DIN-Bold, monospace; }
.grade-list small { font: 9PX Arial, sans-serif; color: #7194ac; }
.grade-list em { width: 46PX; text-align: right; color: #8aa9be; font: 10PX Arial, sans-serif; }
.ranking-heading { display: flex; justify-content: space-between; align-items: center; height: 26PX; flex-shrink: 0; }
h3 { margin: 0; color: #bbd8e8; font-size: 12PX; font-weight: 500; }
.ranking-heading span { font-size: 10PX; color: #7194ac; }
.ranking-chart { flex: 1; min-height: 0; }
.empty-state { display: grid; place-items: center; height: 100%; color: #7194ac; font-size: 12PX; }
.grade-X { color: #ff7588; } .grade-A { color: #ffad69; } .grade-B { color: #ffcf69; } .grade-C { color: #65e6ff; } .grade-other { color: #89b9d2; }
.request-state { font-size: 10PX; color: #7194ac; padding: 8PX 0; } .error { color: #ffad69; }
footer { display: flex; justify-content: space-between; height: 25PX; align-items: center; border-top: 1PX solid #65d5ff18; color: #7194ac; font-size: 9PX; flex-shrink: 0; }
@media (max-height: 850PX) { header { height: 31PX; } .filters { padding: 7PX 0; } .summary { padding-bottom: 7PX; gap: 16PX; } .grade-overview { padding: 7PX 12PX; gap: 18PX; margin-bottom: 6PX; } .grade-ring { width: 80PX; height: 80PX; padding: 6PX; } .grade-ring strong { font-size: 21PX; } .grade-list { gap: 6PX; } .grade-list strong { font-size: 14PX; } .request-state { padding: 6PX 0; } footer { height: 21PX; } }
@media (max-width: 1400PX) { .line-insights { padding: 0 10PX; } .filters { flex-wrap: wrap; } .summary { gap: 12PX; } .coverage { font-size: 9PX; } }
</style>
