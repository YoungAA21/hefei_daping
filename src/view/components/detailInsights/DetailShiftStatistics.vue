<template>
  <article class="shift-statistics" aria-label="当前产线缺陷分类统计">
    <header><span class="index">03</span><h2>缺陷分类统计</h2><span class="line-tag">{{ apiLine ? apiLine + '产线' : '未指定产线' }}</span></header>
    <div class="controls">
      <label>日期<input type="date" aria-label="详情统计日期" :value="date || today()" @change="date = $event.target.value === today() ? '' : $event.target.value"></label>
      <label>班次<select v-model="shift" aria-label="详情统计班次"><option value="">{{ date && date !== today() ? '默认班次' : '当前班次' }}</option><option>甲班</option><option>乙班</option></select></label>
      <span class="stat-total">缺陷 <b>{{ number(statistics?.totalDefectCount) }}</b> 次</span><span class="stat-total">班次产量 <b>{{ number(statistics?.productionCount) }}</b></span>
    </div>
    <div class="statistics-body">
      <div class="classification"><div class="grade-legend"><span v-for="grade in grades" :key="grade" :class="`grade-${grade}`"><i></i>{{ grade }}级 {{ statistics ? aggregate.counts[grade] : '—' }}</span></div><div class="defect-chart"><StatisticsChart v-if="aggregate.defects.length" :rows="aggregate.defects" /><div v-else class="empty-state">{{ loading && !statistics ? '正在读取缺陷统计…' : error ? '暂时无法获取缺陷统计' : statistics ? '本班次暂无缺陷' : '等待产线数据' }}</div></div></div>
    </div>
    <footer><span :class="{ error }" role="status">{{ error || (statistics ? `${statistics.date} · ${statistics.shiftName} · 15 秒刷新` : loading ? '正在读取班次数据…' : '等待产线数据') }}</span><span>班次产量 ≥ 1000 后评分</span></footer>
  </article>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { getShiftDefectStatistics } from '@/api/api/LargeScreenData';
import StatisticsChart from '../lineDefectInsights/StatisticsChart.vue';
import { aggregateDefects } from '../lineDefectInsights/defectMetrics';
const emit = defineEmits(['statistics-change']);
const props = defineProps({ line: { type: String, default: '' } });
const apiLine = computed(() => { const raw = String(props.line || '').trim(); const matched = raw.match(/^(?:gao|高)\s*(\d+)(?:产线)?$/i); return matched ? `高${matched[1]}` : raw; });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const date = ref(''), shift = ref(''), statistics = ref(null), error = ref(''), loading = ref(false);
const grades = ['X', 'A', 'B', 'C'];
const aggregate = computed(() => aggregateDefects(statistics.value ? [statistics.value] : []));
watch(statistics, value => emit('statistics-change', value), { immediate: true });
const number = value => value == null ? '—' : Number(value).toLocaleString('zh-CN');
let timer, controller, generation = 0;
async function refresh() {
  clearTimeout(timer); controller?.abort(); const current = ++generation;
  if (!apiLine.value) { loading.value = false; return; }
  controller = new AbortController(); loading.value = true; error.value = '';
  try {
    const result = await getShiftDefectStatistics({ line: apiLine.value, ...(date.value ? { date: date.value } : {}), ...(shift.value ? { shiftName: shift.value } : {}) }, controller.signal);
    if (current !== generation) return;
    if (result?.status !== 200 || !result.data) throw new Error(result?.message || '获取班次统计失败');
    statistics.value = result.data;
  } catch (cause) {
    if (current !== generation) return;
    statistics.value = null; error.value = '班次统计获取失败，等待重试';
  } finally {
    if (current === generation) { loading.value = false; timer = setTimeout(refresh, 15000); }
  }
}
watch([apiLine, date, shift], () => { statistics.value = null; refresh(); }, { immediate: true });
onBeforeUnmount(() => { ++generation; clearTimeout(timer); controller?.abort(); });
</script>

<style scoped>
.shift-statistics { display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; padding: 0 14PX; border: 1PX solid #65d5ff45; border-radius: 5PX; background: radial-gradient(ellipse at top left, #0e739d2b, transparent 60%), linear-gradient(145deg, #05192ef0, #030c1bf2); color: #d8eeff; }
header { display: flex; align-items: center; gap: 9PX; height: 38PX; flex-shrink: 0; border-bottom: 1PX solid #65d5ff1c; }
.index { font: 14PX DIN-Bold, monospace; color: #65e6ff; } h2 { font-size: clamp(12PX, .88vw, 18PX); margin: 0; font-weight: 500; letter-spacing: 1PX; }
.line-tag { margin-left: auto; font-size: 11PX; color: #65e6ff; }
.controls { display: flex; align-items: center; gap: 10PX; min-height: 37PX; flex-shrink: 0; }
label { display: flex; align-items: center; gap: 4PX; font-size: 10PX; color: #8aa9be; }
input, select { min-width: 0; height: 24PX; padding: 0 4PX; background: #09213a; border: 1PX solid #65d5ff44; border-radius: 3PX; color: #d8eeff; font: inherit; color-scheme: dark; }
input { width: 119PX; } select { width: 83PX; }
.stat-total { font-size: 10PX; color: #8aa9be; white-space: nowrap; margin-left: auto; }
.stat-total b { color: #ffcf69; font: 17PX DIN-Bold, monospace; margin: 0 4PX; }
.stat-total:last-child { margin-left: 0; } .stat-total:last-child b { color: #65e6ff; }
.statistics-body { display: grid; grid-template-columns: minmax(0, 1fr); flex: 1; min-height: 0; padding-bottom: 6PX; }
.classification { display: flex; flex-direction: column; min-height: 0; min-width: 0; }
.grade-legend { display: flex; gap: 14PX; height: 20PX; align-items: center; flex-shrink: 0; font-size: 9PX; }
.grade-legend i { display: inline-block; width: 4PX; height: 4PX; background: currentColor; border-radius: 50%; margin-right: 4PX; }
.grade-X { color: #ff7588; } .grade-A { color: #ffad69; } .grade-B { color: #ffcf69; } .grade-C { color: #65e6ff; }
.defect-chart { flex: 1; min-height: 0; } .machine-score { min-height: 0; }
.empty-state { height: 100%; display: grid; place-items: center; font-size: 11PX; color: #7194ac; }
footer { display: flex; justify-content: space-between; align-items: center; gap: 8PX; height: 24PX; flex-shrink: 0; border-top: 1PX solid #65d5ff12; color: #7194ac; font-size: 10PX; white-space: nowrap; }
.error { color: #ffad69; }
@media (max-width: 1400PX) { .shift-statistics { padding: 0 10PX; } .controls { gap: 6PX; } .stat-total b { font-size: 14PX; margin: 0 2PX; } label { font-size: 9PX; } input { width: 104PX; } select { width: 75PX; } .grade-legend { gap: 9PX; } footer { font-size: 9PX; } }
@media (max-height: 850PX) { header { height: 31PX; } footer { height: 21PX; } .controls { min-height: 32PX; } }
</style>
