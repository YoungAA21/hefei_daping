<template>
  <div class="container">
    <div class="screen-grid"></div>
    <div class="screen-scan"></div>
    <div class="screen-ring ring-left"></div>
    <div class="screen-ring ring-right"></div>
    <div class="top">
      <div class="back-button" @click="goBack">
        <i class="icon-back"></i>
        返回首页
      </div>
      <top name="产线详情" class="wow fadeInDown" data-wow-delay="0.2s"></top>
    </div>
    <div class="home">
      <div class="detail-halo"></div>
      <div class="detail-platform"></div>
      <div class="machine">
        <div class="machine-frame"></div>
        <img class="machine_img" :src="machineImg">

        <!-- 动态生成悬浮气泡 - 支持最多6个 -->
        <div
            v-for="(point, index) in receivedPoints"
            :key="index"
            class="bubble"
            :class="[
              `bubble-${index + 1}`,
              { 'bubble-active': activeBubble === index + 1 }
            ]"
            @click="showPop(point.point)"
            :style="getBubblePosition(index)"
        >
          <div class="bubble-content">
            <div class="bubble-core"></div>
            <div class="bubble-text">
              <strong>{{ point.point }}</strong>
              <span>检测</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="data">
      <div class="item1">
        <item icon="icon-wenshidu" name="产线状态监测" :duration="0.5" :delay="0.5">
          <item4 :lineData="filteredList"></item4>
        </item>
      </div>
      <div class="item1">
        <item icon="icon-shigushangbao-xuanzhong" name="监测点运行状态监测" :duration="0.5" :delay="1">
          <item5 :lineData="filteredList"></item5>
        </item>
      </div>
      <div class="item2s">
        <items name="产线数据监测">
          <item6 :lineData="filteredList"></item6>
        </items>
      </div>
    </div>
    <pop ref="pop" :lineData="currentLineData" :point-name="currentPoint"></pop>
  </div>
</template>

<script>
import {getlineInfo} from "@/api/api/LargeScreenData.js";
import top from "./components/top/index.vue";
import item from "./components/item/index.vue";
import items from "./components/items/index.vue";
import item4 from "./components/item4/index.vue";
import item5 from "./components/item5/index.vue";
import item6 from "./components/item6/index.vue";
// 导入图片
import machineImg from "../assets/image/machine_detail.png";
import pop from "@/components/pop/index.vue";

