<template><div ref="host" class="combined-chart" role="img" :aria-label="description"></div></template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import { compactNumber, formatNumber } from './lineMetrics';
const props = defineProps({ rows: { type: Array, required: true } });
const host = ref(null);
let chart, observer;
const description = computed(() => props.rows.map(row => `${row.name}产线：剔除${formatNumber(row.rejected)}件，合格率${row.quality == null ? '暂无数据' : row.quality.toFixed(2) + '%'}，${row.status}`).join('；'));
function render() {
  if (!chart) return;
  const small = host.value.clientWidth < 600;
  chart.setOption({
    animationDurationUpdate: 500,
    legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 6, textStyle: { color: '#8aa9be', fontSize: 10 }, data: ['剔除数', '合格率'] },
    grid: { left: 5, right: 5, top: 26, bottom: 0, containLabel: true },
    tooltip: { trigger: 'axis', confine: true, renderMode: 'richText', backgroundColor: '#071b34', borderColor: '#35677d', textStyle: { color: '#d8eeff', fontSize: 12 },
      formatter: params => { const row = props.rows[params[0]?.dataIndex]; return row ? `${row.name}产线 · ${row.status}\n剔除：${formatNumber(row.rejected)} 件\n合格率：${row.quality == null ? '—' : row.quality.toFixed(2) + '%'}\n产量：${formatNumber(row.production)} 件` : ''; } },
    xAxis: { type: 'category', data: props.rows.map(row => row.name), axisTick: { show: false }, axisLine: { lineStyle: { color: '#65d5ff33' } },
      axisLabel: { interval: 0, margin: 8, fontSize: 10, color: '#aac8da',
        formatter: (name, index) => `${name}\n{${props.rows[index].state}|${small ? props.rows[index].state === 'missing' ? '未接入' : props.rows[index].state === 'fault' ? '异常' : '接入' : props.rows[index].status}}`,
        rich: { missing: { color: '#647f95', fontSize: 8, lineHeight: 16 }, fault: { color: '#ff9275', fontSize: 8, lineHeight: 16 }, normal: { color: '#65e6ff', fontSize: 8, lineHeight: 16 } } } },
    yAxis: [
      { type: 'value', min: 0, minInterval: 1, splitNumber: 3, axisLabel: { color: '#9b956d', fontSize: 9, formatter: compactNumber }, splitLine: { lineStyle: { color: '#65d5ff12', type: 'dashed' } } },
      { type: 'value', min: 0, max: 100, interval: 50, axisLabel: { color: '#719eac', fontSize: 9, formatter: '{value}%' }, splitLine: { show: false } }
    ],
    series: [
      { name: '剔除数', type: 'bar', yAxisIndex: 0, data: props.rows.map(row => row.rejected), barMaxWidth: 18,
        itemStyle: { borderRadius: [3, 3, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#ffcf69' }, { offset: 1, color: '#c9773233' }]) },
        label: { show: true, position: 'top', color: '#ffcf69', fontSize: 9, formatter: p => p.value == null ? '—' : compactNumber(p.value) } },
      { name: '合格率', type: 'line', yAxisIndex: 1, data: props.rows.map(row => row.quality), connectNulls: false, symbol: 'circle', symbolSize: 5, lineStyle: { color: '#65e6ff', width: 2 }, itemStyle: { color: '#65e6ff', borderColor: '#10384b', borderWidth: 1 }, z: 4 }
    ]
  });
}
onMounted(() => { chart = echarts.init(host.value); render(); observer = new ResizeObserver(() => { chart?.resize(); render(); }); observer.observe(host.value); });
watch(() => props.rows, render, { deep: true });
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = null; });
</script>

<style scoped>.combined-chart { width: 100%; height: 100%; min-height: 0; }</style>
