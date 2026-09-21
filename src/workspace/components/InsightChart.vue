<template>
  <div
    class="insight-chart"
    role="img"
    :aria-label="
      title + '：' + rows.map((r) => `${r.name} ${r.value}`).join('，')
    "
  >
    <div ref="host" style="width: 100%; height: 100%"></div>
    <span v-if="!rows.length" class="chart-empty">暂无统计数据</span>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as echarts from "echarts";
const props = defineProps({
  rows: { type: Array, default: () => [] },
  kind: { default: "bar" },
  title: { default: "" },
});
const host = ref();
let chart, observer;
function render() {
  if (!chart) return;
  const color = [
    "#5de4e1",
    "#59a8ff",
    "#a195ff",
    "#edbd6c",
    "#f285a3",
    "#82ddb1",
  ];
  const base = {
    color,
    backgroundColor: "transparent",
    animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    animationDuration: 800,
    tooltip: {
      trigger: props.kind === "bar" ? "axis" : "item",
      renderMode: "richText",
      confine: true,
    },
    textStyle: { fontFamily: "Microsoft YaHei", color: "#8aa7bf" },
    aria: { enabled: true },
  };
  const data = props.rows;
  chart.setOption(
    props.kind === "donut"
      ? {
          ...base,
          legend: {
            bottom: 0,
            textStyle: { color: "#95aabd", fontSize: 10 },
            type: "scroll",
          },
          series: [
            {
              type: "pie",
              radius: ["48%", "70%"],
              center: ["50%", "43%"],
              data,
              label: { show: false },
              itemStyle: {
                borderColor: "#0a1b2c",
                borderWidth: 4,
                borderRadius: 5,
              },
              emphasis: {
                label: { show: true, color: "#eafaff", formatter: "{b}\n{c}" },
              },
            },
          ],
        }
      : {
          ...base,
          grid: { left: 8, right: 12, top: 18, bottom: 8, containLabel: true },
          xAxis: {
            type: "category",
            data: data.map((r) => r.name),
            axisLabel: {
              color: "#8aa7bf",
              width: 65,
              overflow: "truncate",
              fontSize: 10,
            },
            axisLine: { lineStyle: { color: "#254053" } },
            axisTick: { show: false },
          },
          yAxis: {
            type: "value",
            minInterval: 1,
            splitLine: { lineStyle: { color: "#183447", type: "dashed" } },
          },
          series: [
            {
              type: "bar",
              data: data.map((r) => r.value),
              barMaxWidth: 24,
              itemStyle: {
                borderRadius: [5, 5, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#5de4e1" },
                  { offset: 1, color: "rgba(34,133,174,.15)" },
                ]),
              },
              label: {
                show: true,
                position: "top",
                color: "#99e6e5",
                fontSize: 10,
              },
            },
          ],
        },
    true,
  );
}
onMounted(() => {
  chart = echarts.init(host.value);
  render();
  observer = new ResizeObserver(() => chart?.resize());
  observer.observe(host.value);
});
watch(() => [props.rows, props.kind], render, { deep: true });
onBeforeUnmount(() => {
  observer?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>