export default {
  data() {
    return {
      list: [],
      filteredList: [],
      highlightTimer: null,
      dataInterval: null,
      currentPop: null,
      currentMachhine: null,
      currentPoint: null,
      receivedLineData: null, // 存储从路由接收的初始数据
      currentLineData: null,   // 存储实时更新的产线数据
      machineImg: machineImg,
      activeBubble: null,
      receivedPoints: [], // 接收的监测点数据
    }
  },
  components: {
    pop,
    top,
    item,
    items,
    item4,
    item5,
    item6,
  },
  beforeDestroy() {
    if (this.highlightTimer) {
      clearInterval(this.highlightTimer);
    }
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }
  },
  created() {
    this.getRouteData();
  },
  watch: {
    // 监听当前产线数据变化，确保pop组件获取最新数据
    currentLineData: {
      handler(newData) {
        if (newData && this.$refs.pop && this.$refs.pop.show) {
          // 如果pop正在显示，可以在这里触发pop更新
          console.log('产线数据已更新:', newData);
        }
      },
      deep: true
    },

    // 监听过滤后的列表数据
    filteredList: {
      handler(newList) {
        if (newList.length > 0 && this.$refs.pop && this.$refs.pop.show) {
        }
      },
      deep: true
    }
  },
  methods: {
    // 返回首页
    goBack() {
      this.$router.push('/');
    },

    getRouteData() {
      // 从路由参数中获取传递的数据
      if (this.$route.query.lineData) {
        try {
          const lineData = JSON.parse(this.$route.query.lineData);
          this.receivedLineData = lineData;
          this.currentLineData = lineData; // 初始化当前产线数据

          // 设置当前产线显示名称
          if (lineData.line) {
            const lineNumber = lineData.line.replace('gao', '');
            this.currentLineData = {
              ...lineData,
              lineName: `高${lineNumber}产线`
            };
          }
        } catch (error) {
          console.error('解析产线数据失败:', error);
        }
      }

      // 接收 filteredPoints 数据
      if (this.$route.query.filteredPoints) {
        try {
          this.receivedPoints = JSON.parse(this.$route.query.filteredPoints);
        } catch (error) {
          console.error('解析监测点数据失败:', error);
        }
      }
    },

    // 根据索引计算气泡位置 - 支持6个气泡
    getBubblePosition(index) {
      const positions = [
        { top: '25%', left: '20%' },   // 气泡1位置
        { top: '45%', left: '35%' },   // 气泡2位置
        { top: '65%', left: '50%' },   // 气泡3位置
        { top: '25%', left: '65%' },   // 气泡4位置
        { top: '45%', left: '80%' },   // 气泡5位置
        { top: '65%', left: '15%' }    // 气泡6位置
      ];

      return positions[index] || positions[0];
    },

    // 过滤数据，只保留与路由传递的产线一致的数据
    filterLineData(allData) {
      if (!this.receivedLineData || !this.receivedLineData.line) {
        return [];
      }

      const targetLine = this.receivedLineData.line;

      // 过滤出与目标产线一致的数据
      const filtered = allData.filter(item => item.line === targetLine);

      // 更新当前产线数据
      if (filtered.length > 0) {
        this.currentLineData = filtered[0];

        // 同时更新receivedPoints为最新的监测点数据
        if (filtered[0].points) {
          this.receivedPoints = filtered[0].points;
        }
      }

      return filtered;
    },

    async getLineData() {
      try {
        const data = {};
        const res = await getlineInfo(data);
        // 统一格式化数据
        const formattedData = res.data.map(item => {
          if (item.line && item.line.startsWith('高')) {
            const lineNumber = item.line.replace('高', '');
            return {
              ...item,
              line: `gao${lineNumber}`
            };
          }
          return item;
        });

        if (JSON.stringify(this.list) !== JSON.stringify(formattedData)) {
          this.list = formattedData;
          // 过滤数据，只保留当前产线
          this.filteredList = this.filterLineData(formattedData);
        }
      } catch (error) {
        console.error('获取产线数据失败:', error);
      }
    },

    // 点击产线显示pop
    async showPop(pointName) {
      this.currentPoint = pointName;
      // 获取位置信息
      const machineElement = event.currentTarget;
      const rect = machineElement.getBoundingClientRect();
      // 直接显示新的 pop，不需要延迟
      this.$refs.pop.getShow({
        title: this.currentLineData ? `高${this.currentLineData.line.replace('gao', '')}产线` : '产线详情',
        position: {
          top: rect.top + window.scrollY + rect.height / 2 - 80,
          left: rect.right + window.scrollX + 50
        }
      });
    },

    // 进入全屏
    // enterFullscreen() {
    //   // 尝试使用全屏 API
    //   const element = document.documentElement;
    //
    //   if (element.requestFullscreen) {
    //     element.requestFullscreen().catch(err => {
    //       console.log('自动全屏失败，尝试模拟 F11:', err);
    //       this.simulateF11();
    //     });
    //   } else {
    //     this.simulateF11();
    //   }
    // },
    //
    // simulateF11() {
    //   try {
    //     // 创建 F11 按键事件
    //     const f11Event = new KeyboardEvent('keydown', {
    //       key: 'F11',
    //       code: 'F11',
    //       keyCode: 122,
    //       which: 122,
    //       bubbles: true,
    //       cancelable: true
    //     });
    //     document.dispatchEvent(f11Event);
    //     // 也可以尝试直接调用浏览器全屏
    //     if (document.documentElement.webkitRequestFullscreen) {
    //       document.documentElement.webkitRequestFullscreen();
    //     }
    //   } catch (error) {
    //     console.log('模拟 F11 失败:', error);
    //   }
    // },
    //
    // checkFullscreen() {
    //   return !!(
    //       document.fullscreenElement ||
    //       document.webkitFullscreenElement ||
    //       document.msFullscreenElement
    //   );
    // },
  },
  mounted() {
    // setTimeout(() => {
    //   if (!this.checkFullscreen()) {
    //     this.enterFullscreen();
    //   }
    // }, 50);
    this.getLineData();
    // 启动5秒定时请求
    this.dataInterval = setInterval(this.getLineData, 5000);
  },
}
</script>

