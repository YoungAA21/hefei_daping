<template>
  <section class="production-insights" aria-label="产线实时数据分析">
    <article class="insight-panel output-panel">
      <header><span class="panel-index">01</span><h2>产线产量分布</h2><span class="panel-tag">PRODUCTION</span></header>
      <div class="metric-summary"><div><span>当前总产量</span><strong>{{ formatNumber(totalProduction) }}</strong><small>件</small></div><span class="summary-note">{{ connected }}/9 产线接入</span></div>
      <div class="plot"><MetricChart :rows="rows" /></div>
      <footer><span><i class="legend-dot"></i>各产线累计产量</span><span>单位：件</span></footer>
    </article>
    <article class="insight-panel rejection-panel">
      <header><span class="panel-index">02</span><h2>产线剔除对比</h2><span class="panel-tag">REJECTION</span></header>
      <div class="metric-summary"><div><span>当前总剔除</span><strong>{{ formatNumber(totalRejected) }}</strong><small>件</small></div><span class="summary-note">{{ highestRejection }}</span></div>
      <div class="plot"><MetricChart :rows="rows" kind="rejected" /></div>
      <footer><span><i class="legend-dot"></i>各产线累计剔除数</span><span>单位：件</span></footer>
    </article>
    <article class="insight-panel quality-panel">
      <header><span class="panel-index">03</span><h2>产线质量与状态</h2><span class="panel-tag">QUALITY MONITOR</span></header>
      <div class="quality-content">
        <div class="quality-overview">
          <div class="quality-gauge" :style="{ '--quality': `${quality ?? 0}%` }" role="img" :aria-label="`综合合格率 ${qualityLabel}`">
            <div class="gauge-ticks"></div><div class="gauge-arc"></div>
            <div class="gauge-value"><span>综合合格率</span><strong>{{ qualityLabel }}<small v-if="quality !== null">%</small></strong><em>PASS RATE</em></div>
          </div>
          <div class="connection-count"><i class="legend-dot"></i>已接入 <b>{{ connected }}</b><span>/ 9</span><em v-if="faults">异常 {{ faults }}</em></div>
        </div>
        <div class="line-matrix">
          <div v-for="row in rows" :key="row.number" class="line-cell" :class="row.state" :title="`${row.name}产线 · ${row.status}\n产量：${formatNumber(row.production)} 件\n剔除：${formatNumber(row.rejected)} 件\n合格率：${row.quality === null ? '暂无有效产量' : row.quality.toFixed(2) + '%'}`">
            <div class="cell-heading"><span>{{ row.name }}产线</span><span class="state-label"><i></i>{{ row.status }}</span></div>
            <div class="cell-value"><strong>{{ row.quality === null ? '—' : row.quality.toFixed(2) }}<small v-if="row.quality !== null">%</small></strong><span>{{ row.quality === null ? '暂无有效产量' : '合格率' }}</span></div>
            <div class="cell-track"><i :style="{ width: `${row.quality ?? 0}%` }"></i></div>
          </div>
        </div>
      </div>
      <footer><span><i class="legend-dot"></i>合格率按产量加权计算</span><span>状态依据检测点 · 5 秒刷新</span></footer>
    </article>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import MetricChart from './MetricChart.vue';
import { normalizeMetrics, formatNumber } from './lineMetrics';
const props = defineProps({ lineData: { type: Array, default: () => [] } });
const rows = computed(() => normalizeMetrics(props.lineData));
const connected = computed(() => rows.value.filter(row => row.state !== 'missing').length);
const faults = computed(() => rows.value.filter(row => row.state === 'fault').length);
const sum = key => { const values = rows.value.filter(row => row[key] !== null); return values.length ? values.reduce((total, row) => total + row[key], 0) : null; };
const totalProduction = computed(() => sum('production'));
const totalRejected = computed(() => sum('rejected'));
const quality = computed(() => {
  const valid = rows.value.filter(row => row.valid);
  const production = valid.reduce((total, row) => total + row.production, 0);
  return production > 0 ? (1 - valid.reduce((total, row) => total + row.rejected, 0) / production) * 100 : null;
});
const qualityLabel = computed(() => quality.value === null ? '—' : quality.value.toFixed(2));
const highestRejection = computed(() => {
  const ranked = rows.value.filter(row => row.rejected !== null).sort((a, b) => b.rejected - a.rejected);
  return !ranked.length ? '等待数据接入' : ranked[0].rejected === 0 ? '当前无剔除' : `最高：${ranked[0].name}产线`;
});
</script>

