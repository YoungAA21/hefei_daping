<template>
  <section class="detail-insights" aria-label="当前产线分析">
    <article class="panel quality-panel">
      <header><span class="index">01</span><h2>产线质量概览</h2><span class="tag">QUALITY</span></header>
      <div class="quality-body">
        <div class="gauge" :style="{ '--value': `${quality ?? 0}%` }" role="img" :aria-label="`合格率 ${qualityLabel}`">
          <div class="ticks"></div><div class="arc"></div>
          <div class="gauge-label"><span>当前合格率</span><strong>{{ qualityLabel }}<small v-if="quality !== null">%</small></strong><em>PASS RATE</em></div>
        </div>
        <div class="totals">
          <div><span>累计产量</span><strong>{{ formatNumber(production) }}<small>件</small></strong></div>
          <div class="amber"><span>累计剔除</span><strong>{{ formatNumber(rejected) }}<small>件</small></strong></div>
          <div><span>剔除率</span><b>{{ quality === null ? '—' : (100 - quality).toFixed(2) + '%' }}</b></div>
        </div>
      </div>
      <footer><span><i></i>{{ lineName }}</span><span>按当前累计产量计算</span></footer>
    </article>
    <article class="panel point-panel">
      <header><span class="index">02</span><h2>检测点运行状态</h2><span class="tag">POINTS</span></header>
      <div class="point-summary"><span>正常 <b>{{ normalCount }}</b><em>/ {{ points.length }} 点</em></span><span :class="{ amber: faultCount }">异常 {{ faultCount }}<em v-if="unknownCount"> · 未知 {{ unknownCount }}</em></span></div>
      <div v-if="points.length" class="point-grid">
        <div v-for="(point, index) in points" :key="`${point.point}-${index}`" class="point-cell" :class="point.status === true ? 'normal' : point.status === false ? 'fault' : 'unknown'" :title="`${point.point}：${pointStatus(point)}`">
          <span class="point-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div><strong>{{ point.point || '未命名检测点' }}</strong><span><i></i>{{ pointStatus(point) }}</span></div>
          <span class="signal"><i></i><i></i><i></i><i></i></span>
        </div>
      </div>
      <div v-else class="empty">暂无检测点数据<span>等待当前产线接入</span></div>
      <footer><span><i></i>状态来自检测点反馈</span><span>5 秒刷新</span></footer>
    </article>
    <article class="panel history-panel">
      <header><span class="index">03</span><h2>产线实时采样</h2><span class="tag">LIVE RECORDS</span><span class="sample-count">{{ history.length }} / 10</span></header>
      <div class="history-summary"><span>{{ lineName }}<em>最近 10 次采样</em></span><span><i></i>{{ snapshotAt ? `最近更新 ${timeLabel(snapshotAt)}` : '等待实时数据' }}</span></div>
      <div class="table-wrap">
        <table><thead><tr><th>采样时间</th><th>产量 / 件</th><th>剔除 / 件</th><th>合格率</th><th>检测状态</th></tr></thead>
          <tbody><tr v-for="(sample, index) in history" :key="sample.at" :class="{ latest: index === 0 }"><td :title="new Date(sample.at).toLocaleString('zh-CN', { hour12: false })"><span v-if="index === 0" class="latest-dot"></span>{{ timeLabel(sample.at) }}</td><td>{{ formatNumber(sample.production) }}</td><td class="amber">{{ formatNumber(sample.rejected) }}</td><td>{{ sample.quality === null ? '—' : sample.quality.toFixed(2) + '%' }}</td><td :class="{ amber: sample.faults }">{{ sample.faults ? `${sample.faults} 点异常` : sample.unknown || !sample.points ? '状态未知' : '全部正常' }}</td></tr></tbody>
        </table>
        <div v-if="!history.length" class="empty">暂无采样记录<span>接口返回后自动更新</span></div>
      </div>
      <footer><span><i></i>最新记录置顶 · 悬停查看完整时间</span><span>本次页面访问期间的记录</span></footer>
    </article>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { count, formatNumber } from '../productionInsights/lineMetrics';
