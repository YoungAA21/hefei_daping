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
      prodata: []
    }
  },
// 在 echarts.vue 的 watch 中添加深度比较
  watch: {
    list: {
      handler(newVal, oldVal) {
        if (oldVal !== undefined && JSON.stringify(newVal) === JSON.stringify(oldVal)) {
          return;
        }
        this.processData(newVal);
        this.drawEcharts();
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    var that = this;
    const viewElem = document.body;
    // 监听窗口变化,重绘echarts
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        that.drawEcharts();
      }, 300)
    });
    resizeObserver.observe(viewElem);
  },
  methods: {
    processData(list) {
      // 初始化9个产线的数据，全部为0
      this.prodata = Array(9).fill(0);

      if (list && list.length > 0) {
        // 按顺序填充从高4开始的数据
        list.forEach((item, index) => {
          if (index < 6) { // 最多6条数据，对应高4到高9
            const production = parseInt(item.production) || 0;
            // 直接使用原始数据，不需要缩放
            this.prodata[index + 3] = production;
          }
        });
      }
    },
    drawEcharts() {
      if (!this.$refs.echarts) return;

      // 基于准备好的dom，初始化echarts实例
      let myChart = echarts.init(this.$refs.echarts)

      // 计算合适的纵坐标最大值
      const maxDataValue = Math.max(...this.prodata);
      const yAxisMax = Math.ceil(maxDataValue / 50000) * 50000; // 按5万间隔取整
      const yAxisInterval = yAxisMax / 4; // 分成4段

      // 生成对应的产线名称
      const lineNames = [];
      for (let i = 1; i <= 9; i++) {
        lineNames.push(`高${i}产线`);
      }

      var option = {
        backgroundColor:'#031d33',
        animation: true,

        // tooltip 配置
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow' // 阴影指示器
          },
          formatter: function(params) {
            // params 是一个数组，包含当前坐标轴的所有系列数据
            const data = params[0];
            const value = data.value;
            const name = data.name;

            // 格式化显示数值
            let displayValue;
            if (value >= 10000) {
              displayValue = (value / 10000).toFixed(1) + '万';
            } else {
              displayValue = value;
            }

            return `${name}<br/>产量: ${displayValue}`;
          }
        },

        grid: {
          top: "5%",
          bottom: "25%",
          right: "0"
        },
        xAxis: {
          data: lineNames,
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: "rgba(77, 128, 254, 0.2)",
              width: 1
            }
          },
          axisLabel: {
            show: true,
            margin: 10,
            fontSize: 10,
              color: "#65D5FF"
          }
        },
        yAxis: [
          {
            type: "value",
            gridIndex: 0,
            min: 0,
            max: yAxisMax,
            interval: yAxisInterval,
            splitLine: {
              show: true,
              lineStyle: {
                color: "rgba(77, 128, 254, 0.2)",
                width: 1
              }
            },
            axisTick: {
              show: false
            },
            axisLine: {
              show: true,
              lineStyle: {
                color: "rgba(77, 128, 254, 0.2)"
              }
            },
            axisLabel: {
              show: true,
              margin: 14,
              fontSize: 10,
                color: "#65D5FF",
              formatter: function(value) {
                if (value >= 10000) {
                  return (value / 10000).toFixed(0) + '万';
                }
                return value;
              }
            }
          }
        ],
        series: [
          {
            name: "产量",
            type: "bar",
            barWidth: 6,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: "rgba(146, 225, 255, 1)"
                  },
                  {
                    offset: 1,
                    color: "rgba(0, 151, 251, 1)"
                  }
                ])
            },
            data: this.prodata,
            z: 10,
            zlevel: 0
          },
          {
            // 分隔
            type: "pictorialBar",
            itemStyle: {
                color: "#0F375F"
            },
            symbolRepeat: "fixed",
            symbolMargin: 6,
            symbol: "rect",
            symbolClip: true,
            symbolSize: [18, 2],
            symbolPosition: "start",
            symbolOffset: [1,1],
            data: this.prodata,
            width: 2,
            z: 0,
            zlevel: 1
          },
          {
            name: "外框",
            type: "bar",
            barGap: "-110%",
            data: Array(9).fill(yAxisMax),
            barWidth: 6,
            itemStyle: {
                color: "transparent",
                label: {
                  show: false,
                  position: "top"
                }
            },
            z: 0
          },
          {
            name: "背影",
            type: "line",
            smooth: true,
            showAllSymbol: false,
            symbolSize: 0,
            lineStyle: {
              width: 0
            },
            areaStyle: {
              color: "rgba(0, 151, 251, 0.1)"
            },
            data: this.prodata,
            z: 5
          }
        ],
        dataZoom: [
          {
            type: "slider",
            show: false,
            xAxisIndex: [0],
            endValue: 8,
            startValue: 0
          }
        ]
      }

      myChart.clear()
      myChart.resize()
      myChart.setOption(option)
    },
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
