<template>
  <div ref="host" class="statistics-chart" role="img" :aria-label="description"></div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as echarts from 'echarts';
const props = defineProps({ rows: { type: Array, default: () => [] }, kind: { type: String, default: 'defects' }, selectedLine: String });
const emit = defineEmits(['select']);
const host = ref(null);
let chart, observer;
const colors = { X: '#ff7588', A: '#ffad69', B: '#ffcf69', C: '#65e6ff' };
const description = computed(() => props.rows.map(row => `${row.name}：${row.value ?? '暂无评分'}`).join('；'));
function render() {
  if (!chart) return;
  const score = props.kind === 'score';
  const rows = props.rows;
  const visibleCount = Math.max(2, Math.min(6, Math.floor((host.value.clientHeight - 16) / 22)));
  chart.setOption({
    animationDurationUpdate: 400,
    grid: { left: score ? 65 : Math.max(90, host.value.clientWidth * .44), right: score ? 58 : 44, top: 8, bottom: score ? 22 : 8 },
    tooltip: { trigger: 'axis', confine: true, renderMode: 'richText', backgroundColor: '#071b34', borderColor: '#35677d', textStyle: { color: '#d8eeff' },
      formatter: params => { const row = rows[params[0]?.dataIndex]; return row ? `${row.name}\n${score ? '评分' : '缺陷数量'}：${row.value === null ? '暂无评分' : score ? row.value.toFixed(2) + ' 分' : row.value + ' 次'}${row.note ? '\n' + row.note : ''}` : ''; } },
    xAxis: { type: 'value', show: score, min: score ? Math.floor(Math.min(0, ...rows.map(row => row.value ?? 0)) / 100) * 100 : 0,
      max: score ? Math.max(100, ...rows.map(row => row.value ?? 0)) : undefined,
      splitNumber: 3, axisLabel: { color: '#7194ac', fontSize: 9 }, splitLine: { lineStyle: { color: '#65d5ff15', type: 'dashed' } } },
    yAxis: { type: 'category', inverse: true, data: rows.map(row => row.name), axisTick: { show: false }, axisLine: { show: false },
      axisLabel: { color: '#aac8da', fontSize: 11, interval: 0, width: score ? 58 : Math.max(80, host.value.clientWidth * .42), overflow: 'truncate',
        formatter: (name, index) => score && rows[index]?.value === null ? `${name}  —` : name } },
    dataZoom: !score && rows.length > visibleCount ? [
      { type: 'inside', yAxisIndex: 0, startValue: 0, endValue: visibleCount - 1, zoomLock: true, filterMode: 'filter' },
      { type: 'slider', yAxisIndex: 0, startValue: 0, endValue: visibleCount - 1, width: 4, right: 0, showDetail: false, showDataShadow: false, borderColor: 'transparent', fillerColor: '#65e6ff44', backgroundColor: '#65e6ff10', brushSelect: false }
    ] : [],
    series: [{ type: 'bar', barMaxWidth: score ? 10 : 12, showBackground: true, backgroundStyle: { color: '#65d5ff08' },
      data: rows.map(row => ({ value: row.value, itemStyle: { color: score ? row.value < 0 ? '#ff7588' : row.name === props.selectedLine ? '#65e6ff' : '#3289b9' : colors[row.name.match(/-([XABC])$/)?.[1]] || '#89b9d2', borderRadius: 2 } })),
      label: { show: true, position: 'right', color: '#d8eeff', fontSize: 11,
        formatter: params => rows[params.dataIndex].value === null ? '—' : score ? rows[params.dataIndex].value.toFixed(2) : rows[params.dataIndex].value },
      markLine: score ? { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#65d5ff44' }, data: [{ xAxis: 0 }] } : undefined
    }]
  }, { notMerge: true });
}
onMounted(() => {
  chart = echarts.init(host.value);
  chart.on('click', params => { if (props.kind === 'score') emit('select', props.rows[params.dataIndex]?.name); });
  observer = new ResizeObserver(() => { chart?.resize(); render(); });
  observer.observe(host.value);
  render();
});
watch(() => [props.rows, props.selectedLine], render, { deep: true });
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = null; });
</script>

<style scoped>
.statistics-chart { width: 100%; height: 100%; min-height: 0; }
</style>