const props = defineProps({ lineData: { type: Array, default: () => [] }, snapshotAt: { type: Number, default: null } });
const line = computed(() => props.lineData[0]);
const lineName = computed(() => line.value?.line ? String(line.value.line).replace(/^gao(\d+)$/i, '高$1产线') : '当前产线未接入');
const production = computed(() => count(line.value?.production));
const rejected = computed(() => count(line.value?.rejectionrate));
const quality = computed(() => production.value > 0 && rejected.value !== null && rejected.value <= production.value ? (1 - rejected.value / production.value) * 100 : null);
const qualityLabel = computed(() => quality.value === null ? '—' : quality.value.toFixed(2));
const points = computed(() => Array.isArray(line.value?.points) ? line.value.points : []);
const normalCount = computed(() => points.value.filter(point => point.status === true).length);
const faultCount = computed(() => points.value.filter(point => point.status === false).length);
const unknownCount = computed(() => points.value.length - normalCount.value - faultCount.value);
const pointStatus = point => point.status === true ? '运行正常' : point.status === false ? '检测异常' : '状态未知';
const timeLabel = at => new Date(at).toLocaleTimeString('zh-CN', { hour12: false });
const history = ref([]);
const historyLine = ref(line.value?.line);
watch(() => line.value?.line, name => {
  if (name && name !== historyLine.value) { history.value = []; historyLine.value = name; }
});
// Record successful parent polls, including unchanged values, without a second API timer.
watch(() => props.snapshotAt, at => {
  if (!at || !line.value) return;
  history.value = [{ at, production: production.value, rejected: rejected.value, quality: quality.value,
    faults: faultCount.value, unknown: unknownCount.value, points: points.value.length }, ...history.value].slice(0, 10);
}, { immediate: true });
</script>

