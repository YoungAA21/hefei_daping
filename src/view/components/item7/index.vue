<template>
  <div class="item7Body">
    <div class="item7Body1" v-for="i in 4" :key="'line-' + i">
      <div class="item7Body1s" :style="getMarginStyle(i)">
        <p>{{ getPercentage(i) }}<br>高{{ i }}</p>
        <div :class="getPercentage(i)==='0%'?'bg2':'bg1'">
          <img :src="getIcon(i)" alt="">
        </div>
      </div>
    </div>
  </div>
  <div class="item7Body">
    <div class="item7Body1" v-for="i in 5" :key="'line-' + (i + 4)">
      <div class="item7Body1s" style="margin-bottom: 10px">
        <p>{{ getPercentage(i + 4) }}<br>高{{ i + 4 }}</p>
        <div :class="getPercentage(i+4)==='0%'?'bg2':'bg1'">
          <img :src="getIcon(i + 4)" alt="">
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import icon1 from "./assets/icon_1.png";
import icon2 from "./assets/icon_2.png";
export default {
  data() {
    return {
      list: [],
      icon1: icon1,
      icon2: icon2
    }
  },
  props: {
    lineData: {
      type: Array,
      default: () => []
    }
  },
  components: {},
  computed: {},
  watch: {
    lineData: {
      handler(newVal, oldVal) {
        if (oldVal !== undefined && JSON.stringify(newVal) === JSON.stringify(oldVal)) {
          return;
        }
        this.list = Array.isArray(newVal) ? [...newVal] : [];
      },
      deep: true,
      immediate: true
    }
  },
  async mounted() {
    // await this.getData()
  },
  methods: {
    // 获取产线数据
    getLineData(lineNumber) {
      const lineName = `gao${lineNumber}`;
      return this.list.find(item => item.line === lineName); // 改为使用 this.list
    },
    // 计算百分比
    getPercentage(lineNumber) {
      const lineData = this.getLineData(lineNumber);
      if (!lineData) return '0%';

      const production = parseInt(lineData.production) || 0;
      const rejectionrate = parseInt(lineData.rejectionrate) || 0;

      if (production === 0) return '0%';

      // 计算百分比: (1 - 剔除率) * 100%
      const percentage = (1 - rejectionrate / production) * 100;
      return Math.max(0, Math.min(100, percentage)).toFixed(0) + '%';
    },
    // 获取图标 - 保持原来的两个图标
    getIcon(lineNumber) {
      return lineNumber <= 4 ? this.icon1 : this.icon2;
    },
    // 获取上排的margin样式
    getMarginStyle(index) {
      const margins = ['120px', '40px', '-40px', '-120px'];
      return {
        marginLeft: margins[index - 1] || '0px',
        marginTop: '10px'
      };
    }
  },
}
</script>

<style lang="scss" scoped>
.item7Body {
  position: relative;
  width: 100%;
  height: 50%;
  display: flex;
  justify-content: space-between; /* 调整为空间平均分配 */
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
  gap: 10px; /* 添加一个gap缩小容器之间的间距 */

  .item7Body1 {
    width: 48%; /* 调整为更小的宽度，以便容纳更多项 */
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: column;
    align-content: flex-start;
    position: relative;

    .item7Body1s {
      width: 100%;
      height: 70%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: nowrap;
      flex-direction: row;
      align-content: flex-start;
      position: relative;

      p {
        color: #fca607;
        font-size: 20px;
        font-family: AlibabaPuHuiTiB;
        width: 100%;
        text-align: center;
      }
    }

    .bg1 {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      z-index: -1;
      justify-content: center;
      align-items: center;
      flex-wrap: nowrap;
      flex-direction: row;
      align-content: flex-start;

      img {
        height: 170%; /* 增加图片的高度 */
        position: relative;
        display: block;
        animation: rotateIcon 4s linear infinite; /* 旋转动画 */
      }
    }
    .bg2 {
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      z-index: -1;
      justify-content: center;
      align-items: center;
      flex-wrap: nowrap;
      flex-direction: row;
      align-content: flex-start;

      img {
        height: 170%; /* 增加图片的高度 */
        position: relative;
        display: block;

      }
    }
  }

  .titleInfo {
    color: #ffffff;
    font-size: 20px;
    font-family: AlibabaPuHuiTiB;
    width: 100%;
    text-align: center;
  }
}

@keyframes rotateIcon {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