<style scoped lang="scss">
.production-insights {
  --cyan: #65e6ff; --muted: #8aa9be;
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2fr); gap: 14PX;
  width: 100%; height: 100%; min-height: 0; color: #d8eeff;
}
.insight-panel {
  --accent: #65e6ff;
  position: relative; min-width: 0; min-height: 0; overflow: hidden;
  display: flex; flex-direction: column; padding: 0 14PX;
  border: 1PX solid rgba(101, 213, 255, .27); border-radius: 5PX;
  background: radial-gradient(ellipse at 10% 0%, rgba(14, 115, 157, .17), transparent 60%), linear-gradient(145deg, rgba(5, 25, 46, .94), rgba(3, 12, 27, .95));
  box-shadow: inset 0 1PX 0 rgba(170, 232, 255, .08), 0 8PX 28PX #0004;
  &::before { content: ''; position: absolute; top: 0; left: 14PX; width: 66PX; height: 2PX; background: var(--accent); box-shadow: 0 0 14PX var(--accent); }
  &::after { content: ''; position: absolute; top: 0; right: 0; width: 38PX; height: 16PX; background: repeating-linear-gradient(130deg, transparent 0 4PX, #65d5ff22 4PX 6PX); pointer-events: none; }
}
header { display: flex; align-items: center; gap: 9PX; height: 38PX; flex-shrink: 0; border-bottom: 1PX solid #65d5ff1c; }
h2 { margin: 0; font-size: clamp(12PX, .88vw, 18PX); letter-spacing: 1PX; font-weight: 500; white-space: nowrap; }
.panel-index { color: var(--accent); font: 14PX DIN-Bold, monospace; opacity: .8; }
.panel-tag { margin-left: auto; color: #5e839b; font: 9PX Arial, sans-serif; letter-spacing: 1.5PX; }
.metric-summary { display: flex; align-items: center; justify-content: space-between; min-height: 42PX; gap: 8PX; }
.metric-summary > div { display: flex; align-items: baseline; gap: 8PX; white-space: nowrap; }
.metric-summary span, .metric-summary small { color: var(--muted); font-size: 10PX; }
.metric-summary strong { font: clamp(20PX, 1.55vw, 32PX) DIN-Bold, monospace; color: var(--accent); text-shadow: 0 0 20PX #65d5ff30; }
.summary-note { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.plot { flex: 1; min-height: 0; }
footer { display: flex; align-items: center; justify-content: space-between; gap: 8PX; height: 26PX; flex-shrink: 0; color: #7194ac; font-size: 10PX; border-top: 1PX solid #65d5ff12; white-space: nowrap; }
.legend-dot { display: inline-block; width: 5PX; height: 5PX; border-radius: 50%; margin-right: 6PX; background: var(--accent); box-shadow: 0 0 8PX var(--accent); }
.rejection-panel { --accent: #ffcc66; }
.quality-content { display: flex; flex: 1; overflow: auto; gap: 18PX; min-height: 0; padding: 10PX 0; }
.quality-overview { width: 27%; max-width: 180PX; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
.quality-gauge { position: relative; width: min(100%, 156PX); aspect-ratio: 1; flex-shrink: 0; min-height: 0; }
.gauge-ticks { position: absolute; inset: 0; border-radius: 50%; background: repeating-conic-gradient(from -90deg, #65d5ff55 0deg 1deg, transparent 1deg 6deg); mask: radial-gradient(circle, transparent 64%, #000 65%); }
.gauge-arc { position: absolute; inset: 9%; border-radius: 50%; background: conic-gradient(from 225deg, #299cdb, #65e6ff var(--quality), #65d5ff15 var(--quality)); mask: radial-gradient(circle, transparent 61%, #000 63%); filter: drop-shadow(0 0 5PX #65e6ff88); }
.gauge-value { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4PX; }
.gauge-value span { color: #9ec1d4; font-size: 10PX; }
.gauge-value strong { color: #d7faff; font: clamp(19PX, 1.75vw, 34PX) DIN-Bold, monospace; text-shadow: 0 0 15PX #65e6ff55; }
.gauge-value small { font: 11PX Arial, sans-serif; margin-left: 2PX; color: #65e6ff; }
.gauge-value em { font: 8PX Arial, sans-serif; letter-spacing: 2PX; color: #50768e; }
.connection-count { display: flex; align-items: center; gap: 5PX; margin-top: 4PX; color: #8aadc0; font-size: 10PX; white-space: nowrap; }
.connection-count b { color: #65e6ff; font: 17PX DIN-Bold, monospace; }
.connection-count em { font-style: normal; color: #ff8c78; margin-left: 5PX; }
.line-matrix { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(62PX, 1fr)); gap: 7PX; }
.line-cell { --cell-color: #65e6ff; display: flex; flex-direction: column; justify-content: space-between; padding: 6PX 9PX; min-height: 62PX; border: 1PX solid #65d5ff25; border-radius: 3PX; background: linear-gradient(110deg, #13739416, #08203922); transition: border-color .3s, background .3s; }
.line-cell:hover { border-color: var(--cell-color); background: #12364f77; }
.cell-heading, .cell-value { display: flex; justify-content: space-between; align-items: center; gap: 3PX; }
.cell-heading { font-size: 12PX; line-height: 1.3; color: #b9d2e2; }
.state-label { color: var(--cell-color); font-size: 9PX; white-space: nowrap; }
.state-label i { display: inline-block; height: 4PX; width: 4PX; margin-right: 4PX; background: currentColor; border-radius: 50%; box-shadow: 0 0 6PX currentColor; }
.cell-value { margin-top: 3PX; line-height: 1; }
.cell-value strong { color: var(--cell-color); font: clamp(14PX, 1.02vw, 22PX) DIN-Bold, monospace; }
.cell-value small { font: 9PX Arial, sans-serif; padding-left: 2PX; }
.cell-value > span { font-size: 9PX; color: #7192a8; white-space: nowrap; }
.cell-track { width: 100%; height: 2PX; flex-shrink: 0; margin-top: 5PX; background: #65d5ff12; }
.cell-track i { display: block; height: 100%; background: var(--cell-color); box-shadow: 0 0 6PX #65d5ff44; transition: width .7s ease; }
.missing { --cell-color: #647f95; border-color: #718fa51c; background: #0c1a2922; }
.fault { --cell-color: #ff9275; border-color: #ff927545; background: #ff927509; }
@media (max-width: 1400PX) { .panel-tag { display: none; } .quality-content { gap: 8PX; } .line-cell { padding: 4PX 6PX; } .cell-value > span { display: none; } .insight-panel { padding: 0 10PX; } }
@media (max-height: 850PX) { header { height: 31PX; } .metric-summary { min-height: 33PX; } footer { height: 21PX; font-size: 9PX; } .quality-content { padding: 6PX 0; } .line-matrix { gap: 4PX; } .line-cell { padding-top: 2PX; padding-bottom: 2PX; } .cell-heading { font-size: 10PX; line-height: 1.1; } .cell-value { margin-top: 1PX; } .cell-value strong { font-size: 14PX; } .cell-track { margin-top: 2PX; height: 1PX; } }
@media (prefers-reduced-motion: reduce) { .gauge-ticks { animation: none; } .cell-track i { transition: none; } }
</style>