<style scoped lang="scss">
.detail-insights { display: grid; grid-template-columns: 1fr 1.05fr 1.8fr; gap: 14PX; height: 100%; min-height: 0; color: #d8eeff; --accent: #65e6ff; }
.panel { display: flex; flex-direction: column; position: relative; min-width: 0; min-height: 0; overflow: hidden; padding: 0 14PX; border: 1PX solid #65d5ff45; border-radius: 5PX; background: radial-gradient(ellipse at 10% 0%, #0e739d2b, transparent 60%), linear-gradient(145deg, #05192ef0, #030c1bf2); box-shadow: inset 0 1PX 0 #aae8ff14, 0 8PX 28PX #0004;
  &::before { content: ''; position: absolute; top: 0; left: 14PX; width: 66PX; height: 2PX; background: var(--accent); box-shadow: 0 0 14PX var(--accent); }
  &::after { content: ''; position: absolute; top: 0; right: 0; width: 38PX; height: 16PX; background: repeating-linear-gradient(130deg, transparent 0 4PX, #65d5ff22 4PX 6PX); pointer-events: none; }
}
header { display: flex; align-items: center; gap: 9PX; height: 38PX; flex-shrink: 0; border-bottom: 1PX solid #65d5ff1c; }
h2 { margin: 0; font-size: clamp(12PX, .88vw, 18PX); font-weight: 500; letter-spacing: 1PX; white-space: nowrap; }
.index { color: var(--accent); font: 14PX DIN-Bold, monospace; }
.tag { margin-left: auto; color: #5e839b; font: 9PX Arial, sans-serif; letter-spacing: 1.5PX; }
footer { height: 24PX; display: flex; align-items: center; justify-content: space-between; gap: 8PX; flex-shrink: 0; color: #7194ac; font-size: 10PX; border-top: 1PX solid #65d5ff12; white-space: nowrap; }
footer i, .history-summary i, .latest-dot { display: inline-block; height: 5PX; width: 5PX; border-radius: 50%; background: #65e6ff; box-shadow: 0 0 8PX #65e6ff; margin-right: 6PX; }
.quality-body { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: space-around; gap: 10PX; }
.gauge { width: min(46%, 16vh); aspect-ratio: 1; position: relative; flex-shrink: 0; }
.ticks { position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(#65d5ff66 0deg 1deg, transparent 1deg 6deg); mask: radial-gradient(circle, transparent 64%, #000 65%); animation: orbit 75s linear infinite; }
.arc { position: absolute; inset: 9%; border-radius: 50%; background: conic-gradient(from 225deg, #299cdb, #65e6ff var(--value), #65d5ff15 var(--value)); mask: radial-gradient(circle, transparent 61%, #000 63%); }
.gauge-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5PX; }
.gauge-label span { font-size: 10PX; color: #9ec1d4; }
.gauge-label strong { color: #d7faff; font: clamp(19PX, 1.65vw, 34PX) DIN-Bold, monospace; text-shadow: 0 0 15PX #65e6ff66; }
.gauge-label small { font: 10PX Arial, sans-serif; color: #65e6ff; }
.gauge-label em { color: #50768e; font: 8PX Arial, sans-serif; letter-spacing: 2PX; }
.totals { display: flex; flex-direction: column; gap: 10PX; min-width: 0; }
.totals > div { display: flex; flex-direction: column; gap: 3PX; }
.totals span { color: #8aa9be; font-size: 10PX; }
.totals strong { color: #65e6ff; font: clamp(17PX, 1.35vw, 27PX) DIN-Bold, monospace; }
.totals small { color: #7194ac; font: 10PX Arial, sans-serif; margin-left: 5PX; }
.totals b { color: #bdefff; font: 12PX DIN-Bold, monospace; }
.amber, .totals .amber strong { color: #ffcc66; }
.point-summary, .history-summary { min-height: 32PX; display: flex; align-items: center; justify-content: space-between; gap: 8PX; font-size: 11PX; color: #9ebdce; }
.point-summary b { color: #65e6ff; font: 20PX DIN-Bold, monospace; margin: 0 4PX; }
.point-summary em, .history-summary em { font-style: normal; color: #64879e; margin-left: 8PX; font-size: 10PX; }
.point-grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: minmax(36PX, 1fr); gap: 6PX; padding-bottom: 7PX; scrollbar-width: thin; scrollbar-color: #276078 transparent; }
.point-cell { --state: #65e6ff; display: flex; align-items: center; gap: 8PX; padding: 5PX 8PX; border: 1PX solid #65d5ff26; border-radius: 3PX; background: linear-gradient(110deg, #13739416, #08203922); min-width: 0; }
.point-number { color: #52758d; font: 12PX DIN-Bold, monospace; }
.point-cell > div { min-width: 0; flex: 1; }
.point-cell strong { display: block; color: #c5dfeb; font-size: 11PX; font-weight: 400; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.point-cell div > span { color: var(--state); font-size: 9PX; display: block; margin-top: 3PX; }
.point-cell div i { display: inline-block; width: 4PX; height: 4PX; background: currentColor; border-radius: 50%; margin-right: 4PX; }
.signal { display: flex; align-items: flex-end; gap: 2PX; height: 16PX; color: var(--state); }
.signal i { width: 2PX; height: 40%; background: currentColor; box-shadow: 0 0 5PX currentColor; }
.signal i:nth-child(2) { height: 60%; } .signal i:nth-child(3) { height: 80%; } .signal i:nth-child(4) { height: 100%; }
.fault { --state: #ff9275; border-color: #ff927545; background: #ff927509; } .fault .signal { animation: alert-pulse 2s ease-in-out infinite; }
.unknown { --state: #728b9e; } .unknown .signal { opacity: .3; }
.sample-count { font: 11PX DIN-Bold, monospace; color: #65e6ff; padding-left: 8PX; }
.table-wrap { flex: 1; min-height: 0; overflow: auto; scrollbar-width: thin; scrollbar-color: #276078 transparent; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 11PX; text-align: right; }
th { position: sticky; top: 0; z-index: 1; background: #0a2237; color: #799eb7; font-weight: 400; height: 27PX; }
td { height: 29PX; border-bottom: 1PX solid #65d5ff0d; color: #aac8dc; font-family: DIN-Bold, monospace; }
th, td { padding: 0 9PX; white-space: nowrap; }
th:first-child, td:first-child { text-align: left; width: 23%; }
tr:nth-child(even) { background: #65d5ff04; }
.latest { background: linear-gradient(90deg, #65e6ff12, transparent); } .latest td { color: #bdf5ff; } .latest td.amber { color: #ffcc66; }
.empty { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8PX; padding: 12PX; color: #87a8be; font-size: 12PX; }
.empty span { color: #52758d; font-size: 10PX; }
@keyframes orbit { to { transform: rotate(360deg); } } @keyframes alert-pulse { 50% { opacity: .35; } }
@media (max-width: 1400px) { .panel { padding: 0 10PX; } .tag { display: none; } .sample-count { margin-left: auto; } .point-cell { gap: 5PX; padding: 4PX 5PX; } .point-number { display: none; } .history-summary em { display: none; } th, td { padding: 0 5PX; } footer { font-size: 9PX; } }
@media (max-height: 850px) { header { height: 31PX; } footer { height: 21PX; } .point-summary, .history-summary { min-height: 26PX; } .totals { gap: 5PX; } .point-grid { grid-auto-rows: minmax(26PX, 1fr); gap: 3PX; padding-bottom: 4PX; } .point-cell { padding-top: 1PX; padding-bottom: 1PX; } .point-cell strong, .point-cell div > span { line-height: 1.1; } .point-cell div > span { margin-top: 1PX; } th { height: 23PX; } td { height: 25PX; } }
@media (prefers-reduced-motion: reduce) { .ticks, .fault .signal { animation: none; } }
</style>