<style lang="scss" scoped>
.container{
  width: 100vw;
  height: 100vh;
  position: relative;
  display: grid;
  grid-template-rows: 100px minmax(0, 1fr) 24vh;
  background:
      radial-gradient(circle at 20% 18%, rgba(0, 226, 255, 0.2), transparent 28%),
      radial-gradient(circle at 80% 68%, rgba(255, 204, 102, 0.12), transparent 25%),
      linear-gradient(135deg, #030816 0%, #071b34 45%, #06101f 100%);
  background-size: cover;
  overflow: hidden;
}
.container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: url("../assets/bg.png") center / cover no-repeat;
  opacity: 0.42;
  mix-blend-mode: screen;
}
.screen-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
      linear-gradient(rgba(101, 213, 255, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(101, 213, 255, 0.07) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: linear-gradient(to bottom, transparent 0%, #000 16%, #000 82%, transparent 100%);
  z-index: 0;
}
.screen-scan {
  position: absolute;
  left: 0;
  right: 0;
  top: -20%;
  height: 20vh;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(180deg, transparent, rgba(101, 213, 255, 0.12), transparent);
  animation: screenScan 6s ease-in-out infinite;
}
.screen-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(101, 213, 255, 0.26);
  box-shadow: 0 0 42px rgba(0, 221, 255, 0.12), inset 0 0 28px rgba(0, 221, 255, 0.08);
  pointer-events: none;
  z-index: 0;
}
.ring-left {
  width: 520px;
  height: 520px;
  left: -170px;
  bottom: -240px;
  animation: rotateRing 22s linear infinite;
}
.ring-right {
  width: 340px;
  height: 340px;
  right: 5vw;
  top: -130px;
  border-color: rgba(255, 204, 102, 0.24);
  animation: rotateRing 18s linear reverse infinite;
}
.top{
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 5;
}

.top :deep(.pageTop .left) {
  position: absolute;
  right: 0;
  width: 30%;
  justify-content: flex-end;
}

.top :deep(.pageTop .left em) {
  margin-left: 0;
  margin-right: 30px;
}

.top :deep(.pageTop .title) {
  position: absolute;
  left: 50%;
  top: 0;
  width: 40%;
  transform: translateX(-50%);
}

// 返回按钮样式
.back-button {
  position: absolute;
  left: 20px;
  top: 58px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(90deg, rgba(0, 67, 157, 0.55), rgba(2, 18, 45, 0.76));
  color: #bdefff;
  border: 1px solid rgba(101, 213, 255, 0.55);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 0 0 18px rgba(0, 183, 255, 0.18), inset 0 0 16px rgba(0, 183, 255, 0.12);

  &:hover {
    color: #fff;
    border-color: rgba(255, 204, 102, 0.78);
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 0 24px rgba(255, 204, 102, 0.22), inset 0 0 18px rgba(101, 213, 255, 0.16);
  }

  .icon-back {
    font-size: 14px;
  }
}

.data{
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 10px;
  padding: 0 12px 14px;
  box-sizing: border-box;
  position: relative;
  z-index: 3;
}
.home {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-size: 100% 100%;
  position: relative;
  z-index: 2;
}
.home::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: url("../assets/image/back_img.png") center bottom / 100% 100% no-repeat;
  opacity: 0.24;
  mix-blend-mode: screen;
}
.detail-halo {
  position: absolute;
  width: 82vw;
  height: 52vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  background:
      radial-gradient(ellipse at center, rgba(0, 194, 255, 0.22), rgba(0, 64, 120, 0.07) 44%, transparent 70%);
  filter: blur(4px);
}
.detail-platform {
  position: absolute;
  width: 70vw;
  height: 36vh;
  left: 50%;
  bottom: 6vh;
  transform: translateX(-50%) perspective(900px) rotateX(62deg);
  border-radius: 50%;
  border: 1px solid rgba(101, 213, 255, 0.28);
  box-shadow: 0 0 42px rgba(0, 221, 255, 0.13), inset 0 0 32px rgba(0, 221, 255, 0.08);
  pointer-events: none;
}
.detail-platform::before,
.detail-platform::after {
  content: '';
  position: absolute;
  inset: 12%;
  border: 1px dashed rgba(255, 204, 102, 0.22);
  border-radius: 50%;
}
.detail-platform::after {
  inset: 25%;
  border-color: rgba(101, 213, 255, 0.2);
  animation: rotateRing 16s linear infinite;
}

