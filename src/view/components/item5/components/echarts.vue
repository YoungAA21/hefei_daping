<template>
  <div class="echarts1" ref="echarts">
  </div>
</template>
<script>
import * as echarts from "echarts"

export default {
  name: 'echarts1',
  components: {},
  props: {
    list: {
      type: Array,
      default() {
        return []
      }
    }
  },
  data() {
    return {
      myChart: null,
      resizeObserver: null,
      chartTimer: null
    }
  },
  watch: {
    list() {
      this.drawEcharts();
    },
  },
  mounted() {
    this.initChart();
  },
  beforeDestroy() {
    this.cleanup();
  },
  methods: {
    initChart() {
      // 确保DOM已经渲染
      this.$nextTick(() => {
        if (this.$refs.echarts) {
          this.drawEcharts();
          this.initResizeObserver();
        }
      });
    },

    initResizeObserver() {
      const viewElem = document.body;
      this.resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
          this.drawEcharts();
        }, 300)
      });
      this.resizeObserver.observe(viewElem);
    },

    drawEcharts() {
      // 检查DOM元素是否存在
      if (!this.$refs.echarts) {
        return;
      }

      // 如果实例已存在，先销毁
      if (this.myChart) {
        this.myChart.dispose();
      }

      // 基于准备好的dom，初始化echarts实例
      this.myChart = echarts.init(this.$refs.echarts);

      // 处理传入的数据
      let points = [];
      if (this.list && this.list.length > 0 && this.list[0].points) {
        points = this.list[0].points.slice(0, 6); // 最多取6个点
      }

      // 生成数据 - 只生成实际有数据的部分
      var data = [];
      var xData = [];
      var data1 = [];
      var data3 = [];
      var data4 = [];

      for (let i = 0; i < points.length; ++i) {
        data.push(Math.round(Math.random() * 80 + 20));
        xData.push(points[i].point); // 使用point名称作为X轴标签
        data1.push(100);
        data3.push(0.01);
        data4.push(20);
      }

      var path ='path://M676.2,197.5V183c2.2-11.8,13.2-14.1,13.2-14.1c17.8-2.9,21.1,11.8,21.1,11.8c3.1,8.4,6.2,11.4,6.2,11.4c15.6,13.3,22.8-5.4,22.8-5.4v10.8H676.2z';
      var path1 ='path://M684.4,214.2v-3h26.3c16.3,1,18.2-7,18.2-7c2.6-9.1,11.6-10,11.6-10c8.4-0.5,7.2,9.1,7.2,9.1v10.8H684.4z';

      var option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 20, 40, 0.8)',
          borderColor: '#00f2ff',
            color: '#fff',
            fontSize: 12
        },
        grid: {
          top: 10,
          left: 15, // 增加左边距
          bottom: 50, // 增加底部边距给X轴标签更多空间
          right: 15, // 增加右边距
        },
        xAxis: {
          show: true,
          axisLabel: {
            interval: 0,
            color: '#00f2ff',
            fontSize: 10,
            fontFamily: 'Microsoft YaHei',
            fontWeight: 'bold',
            margin: 10,
            rotate: 30, // 适度旋转
          },
          splitLine: {
            show: false,
          },
          axisLine: {
            show: true,
            lineStyle: {
              color: 'rgba(0, 242, 255, 0.3)',
              width: 1,
            },
          },
          splitArea: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          data: xData,
        },
        yAxis: {
          show: false,
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 242, 255, 0.3)',
              width: 1,
            },
          },
          axisLabel: {
            interval: 0,
              color: '#00f2ff',
              fontSize: 8,
              fontFamily: 'Microsoft YaHei',
              fontWeight: 'bold',
            margin: 5,
          },
          splitLine: {
            show: false,
            lineStyle: {
              color: 'rgba(0, 242, 255, 0.1)',
              width: 1,
            },
          },
          axisTick: {
            show: false,
          },
        },
        series: [
          {
            name: '',
            type: 'pictorialBar',
            symbol: path,
            symbolSize: [12, 6],
            symbolOffset: [0, -17],
            z: 41,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                {
                  offset: 0,
                  color: '#00f2ff',
                },
                {
                  offset: 1,
                  color: '#0066ff',
                },
              ]),
            },
            symbolPosition: 'end',
            data: data,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbol: path1,
            symbolSize: [12, 4],
            symbolOffset: [0, -10],
            z: 40,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: '#00f2ff',
                },
                {
                  offset: 1,
                  color: '#0066ff',
                },
              ]),
            },
            symbolPosition: 'end',
            data: data,
          },
          {
            name: '',
            type: 'bar',
            barWidth: 12,
            barGap: '-100%',
            z: 10,
            label: {
              show: false, // 去除百分比显示
            },
            itemStyle: {
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                {
                  offset: 0,
                  color: '#00f2ff',
                },
                {
                  offset: 1,
                  color: '#0066ff',
                },
              ]),
            },
            data: data,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbolSize: [15, 4],
            symbolOffset: [0, -2],
            z: 62,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: '#00f2ff',
                },
                {
                  offset: 1,
                  color: '#0066ff',
                },
              ]),
              borderColor:'#00f2ff',
              borderWidth:1,
            },
            symbolPosition: 'end',
            data: data1,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbol: 'rect',
            symbolSize: [15, 6],
            symbolOffset: [0, 0],
            z: 60,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: 'rgba(0, 242, 255, 0.1)',
                },
                {
                  offset: 0.3,
                  color: 'rgba(0, 242, 255, 0.2)',
                },
                {
                  offset: 0.8,
                  color: 'rgba(0, 242, 255, 0.3)',
                },
                {
                  offset: 0.8,
                  color: '#0066ff',
                },
                {
                  offset: 0.85,
                  color: '#0066ff',
                },
                {
                  offset: 0.85,
                  color: 'rgba(0, 242, 255, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(0, 242, 255, 0.1)',
                },
              ]),
            },
            symbolPosition: 'end',
            data: data1,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbolSize: [15, 4],
            symbolOffset: [0, 4],
            z: 52,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: 'rgba(0, 242, 255, 0.1)',
                },
                {
                  offset: 0.3,
                  color: 'rgba(0, 242, 255, 0.2)',
                },
                {
                  offset: 0.8,
                  color: 'rgba(0, 242, 255, 0.3)',
                },
                {
                  offset: 0.8,
                  color: '#0066ff',
                },
                {
                  offset: 0.85,
                  color: '#0066ff',
                },
                {
                  offset: 0.85,
                  color: 'rgba(0, 242, 255, 0.3)',
                },
                {
                  offset: 1,
                  color: 'rgba(0, 242, 255, 0.1)',
                },
              ]),
              borderColor: 'rgba(0, 242, 255, 0.5)',
              borderWidth: 0.5,
              shadowBlur: 3,
              shadowColor: 'rgba(0, 242, 255, 0.3)',
              shadowOffsetY: 1,
              shadowOffsetX: 0,
            },
            symbolPosition: 'end',
            data: data1,
          },
          {
            name: '',
            type: 'bar',
            barWidth: 12,
            barGap: '-100%',
            z: 0,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(0, 242, 255, 0.1)',
                  },
                  {
                    offset: 0.15,
                    color: 'rgba(0, 242, 255, 0.2)',
                  },
                  {
                    offset: 0.3,
                    color: 'rgba(0, 242, 255, 0.3)',
                  },
                  {
                    offset: 0.5,
                    color: 'rgba(0, 242, 255, 0.3)',
                  },
                  {
                    offset: 0.7,
                    color: 'rgba(0, 242, 255, 0.3)',
                  },
                  {
                    offset: 0.85,
                    color: 'rgba(0, 242, 255, 0.2)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(0, 242, 255, 0.1)',
                  },
                ],
                global: false,
              },
            },
            data: data1,
          },
          {
            type: 'pictorialBar',
            symbol: 'rect',
            symbolSize: [2, '100%'],
            symbolOffset: [3, 2],
            z: 50,
            symbolPosition: 'end',
            itemStyle: {
              color:'rgba(0, 242, 255, 0.3)',
            },
            data: data1,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbolSize: [10, 4],
            symbolOffset: [0, 3],
            z: 40,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: '#00f2ff',
                },
                {
                  offset: 1,
                  color: '#0066ff',
                },
              ]),
            },
            data: Array(points.length).fill(1),
          },
          {
            name: '',
            type: 'pictorialBar',
            symbolSize: [12, 5],
            symbolOffset: [0, 3],
            z: 3,
            itemStyle: {
              opacity: 1,
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: '#00f2ff',
                },
                {
                  offset: 0.3,
                  color: '#0066ff',
                },
                {
                  offset: 0.5,
                  color: '#0066ff',
                },
                {
                  offset: 0.7,
                  color: '#0066ff',
                },
                {
                  offset: 1,
                  color: '#00f2ff',
                },
              ]),
            },
            data: Array(points.length).fill(1),
          },
          {
            name: '',
            type: 'pictorialBar',
            symbolSize: [15, 6],
            symbolOffset: [0, -3],
            z: 1,
            itemStyle: {
              opacity: 1,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(0, 242, 255, 0.8)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(0, 102, 255, 0.8)',
                  },
                ],
                global: false,
              },
              borderColor:'#00f2ff',
              borderWidth:1,
            },
            symbolPosition: 'end',
            data: data3,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbol: 'rect',
            symbolSize: [15, 8],
            symbolOffset: [0, 8],
            z: -1,
            label: {
              show: false, // 去除底部标签
            },
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(0, 242, 255, 0.2)',
                  },
                  {
                    offset: 0.5,
                    color: 'rgba(0, 242, 255, 0.4)',
                  },
                  {
                    offset: 0.6,
                    color: 'rgba(0, 242, 255, 0.6)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(0, 242, 255, 0.3)',
                  },
                ],
                global: false,
              },
            },
            data: data4,
          },
          {
            name: '',
            type: 'pictorialBar',
            symbolSize: [15, 6],
            symbolOffset: [0, 5],
            z: -2,
            itemStyle: {
              opacity: 1,
              shadowBlur: 5,
              shadowColor: 'rgba(0, 242, 255, 0.3)',
              shadowOffsetY: 2,
              shadowOffsetX: 3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(0, 242, 255, 0.2)',
                  },
                  {
                    offset: 0.5,
                    color: 'rgba(0, 242, 255, 0.4)',
                  },
                  {
                    offset: 0.6,
                    color: 'rgba(0, 242, 255, 0.6)',
                  },
                  {
                    offset: 1,
                    color: 'rgba(0, 242, 255, 0.3)',
                  },
                ],
                global: false,
              },
            },
            symbolPosition: 'end',
            data: data3,
          },
        ],
      };
      // 清除之前的定时器
      if (this.chartTimer) {
        clearInterval(this.chartTimer);
      }

      function run () {
        if (!this.myChart) return;
        var data = option.series[0].data;
        for (var i = 0; i < points.length; ++i) {
          data[i] = Math.round(Math.random() * 80 + 20);
        }
        // 更新其他相关series的数据
        option.series[1].data = [...data];
        option.series[2].data = [...data];
        this.myChart.setOption(option);
      }

      // 绑定this上下文
      const boundRun = run.bind(this);

      setTimeout(function() {
        boundRun();
      }, 0);

      this.chartTimer = setInterval(function () {
        boundRun();
      }, 2000);

      this.myChart.setOption(option);
    },

    cleanup() {
      // 清除定时器
      if (this.chartTimer) {
        clearInterval(this.chartTimer);
        this.chartTimer = null;
      }

      // 取消观察
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      // 销毁图表实例
      if (this.myChart) {
        this.myChart.dispose();
        this.myChart = null;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.echarts1 {
  position: relative;
  width: 100%;
  height: 18vh; /* 固定高度 */
  min-height: 18vh; /* 最小高度 */
  max-height: 18vh; /* 最大高度 */
}
</style>