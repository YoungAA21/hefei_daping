<template>
  <div class="echartsBody">
    <div class="echartsBody1" ref="echarts1"></div>
  </div>
</template>

<script>
import * as echarts from "echarts"
import gsap from 'gsap'

export default {
  name: 'echarts1',
  components: {},
  data() {
    return {
      prodata: []
    }
  },
  props: {
    list: {
      type: Array,
      default() {
        return [];
      }
    },
    shadowColor: {
      type: String,
      default() {
        return 'rgba(254, 175, 87, 0.5)';
      }
    },
    title: {
      type: String,
      default() {
        return '总数';
      }
    },
    total: {
      type: Number,
      default() {
        return 0;
      }
    },
  },
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
  computed: {
    colorList: function () {
      var that = this;
      var colorList = []
      that.list.forEach((type) => {
            if (type.checked) {
              var color = new echarts.graphic.LinearGradient(0, 0, 1, 1, [{
                offset: 0,
                color: type.color1
              }, {
                offset: 1,
                color: type.color2
              }])
              colorList.push(color)
            }
          }
      );
      return colorList
    }
  },
  methods: {
    processData(list) {
      // 初始化9个产线的数据，全部为0
      this.prodata = Array(9).fill(0);

      if (list && list.length > 0) {
        // 按顺序填充从高4开始的数据
        list.forEach((item, index) => {
          if (index < 6) { // 最多6条数据，对应高4到高9
            const rejectionrate = parseInt(item.rejectionrate) || 0;
            // 直接使用原始数据，不需要缩放
            this.prodata[index + 3] = rejectionrate;
          }
        });
      }
    },
    drawEcharts() {
      var that = this
      if (!this.$refs.echarts1) return;

      let myChart = echarts.init(this.$refs.echarts1)
      var colors = this.colorList
      var data = []
      var placeHolderStyle = {
        normal: {
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          color: 'rgba(0, 0, 0, 0)',
          borderColor: 'rgba(0, 0, 0, 0)',
          borderWidth: 0
        }
      };
      that.list.forEach((type) => {
        if (type.checked) {
          var datas = {
            ...type,
            itemStyle: {
              normal: {
                borderColor: new echarts.graphic.LinearGradient(0, 0, 1, 1, [{
                  offset: 0,
                  color: type.color1
                }, {
                  offset: 1,
                  color: type.color2
                }]),
                shadowColor: that.shadowColor
              }
            }
          }
          data.push(datas)
        }
      });

      var myColor = ['#eb2100', '#eb3600', '#d0570e', '#d0a00e', '#34da62', '#00e9db', '#00c0e9', '#0096f3', '#33CCFF', '#33FFCC'];

      // 计算合适的纵坐标最大值
      const maxDataValue = Math.max(...this.prodata);
      const yAxisMax = Math.ceil(maxDataValue / 100) * 100;

      var option = {
        backgroundColor: '#0e2147',
        grid: {
          left: '10%',
          top: '0%',
          right: '0%',
          bottom: '-10%',
          containLabel: true
        },
        // 添加 tooltip 配置
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            const data = params[0];
            const value = data.value;
            const name = data.name;
            return `${name}<br/>剔除数: ${value}`;
          }
        },
        xAxis: [{
          show: false,
        }],
        yAxis: [
          {
            axisTick: 'none',
            axisLine: 'none',
            offset: '20',
            axisLabel: {
                color: '#ffffff',
                fontSize: '10',
            },
            data: ['高1产线','高2产线','高3产线','高4产线','高5产线','高6产线','高7产线','高8产线','高9产线'],
          },
          {
            axisTick: 'none',
            axisLine: 'none',
            axisLabel: {
              show: false, // 隐藏第二个y轴的标签（数字1-9）
                color: '#ffffff',
                fontSize: '10',
            },
            data: ['9', '8', '7', '6', '5', '4', '3', '2', '1']
          },
          {
            name: '产线剔除数',
            nameGap: '50',
            nameTextStyle: {
              color: '#ffffff',
              fontSize: '10',
            },
            axisLine: {
              lineStyle: {
                color: 'rgba(0,0,0,0)'
              }
            },
            data: [],
          }
        ],
        series: [
          {
            name: '剔除数',
            type: 'bar',
            yAxisIndex: 0,
            data: this.prodata,
            label: {
                show: false, // 隐藏柱子右侧的数字
                position: 'right',
                  color: '#ffffff',
                  fontSize: '10',
            },
            barWidth: 5,
            itemStyle: {
                color: function(params) {
                  var num = myColor.length;
                  return myColor[params.dataIndex % num]
                },
            },
            z: 2
          },
          {
            name: '白框',
            type: 'bar',
            yAxisIndex: 1,
            barGap: '-100%',
            data: Array(9).fill(yAxisMax),
            barWidth: 14,
            itemStyle: {
                color: '#0e2147',
              borderRadius: 5,
            },
            z: 1
          },
          {
            name: '外框',
            type: 'bar',
            yAxisIndex: 2,
            barGap: '-100%',
            data: Array(9).fill(yAxisMax),
            barWidth: 0,
            itemStyle: {
                color: function(params) {
                  var num = myColor.length;
                  return myColor[params.dataIndex % num]
                },
              borderRadius: 5,
            },
            z: 0
          },
          {
            name: '外圆',
            type: 'scatter',
            emphasis: {
              scale: false
            },
            data: Array(9).fill(0),
            yAxisIndex: 2,
            symbolSize: 10,
            itemStyle: {
                color: function(params) {
                  var num = myColor.length;
                  return myColor[params.dataIndex % num]
                },
                opacity: 1,
            },
            z: 2
          }
        ]
      };
      myChart.clear()
      myChart.resize()
      myChart.setOption(option)
    },
  }
}
</script>

<style lang="scss" scoped>
.echartsBody {
  position: relative;
  width: 100%;
  height: calc(100% - 0px);

  .echartsBody1 {
    width: 100%;
    height: 100%;
  }
}
</style>
