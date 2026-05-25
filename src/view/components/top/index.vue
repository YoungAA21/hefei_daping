<template>
  <div class="pageTop wow fadeInDown">
    <sequence :fileLength="74" :IntervalTime="50"></sequence>
    <div class="left">
      <em>{{ currentTime }}</em>
    </div>
    <div class="title">
      <span>{{ name }}</span>
    </div>
    <div class="right"></div>
  </div>
</template>

<script>
import sequence from "./sequence/index.vue";
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'  // 导入中文语言包
import weekOfYear from 'dayjs/plugin/weekOfYear'
import weekday from 'dayjs/plugin/weekday'

dayjs.extend(weekOfYear)
dayjs.extend(weekday)
dayjs.locale('zh-cn')  // 设置语言为中文
export default {
  name: "pageTop",
  components: {sequence},
  data() {
    return {
      currentTime: ''
    }
  },
  props: {
    name: {
      type: String,
      default() {
        return '';
      }
    }
  },
  mounted() {
    this.updateTime()
    // 每秒更新一次时间
    this.interval = setInterval(this.updateTime, 1000)
  },
  beforeDestroy() {
    // 清除定时器，防止内存泄漏
    clearInterval(this.interval)
  },
  methods: {
    updateTime() {
      // 按照“2023年 01月 03日 22:08:56 星期二”的格式更新时间
      this.currentTime = dayjs().format('YYYY年 MM月 DD日 HH:mm:ss dddd')
    }
  }
}
</script>

<style lang="scss" scoped>
.pageTop {
  width: 100%;
  height: 100px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
  position: relative;

  .left {
    width: 30%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;
    position: relative;
    height: 100%;
    em{
      font-size: 18px;
      font-family: AlibabaPuHuiTiR;
      font-weight: 400;
      margin-left: 30px;
      color: #9EA8C7;
    }
  }

  .right {
    width: 30%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;
    position: relative;
    height: 100%;
  }

  .title {
    position: relative;
    width: 40%;
    height: 100%;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: flex-start;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;

    span {
      font-size: 32px;
      font-family: AlibabaPuHuiTi_2_115_Black;
      font-weight: 400;
      font-style: normal;
      letter-spacing: 10px;
      padding-top: 5px;
      background: linear-gradient(0deg, #f7f9ff 0%, #d2daf5 0%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}
</style>
