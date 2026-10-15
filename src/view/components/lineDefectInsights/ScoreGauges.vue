<template>
  <div class="score-gauges" :class="{ single }" :aria-label="single ? '当前产线评分仪表盘' : '九条产线评分仪表盘'">
    <div v-for="row in rows" :key="row.name" class="score-card" role="img"
      :class="{ negative: row.value < 0, missing: row.value == null }"
      :aria-label="`${row.name}产线，${row.insufficient ? '暂时未达到评分条件' : label(row.value) + (row.value == null ? '' : '分')}`"
      :title="`${row.name}产线 · ${row.note}\n班次产量：${row.productionCount ?? '—'}\n${row.insufficient ? '暂时未达到评分条件，产量达到 1000 后开始评分' : '评分：' + label(row.value) + (row.value == null ? '' : ' 分')}\n仪表刻度 0—100，数值保留实际得分`"
      >
      <span class="line-name">{{ row.name }}产线<span v-if="row.value < 0" class="negative-tag">负分</span></span>
      <div v-if="row.insufficient" class="score-condition"><span>暂时未达到评分条件</span><small>产量 {{ row.productionCount.toLocaleString('zh-CN') }} / {{ MIN_SCORE_PRODUCTION }}</small></div>
      <div v-else class="dial">
        <svg viewBox="0 0 120 66" aria-hidden="true">
          <path class="dial-ticks" d="M 8 60 A 52 52 0 0 1 112 60" pathLength="100" />
          <path class="dial-track" d="M 16 60 A 44 44 0 0 1 104 60" pathLength="100" />
          <path v-if="row.value != null && row.value > 0" class="dial-progress" d="M 16 60 A 44 44 0 0 1 104 60" pathLength="100"
            :stroke-dasharray="`${Math.min(100, Math.max(0, row.value))} 100`" />
        </svg>
        <strong>{{ label(row.value) }}<small v-if="row.value != null">分</small></strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MIN_SCORE_PRODUCTION } from './scoreMetrics';
defineProps({ rows: { type: Array, required: true }, single: Boolean });
const label = value => value == null ? '—' : Number(value).toFixed(2);
</script>

<style scoped>
.score-gauges { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: 6PX; width: 100%; height: 100%; padding: 4PX 0; box-sizing: border-box; }
.score-card { --score-color: #65e6ff; display: flex; flex-direction: column; align-items: center; min-width: 0; min-height: 0; overflow: hidden; border: 1PX solid #65d5ff25; border-radius: 4PX; background: radial-gradient(ellipse at bottom, #17638022, transparent 80%); padding: 4PX 5PX 2PX; color: #aac8da; }
.score-card:focus-visible { outline: 1PX solid #65e6ff; outline-offset: -2PX; }
.line-name { display: flex; justify-content: center; align-items: center; gap: 4PX; font: 10PX 'Microsoft YaHei', sans-serif; line-height: 13PX; flex-shrink: 0; white-space: nowrap; }
.negative-tag { font-size: 8PX; color: #ff7588; }
.dial { display: flex; flex-direction: column; align-items: center; gap: 2PX; flex: 1; min-height: 0; width: 100%; }
svg { display: block; flex: 1; min-height: 0; width: 100%; max-width: 115PX; overflow: hidden; }
path { fill: none; }
.dial-ticks { stroke: #65d5ff35; stroke-width: 2; stroke-dasharray: .7 3.3; }
.dial-track { stroke: #65d5ff1c; stroke-width: 5; }
.dial-progress { stroke: var(--score-color); stroke-width: 5; stroke-linecap: round; filter: drop-shadow(0 0 2PX #65e6ff66); transition: stroke-dasharray .6s ease; }
strong { flex-shrink: 0; padding-bottom: 1PX; color: var(--score-color); font: clamp(14PX, 1.1vw, 22PX) DIN-Bold, monospace; line-height: 1; white-space: nowrap; text-shadow: 0 0 12PX #65e6ff33; }
small { font: 8PX 'Microsoft YaHei', sans-serif; padding-left: 2PX; }
.negative { --score-color: #ff7588; }
.negative .dial-track { stroke: #ff758855; }
.negative .dial-ticks { stroke: #ff758855; }
.missing { --score-color: #647f95; }
.missing .dial-ticks { stroke: #647f9522; }
.score-condition { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3PX; width: 100%; }
.score-condition > span { color: #c4b18a; font: 10PX 'Microsoft YaHei', sans-serif; line-height: 1.2; text-align: center; }
.score-condition small { color: #7194ac; font-size: 9PX; padding: 0; }
.score-gauges.single { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); }
.single .score-card { padding: 8PX; }
.single svg { max-width: 170PX; }
.single strong { font-size: clamp(23PX, 2vw, 38PX); }
.single .score-condition > span { font-size: 12PX; }
@media (max-height: 850PX) { .score-gauges { gap: 4PX; padding: 2PX 0; } .score-card { padding: 2PX 3PX; } .line-name { font-size: 9PX; line-height: 11PX; } strong { font-size: 14PX; } }
@media (prefers-reduced-motion: reduce) { .dial-progress { transition: none; } }
</style>