.machine{
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 2;
}
.machine-frame {
  position: absolute;
  width: 72vw;
  height: 56vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border: 1px solid rgba(101, 213, 255, 0.22);
  box-shadow: inset 0 0 45px rgba(0, 194, 255, 0.06);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 82%, transparent 100%);
}
.machine_img{
  width: 70vw;
  height: min(58vh, 100%);
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 24px 34px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 28px rgba(101, 213, 255, 0.18));
  animation: machineBreathe 4.8s ease-in-out infinite;
}

.bubble {
  position: absolute;
  width: 150px;
  height: 58px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  animation: float 3.6s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    width: 58px;
    height: 58px;
    left: 0;
    top: 0;
    border-radius: 50%;
    border: 1px solid rgba(101, 213, 255, 0.42);
    box-shadow: 0 0 22px rgba(101, 213, 255, 0.28), inset 0 0 18px rgba(101, 213, 255, 0.16);
    animation: bubbleRadar 2.6s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 56px;
    height: 1px;
    left: 44px;
    top: 29px;
    background: linear-gradient(90deg, rgba(101, 213, 255, 0.9), rgba(255, 204, 102, 0.52), transparent);
    box-shadow: 0 0 12px rgba(101, 213, 255, 0.45);
  }

  &:hover {
    transform: translateY(-4px) scale(1.04);
    z-index: 30;

    .bubble-core {
      border-color: rgba(255, 204, 102, 0.95);
      box-shadow:
          0 0 26px rgba(255, 204, 102, 0.58),
          0 0 48px rgba(101, 213, 255, 0.38),
          inset 0 0 16px rgba(255, 255, 255, 0.32);
    }

    .bubble-text {
      border-color: rgba(255, 204, 102, 0.7);
      box-shadow: 0 0 24px rgba(255, 204, 102, 0.2), inset 0 0 18px rgba(101, 213, 255, 0.16);
    }
  }

  &.bubble-active {
    z-index: 20;
  }
}

// 为前6个气泡设置不同的动画延迟
.bubble:nth-child(1) { animation-delay: 0s; }
.bubble:nth-child(2) { animation-delay: 0.5s; }
.bubble:nth-child(3) { animation-delay: 1s; }
.bubble:nth-child(4) { animation-delay: 1.5s; }
.bubble:nth-child(5) { animation-delay: 2s; }
.bubble:nth-child(6) { animation-delay: 2.5s; }

.bubble-content {
  position: absolute;
  inset: 0;
}

.bubble-core {
  position: absolute;
  left: 8px;
  top: 8px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(189, 239, 255, 0.92);
  background:
      radial-gradient(circle at 36% 30%, rgba(255, 255, 255, 0.9), transparent 16%),
      radial-gradient(circle, rgba(101, 213, 255, 0.95) 0%, rgba(0, 102, 255, 0.75) 48%, rgba(2, 18, 45, 0.82) 100%);
  box-shadow:
      0 0 24px rgba(101, 213, 255, 0.52),
      0 0 42px rgba(0, 102, 255, 0.3),
      inset 0 0 16px rgba(255, 255, 255, 0.24);
}

.bubble-core::before,
.bubble-core::after {
  content: '';
  position: absolute;
  border-radius: 50%;
}

