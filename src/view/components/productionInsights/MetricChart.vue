<template>
  <div ref="host" class="metric-chart" role="img" :aria-label="description"></div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import * as echarts from 'echarts';
import { compactNumber, formatNumber } from './lineMetrics';

const props = defineProps({ rows: { type: Array, required: true }, kind: { type: String, default: 'production' } });
const host = ref(null);
let chart, observer;
const description = computed(() => props.rows.map(row => `${row.name}产线${props.kind === 'production' ? '产量' : '剔除数'}：${formatNumber(row[props.kind])}`).join('；'));
function render() {
  if (!chart) return;
  const production = props.kind === 'production';
  const color = production ? '#65e6ff' : '#ffcc66';
  const values = props.rows.map(row => row[props.kind]);
  const small = host.value.clientHeight < 120;
  chart.setOption({
    backgroundColor: 'transparent',
    animationDuration: 900,
    animationDurationUpdate: 650,
    textStyle: { fontFamily: 'Arial, Microsoft YaHei, sans-serif' },
    grid: { left: 5, right: 12, top: 22, bottom: 3, containLabel: true },
    tooltip: {
      trigger: 'axis', confine: true, backgroundColor: 'rgba(3, 16, 34, .96)',
      borderColor: color, padding: [8, 12], textStyle: { color: '#e3f6ff', fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(101,213,255,.07)' } },
      formatter: params => {
        const row = props.rows[params[0]?.dataIndex];
        return row ? `${row.name}产线<br/>${production ? '产量' : '剔除数'}：${formatNumber(row[props.kind])}<br/>${row.status}` : '';
      }
    },
    xAxis: { type: 'category', data: props.rows.map(row => row.name),
      axisLine: { lineStyle: { color: 'rgba(101,213,255,.2)' } }, axisTick: { show: false },
      axisLabel: { color: '#93b4c9', fontSize: 11, interval: 0, margin: 9 } },
    yAxis: { type: 'value', min: 0, minInterval: 1, splitNumber: small ? 2 : 3,
      max: values.every(value => !value) ? 1 : undefined,
      axisLabel: { color: '#688aa4', fontSize: 10, formatter: compactNumber },
      splitLine: { lineStyle: { color: 'rgba(101,213,255,.1)', type: 'dashed' } } },
    series: [{
      id: 'metric', name: production ? '产量' : '剔除数', type: 'bar',
      data: values, barMaxWidth: production ? 19 : 12,
      showBackground: true, backgroundStyle: { color: 'rgba(101,213,255,.035)', borderRadius: [3, 3, 0, 0] },
      itemStyle: { borderRadius: [3, 3, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color }, { offset: .35, color: production ? '#219fec' : '#ee9850' },
          { offset: 1, color: production ? 'rgba(17,103,190,.12)' : 'rgba(229,109,65,.12)' }
        ]), shadowBlur: 10, shadowColor: production ? 'rgba(40,185,255,.3)' : 'rgba(255,183,75,.25)' },
      label: { show: true, position: 'top', color, fontSize: 10, distance: 5,
        formatter: params => params.value === null ? '—' : compactNumber(params.value) },
      emphasis: { itemStyle: { color, shadowBlur: 18, shadowColor: color } }
    }]
  });
}
onMounted(() => {
  chart = echarts.init(host.value);
  render();
  observer = new ResizeObserver(() => { chart?.resize(); render(); });
  observer.observe(host.value);
});
watch(() => [props.rows, props.kind], render, { deep: true });
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = null; });
</script>

<style scoped>
.metric-chart { width: 100%; height: 100%; min-height: 0; }
</style>
