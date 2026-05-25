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
      timerId: null
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

    // 计算产线状态百分比
    calculatePercentage() {
      if (!this.list || this.list.length === 0) {
        return 0;
      }
      const lineData = this.list[0]; // 取第一条数据（当前产线）
      const production = parseInt(lineData.production) || 0;
      const rejectionrate = parseInt(lineData.rejectionrate) || 0;
      if (production === 0) return 0;
      // 计算百分比: (1 - 剔除率) * 100%
      const percentage = (1 - rejectionrate / production) * 100;
      return Math.round(Math.max(0, Math.min(100, percentage)));
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
      let angle = 0; //角度，用来做简单的动画效果的
      let value = this.calculatePercentage();

      // 清除之前的定时器
      if (this.timerId) {
        clearInterval(this.timerId);
      }

      const option = {

        title: {
          text: '{a|' + value + '}{c|%}',
          x: 'center',
          y: 'center',
          textStyle: {
            rich: {
              a: {
                fontSize: 38,
                color: '#29EEF3'
              },

              c: {
                fontSize: 20,
                color: '#ffffff',
                // padding: [5,0]
              }
            }
          }
        },

        series: [
          // 紫色
          {
            name: "ring5",
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              return {
                type: 'arc',
                shape: {
                  cx: api.getWidth() / 2,
                  cy: api.getHeight() / 2,
                  r: Math.min(api.getWidth(), api.getHeight()) / 2 * 1.1,
                  startAngle: (0 + angle) * Math.PI / 180,
                  endAngle: (90 + angle) * Math.PI / 180
                },
                style: {
                  stroke: "#8383FA",
                  fill: "transparent",
                  lineWidth: 1.5
                },
                silent: true
              };
            },
            data: [0]
          }, {
            name: "ring5", //紫点
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              let x0 = api.getWidth() / 2;
              let y0 = api.getHeight() / 2;
              let r = Math.min(api.getWidth(), api.getHeight()) / 2 * 1.3;
              let point = getCirlPoint(x0, y0, r, (90 + angle))
              return {
                type: 'circle',
                shape: {
                  cx: point.x,
                  cy: point.y,
                  r: 4
                },
                style: {
                  stroke: "#8450F9", //绿
                  fill: "#8450F9"
                },
                silent: true
              };
            },
            data: [0]
          },
          // 蓝色

          {
            name: "ring5",
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              return {
                type: 'arc',
                shape: {
                  cx: api.getWidth() / 2,
                  cy: api.getHeight() / 2,
                  r: Math.min(api.getWidth(), api.getHeight()) / 2 * 0.3,
                  startAngle: (180 + angle) * Math.PI / 180,
                  endAngle: (270 + angle) * Math.PI / 180
                },
                style: {
                  stroke: "#4386FA",
                  fill: "transparent",
                  lineWidth: 1.5
                },
                silent: true
              };
            },
            data: [0]
          },
          {
            name: "ring5", // 蓝色
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              let x0 = api.getWidth() / 2;
              let y0 = api.getHeight() / 2;
              let r = Math.min(api.getWidth(), api.getHeight()) / 2 * 0.6;
              let point = getCirlPoint(x0, y0, r, (180 + angle))
              return {
                type: 'circle',
                shape: {
                  cx: point.x,
                  cy: point.y,
                  r: 4
                },
                style: {
                  stroke: "#4386FA", //绿
                  fill: "#4386FA"
                },
                silent: true
              };
            },
            data: [0]
          },

          {
            name: "ring5",
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              return {
                type: 'arc',
                shape: {
                  cx: api.getWidth() / 2,
                  cy: api.getHeight() / 2,
                  r: Math.min(api.getWidth(), api.getHeight()) / 2 * 0.65,
                  startAngle: (270 + -angle) * Math.PI / 180,
                  endAngle: (40 + -angle) * Math.PI / 180
                },
                style: {
                  stroke: "#0CD3DB",
                  fill: "transparent",
                  lineWidth: 1.5
                },
                silent: true
              };
            },
            data: [0]
          },
          // 橘色

          {
            name: "ring5",
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              return {
                type: 'arc',
                shape: {
                  cx: api.getWidth() / 2,
                  cy: api.getHeight() / 2,
                  r: Math.min(api.getWidth(), api.getHeight()) / 2 * 0.8,
                  startAngle: (90 + -angle) * Math.PI / 180,
                  endAngle: (220 + -angle) * Math.PI / 180
                },
                style: {
                  stroke: "#FF8E89",
                  fill: "transparent",
                  lineWidth: 1.5
                },
                silent: true
              };
            },
            data: [0]
          }, {
            name: "ring5",
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              let x0 = api.getWidth() / 2;
              let y0 = api.getHeight() / 2;
              let r = Math.min(api.getWidth(), api.getHeight()) / 2 * 0.65;
              let point = getCirlPoint(x0, y0, r, (90 + -angle))
              return {
                type: 'circle',
                shape: {
                  cx: point.x,
                  cy: point.y,
                  r: 4
                },
                style: {
                  stroke: "#FF8E89", //粉
                  fill: "#FF8E89"
                },
                silent: true
              };
            },
            data: [0]
          }, {
            name: "ring5", //绿点
            type: 'custom',
            coordinateSystem: "none",
            renderItem: function (params, api) {
              let x0 = api.getWidth() / 2;
              let y0 = api.getHeight() / 2;
              let r = Math.min(api.getWidth(), api.getHeight()) / 2 * 0.65;
              let point = getCirlPoint(x0, y0, r, (270 + -angle))
              return {
                type: 'circle',
                shape: {
                  cx: point.x,
                  cy: point.y,
                  r: 4
                },
                style: {
                  stroke: "#0CD3DB", //绿
                  fill: "#0CD3DB"
                },
                silent: true
              };
            },
            data: [0]
          }, {
            name: '',
            type: 'pie',
            radius: ['62%', '70%'],
            silent: true,
            clockwise: true,
            startAngle: 90,
            z: 0,
            zlevel: 0,
            label: {
                position: "center",
            },
            data: [{
              value: value,
              name: "",
              itemStyle: {
                  color: { // 完成的圆环的颜色
                    colorStops: [{
                      offset: 0,
                      color: '#A098FC' // 0% 处的颜色
                    },
                      {
                        offset: 0.3,
                        color: '#4386FA' // 0% 处的颜色
                      },
                      {
                        offset: 0.6,
                        color: '#4FADFD' // 0% 处的颜色
                      },
                      {
                        offset: 0.8,
                        color: '#0CD3DB' // 100% 处的颜色
                      }, {
                        offset: 1,
                        color: '#646CF9' // 100% 处的颜色
                      }
                    ]
                  },
              }
            },
              {
                value: 100 - value,
                name: "",
                label: {
                    show: false
                },
                itemStyle: {
                    color: "#173164"
                }
              }
            ]
          },
          {
            name: '产线状态',
            type: 'pie',
            radius: ['92%', '95%'],
            silent: true,
            clockwise: true,
            startAngle: 270,
            z: 0,
            zlevel: 0,
            label: {
                position: "center",
            },
            data: [{
              value: value,
              name: "",
              itemStyle: {
                  color: { // 完成的圆环的颜色
                    colorStops: [{
                      offset: 0,
                      color: '#00EDF3' // 0% 处的颜色
                    }, {
                      offset: 1,
                      color: '#646CF9' // 100% 处的颜色
                    }]
                  },
              }
            },
              {
                value: 100 - value,
                name: "",
                label: {
                    show: false
                },
                itemStyle: {
                    color: "#173164"
                }
              }
            ]
          },

        ]
      };

      //获取圆上面某点的坐标(x0,y0表示坐标，r半径，angle角度)
      function getCirlPoint(x0, y0, r, angle) {
        let x1 = x0 + r * Math.cos(angle * Math.PI / 180)
        let y1 = y0 + r * Math.sin(angle * Math.PI / 180)
        return {
          x: x1,
          y: y1
        }
      }

      const draw = () => {
        if (!this.myChart) return;
        angle = angle + 3
        this.myChart.setOption(option, true)
      }

      this.timerId = setInterval(() => {
        draw()
      }, 100);

      this.myChart.setOption(option);
    },

    cleanup() {
      // 清除定时器
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
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