.bubble-core::before {
  inset: 10px;
  background: #ffcc66;
  box-shadow: 0 0 16px rgba(255, 204, 102, 0.8);
  animation: corePulse 1.8s ease-in-out infinite;
}

.bubble-core::after {
  inset: -7px;
  border: 1px dashed rgba(101, 213, 255, 0.58);
  animation: rotateRing 5s linear infinite;
}

.bubble-text {
  position: absolute;
  left: 74px;
  top: 7px;
  min-width: 86px;
  height: 44px;
  box-sizing: border-box;
  padding: 7px 12px 6px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(101, 213, 255, 0.44);
  border-radius: 4px;
  color: #fff;
  background:
      linear-gradient(90deg, rgba(2, 18, 45, 0.9), rgba(0, 67, 157, 0.58)),
      radial-gradient(circle at 0% 50%, rgba(101, 213, 255, 0.2), transparent 60%);
  box-shadow: 0 0 18px rgba(0, 183, 255, 0.16), inset 0 0 16px rgba(0, 183, 255, 0.1);
  backdrop-filter: blur(6px);
}

.bubble-text::before {
  content: '';
  position: absolute;
  left: -5px;
  top: 50%;
  width: 8px;
  height: 8px;
  border-left: 1px solid rgba(101, 213, 255, 0.54);
  border-bottom: 1px solid rgba(101, 213, 255, 0.54);
  background: rgba(2, 18, 45, 0.9);
  transform: translateY(-50%) rotate(45deg);
}

.bubble-text strong {
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  line-height: 17px;
  font-family: AlibabaPuHuiTiB;
  color: #eaf9ff;
  text-shadow: 0 0 10px rgba(101, 213, 255, 0.45);
}

.bubble-text span {
  margin-top: 1px;
  font-size: 10px;
  line-height: 12px;
  font-family: DIN-Bold;
  color: #ffcc66;
  letter-spacing: 2px;
}

// 悬浮动画
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes bubbleRadar {
  0%, 100% {
    transform: scale(0.78);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.08;
  }
}

@keyframes corePulse {
  0%, 100% {
    transform: scale(0.75);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
}

@keyframes machineBreathe {
  0%, 100% {
    filter: drop-shadow(0 24px 34px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 24px rgba(101, 213, 255, 0.16));
  }
  50% {
    filter: drop-shadow(0 24px 34px rgba(0, 0, 0, 0.45)) drop-shadow(0 0 36px rgba(101, 213, 255, 0.26));
  }
}

.bubble-active {
  animation: none !important;
}

/* 其他原有样式保持不变 */
.machine-grid {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: -20px;
  width: 80%;
  height: 100%;
  position: relative;
}

.machine-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  flex: 1;
  position: relative;
}

.machine-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: -10px;
  flex: 1;
  max-width: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    .machine-img {
      transform: scale(1.02);
    }
    .machine-name {
      background: rgba(0, 0, 0, 0.6);
    }
  }

  &.highlight {
    .machine-img {
      animation: moderateHighlight 1.2s ease-in-out;
      filter: brightness(1.15) drop-shadow(0 0 15px rgba(142, 159, 250, 0.6));
    }
  }
}

.machine-img {
  width: 620px;
  height: 150px;
  object-fit: contain;
  transition: all 0.3s ease;
}

.machine-name {
  color: #fff;
  font-size: 16px;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

@keyframes moderateHighlight {
  0%, 100% {
    filter: brightness(1.1) drop-shadow(0 0 8px rgba(142, 159, 250, 0.4));
    transform: scale(1);
  }
  50% {
    filter: brightness(1.2) drop-shadow(0 0 20px rgba(142, 159, 250, 0.8));
    transform: scale(1.02);
  }
}

.item1 {
  height: 100%;
  min-height: 0;
}

.item2s {
  height: 100%;
  min-height: 0;
}

@keyframes screenScan {
  0%, 100% {
    transform: translateY(0);
    opacity: 0;
  }
  18%, 72% {
    opacity: 1;
  }
  50% {
    transform: translateY(125vh);
  }
}

@keyframes rotateRing {
  to {
    transform: rotate(360deg);
  }
}
</style>
