<template>
  <div class="container">
    <div class="screen-grid"></div>
    <div class="screen-scan"></div>
    <div class="screen-ring ring-left"></div>
    <div class="screen-ring ring-right"></div>
    <div class="top">
      <top name="检测监控大屏" class="wow fadeInDown" data-wow-delay="0.2s"></top>
      <button class="logout-btn" type="button" @click="handleLogout">
        <span class="logout-icon"></span>
        退出登录
      </button>
    </div>
    <!-- 总览数据区域 -->
<!--    <div class="overview-section">-->
<!--      <overData />-->
<!--    </div>-->
    <div class="home">
      <div class="stage-orbit"></div>
      <div class="stage-light"></div>
      <div class="depth-floor"></div>
      <div class="machine-grid">
        <div class="machine-row" v-for="(row, rowIndex) in machineRows" :key="rowIndex">
          <div
              class="machine-item"
              v-for="(machine, colIndex) in row"
              :key="colIndex"
              :class="getMachineClass(rowIndex, colIndex)"
          >
            <div class="machine-content" @click.stop="showPop(machine, $event)">
              <div class="machine-img-status">
                <div class="machine-img-container" :class="{ 'running': machine.isUsing }">
                  <img :src="machine.img" :alt="machine.name" class="machine-img">
                </div>
                <!-- 故障监测点显示 -->
                <div class="fault-points" v-if="machine.faultPoints && machine.faultPoints.length > 0">
                  <div class="fault-title">故障监测点:</div>
                  <div
                      class="fault-point"
                      v-for="(point, index) in machine.faultPoints"
                      :key="index"
                  >
                    {{ point.point }}
                  </div>
                </div>
              </div>
              <div class="machine-name">
                <span>{{ machine.name }}</span>
                <em>{{ machine.isUsing ? 'RUNNING' : 'OFFLINE' }}</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="data">
      <div class="item1">
        <item icon="icon-wenshidu" name="产线产量实时曲线图" :duration="0.5" :delay="0.5">
          <item2 :lineData="list"></item2>
        </item>
      </div>
      <div class="item1">
        <item icon="icon-shigushangbao-xuanzhong" name="产线剔除数实时柱状图" :duration="0.5" :delay="1">
          <item3 :lineData="list"></item3>
        </item>
      </div>
      <!-- 在 home.vue 中修改 -->
      <div class="item1">
        <item name="产线状态监测" :duration="0.5" :delay="1">
          <item7 :lineData="list"></item7>
        </item>
      </div>
    </div>
    <pop ref="pop" :lineData="currentMachineData" @close="onPopClose"></pop>
  </div>
</template>

<script>
import {getlineInfo} from "@/api/api/LargeScreenData.js";
import { logout } from "@/api/api/Auth.js";
import { ElMessage } from 'element-plus'
import top from "./components/top/index.vue";
import item from "./components/item/index.vue";
import items from "./components/items/index.vue";
import item2 from "./components/item2/index.vue";
import item3 from "./components/item3/index.vue";
import item7 from "./components/item7/index.vue";
import pop from "@/components/pop/index.vue";
import overData from "./components/overData/overData.vue"

// 导入图片
import machineImg from "../assets/image/machine.png";
import machineError from "../assets/image/machine_error.png"
import machineStop from "../assets/image/machine_stop.png"

export default {
  data() {
    return {
      list: [],
      highlightTimer: null,
      dataInterval: null, // 数据请求定时器
      isLineDataLoading: false,
      currentPop: null, // 当前显示的pop
      currentMachine: null,
      currentMachhine:null,
      currentMachineData: null, // 专门存储当前选中产线的实时数据
      machineRows: [
        [
          { name: '高1产线', des:'gao1', img: machineImg, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高2产线', des:'gao2', img: machineImg, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高3产线', des:'gao3', img: machineImg, isUsing: false, showPop: false, faultPoints: [] }
        ],
        [
          { name: '高4产线', des:'gao4', img: machineImg, isUsing: true, showPop: false, faultPoints: [] },
          { name: '高5产线', des:'gao5', img: machineImg, isUsing: true, showPop: false, faultPoints: [] },
          { name: '高6产线', des:'gao6', img: machineImg, isUsing: true, showPop: false, faultPoints: [] }
        ],
        [
          { name: '高7产线', des:'gao7', img: machineImg, isUsing: true, showPop: false, faultPoints: [] },
          { name: '高8产线', des:'gao8', img: machineImg, isUsing: true, showPop: false, faultPoints: [] },
          { name: '高9产线', des:'gao9', img: machineImg, isUsing: true, showPop: false, faultPoints: [] }
        ]
      ]
    }
  },
  components: {
    top,
    item,
    items,
    item2,
    item3,
    item7,
    pop,
    overData
  },
  beforeDestroy() {
    this.clearDataInterval();
  },
  beforeUnmount() {
    this.clearDataInterval();
  },
  methods: {
    clearDataInterval() {
    // 清除所有定时器
      if (this.highlightTimer) {
        clearInterval(this.highlightTimer);
        this.highlightTimer = null;
      }
      if (this.dataInterval) {
        clearInterval(this.dataInterval);
        this.dataInterval = null;
      }
    },
    // 根据行列索引生成位置类名
    getMachineClass(rowIndex, colIndex) {
      return `pos-${rowIndex}-${colIndex}`;
    },
    normalizeLine(line) {
      const rawLine = String(line || '').trim();
      const matched = rawLine.match(/(?:高|gao)\s*(\d+)/i);
      return matched ? `gao${matched[1]}` : rawLine;
    },
    // 移除高亮闪烁动画方法
    // 点击产线显示pop
    async showPop(machine, event) {
      // 如果点击的是当前已选中的产线，则关闭
      if (this.currentMachine === machine) {
        this.closePop();
        return;
      }

      // 查找匹配的产线数据
      const machineData = this.list.find(item => this.normalizeLine(item.line) === machine.des);
      if (!machineData) {
        this.closePop();
        return;
      }

      // 更新当前选中的机器和数据
      this.currentMachine = machine;
      this.currentMachineData = machineData; // 存储实时数据

      // 获取位置信息
      const machineElement = event?.currentTarget;
      if (!machineElement) return;
      const rect = machineElement.getBoundingClientRect();

      // 直接显示新的 pop，不需要延迟
      await this.$refs.pop.getShow({
        title: machine.name,
        position: {
          top: rect.top + window.scrollY + rect.height / 2 - 80,
          left: rect.right + window.scrollX + 50
        }
      });
    },

    // 添加关闭 pop 的方法
    closePop() {
      this.currentMachine = null;
      this.currentMachhine = [];
      this.$refs.pop.getHide();
    },
    onPopClose() {
      this.currentMachine = null;
      this.currentMachhine = [];
    },
    // 在 home.vue 的 getLineData 方法中
    async getLineData() {
      if (this.isLineDataLoading) return;
      this.isLineDataLoading = true;

      try {
        const data = {};
        const res = await getlineInfo(data);
        const lineList = Array.isArray(res?.data) ? res.data : [];

        // 统一格式化数据
        const formattedData = lineList.map(item => ({
          ...item,
          line: this.normalizeLine(item.line)
        }));

        // 每轮请求都替换为新数组引用，确保底部图表跟随接口轮询刷新。
        this.list = formattedData;
        this.updateMachineStatus();
      } catch (error) {
        console.error('获取产线数据失败:', error);
      } finally {
        this.isLineDataLoading = false;
      }
    },
    async handleLogout() {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');

      try {
        if (token) {
          await logout(token);
        }
        ElMessage.success('已退出登录');
      } catch (error) {
        ElMessage.warning(error?.response?.data?.message || '退出接口调用失败，已清除本地登录状态');
      } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        this.$router.replace('/login');
      }
    },
    updateMachineStatus() {
      this.machineRows.forEach(row => {
        row.forEach(machine => {
          // 查找对应的产线数据
          const machineData = this.list.find(item => this.normalizeLine(item.line) === machine.des);

          if (!machineData) {
            // 如果没有对应数据，设置图片为空
            machine.img = machineStop;
            machine.faultPoints = [];
            machine.isUsing = false;
          } else {
            // 检查 points 中是否有 status 为 false 的情况
            const failedPoints = machineData.points ?
                machineData.points.filter(point => point.status === false) : [];

            if (failedPoints.length > 0) {
              // 有失败的检测点，设置为错误图片并记录故障点
              machine.img = machineError;
              machine.isUsing = false;
              machine.faultPoints = failedPoints;
            } else {
              // 正常状态，设置为机器图片
              machine.img = machineImg;
              machine.isUsing = true;
              machine.faultPoints = [];
            }
          }

          // 如果当前显示的pop对应这个机器，更新pop数据
          if (this.currentMachine && this.currentMachine.des === machine.des) {
            this.currentMachineData = machineData;
          }
        });
      });
    },
    // 进入全屏
    // enterFullscreen() {
    //   // 尝试使用全屏 API
    //   const element = document.documentElement;
    //   if (element.requestFullscreen) {
    //     element.requestFullscreen().catch(err => {
    //       console.log('自动全屏失败，尝试模拟 F11:', err);
    //       this.simulateF11();
    //     });
    //   } else {
    //     this.simulateF11();
    //   }
    // },
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
  background:
      radial-gradient(circle at 24% 24%, rgba(0, 226, 255, 0.18), transparent 28%),
      radial-gradient(circle at 76% 64%, rgba(255, 204, 102, 0.10), transparent 25%),
      linear-gradient(135deg, #030816 0%, #071b34 45%, #06101f 100%);
  background-size: cover;
  background-position: 0% 100%; /* x轴0%（左对齐），y轴100%（底部对齐） */
  background-repeat: no-repeat;
  overflow: hidden;
}
.container::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: url("../assets/image/back_img.png") center bottom / 100% 100% no-repeat;
  opacity: 0.38;
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
  height: 7vh;
  position: relative;
  z-index: 5;
}
.logout-btn {
  position: absolute;
  right: 34px;
  top: 38px;
  z-index: 20;
  height: 36px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(101, 213, 255, 0.55);
  border-radius: 4px;
  color: #bdefff;
  background: linear-gradient(90deg, rgba(0, 67, 157, 0.55), rgba(2, 18, 45, 0.7));
  box-shadow: 0 0 18px rgba(0, 183, 255, 0.22), inset 0 0 16px rgba(0, 183, 255, 0.12);
  cursor: pointer;
  font-size: 14px;
  letter-spacing: 1px;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.logout-btn:hover {
  transform: translateY(-2px);
  border-color: #ffcc66;
  color: #fff;
  box-shadow: 0 0 24px rgba(255, 204, 102, 0.22), inset 0 0 18px rgba(101, 213, 255, 0.16);
}
.logout-icon {
  width: 14px;
  height: 14px;
  position: relative;
  display: inline-block;
  border: 2px solid currentColor;
  border-right: 0;
  border-radius: 2px;
  right: 7px;
  top: 0.5px;
}
.logout-icon::before {
  content: '';
  position: absolute;
  width: 9px;
  height: 2px;
  right: -7px;
  top: 5px;
  background: currentColor;
}
.logout-icon::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  right: -8px;
  top:3px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
}
.overview-section {
  width: 100%;
  height: 12vh;
  flex-shrink: 0;
}
.data{
  width: 100%;
  height: 20vh;
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 10px;
  position: relative;
  z-index: 3;
  padding: 0 12px 10px;
  box-sizing: border-box;
}
.home {
  width: 100%;
  height: 68vh;
  display: flex;
  justify-content: center;
  align-items: center;

  background-size: 100% 100%;
  position: relative;
  z-index: 2;
  perspective: 1200px;
  perspective-origin: 50% 42%;
}
.stage-orbit {
  position: absolute;
  width: 74vw;
  height: 42vh;
  left: 50%;
  top: 48%;
  transform: translate(-50%, -50%) perspective(900px) rotateX(58deg);
  border: 1px solid rgba(101, 213, 255, 0.26);
  border-radius: 50%;
  box-shadow:
      0 0 45px rgba(0, 221, 255, 0.12),
      inset 0 0 38px rgba(0, 221, 255, 0.08);
  pointer-events: none;
}
.stage-orbit::before,
.stage-orbit::after {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  border: 1px dashed rgba(255, 204, 102, 0.22);
}
.stage-orbit::after {
  inset: 21%;
  border-color: rgba(101, 213, 255, 0.18);
  animation: rotateRing 18s linear infinite;
}
.stage-light {
  position: absolute;
  width: 76vw;
  height: 35vh;
  left: 50%;
  bottom: 4vh;
  transform: translateX(-50%);
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(0, 194, 255, 0.22), rgba(0, 64, 120, 0.06) 46%, transparent 72%);
  filter: blur(3px);
}
.depth-floor {
  position: absolute;
  width: 86vw;
  height: 48vh;
  left: 50%;
  bottom: 2vh;
  transform: translateX(-50%) rotateX(62deg);
  transform-origin: center bottom;
  pointer-events: none;
  border-radius: 50%;
  background:
      linear-gradient(rgba(101, 213, 255, 0.12) 1px, transparent 1px),
      linear-gradient(90deg, rgba(101, 213, 255, 0.12) 1px, transparent 1px),
      radial-gradient(ellipse at center, rgba(0, 194, 255, 0.16), rgba(0, 42, 94, 0.06) 45%, transparent 70%);
  background-size: 44px 44px, 44px 44px, 100% 100%;
  box-shadow: inset 0 0 65px rgba(0, 194, 255, 0.08);
  mask-image: radial-gradient(ellipse at center, #000 0%, #000 55%, transparent 78%);
  animation: floorDrift 12s linear infinite;
}
.depth-floor::before,
.depth-floor::after {
  content: '';
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  border: 1px solid rgba(101, 213, 255, 0.2);
}
.depth-floor::after {
  inset: 28%;
  border-style: dashed;
  border-color: rgba(255, 204, 102, 0.22);
}

/* 九宫格机器布局 */
.machine-grid {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: -20px;
  width: 80%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  pointer-events: none;
}

.machine-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  flex: 1;
  position: relative;
  transform-style: preserve-3d;
  pointer-events: none;
}

.machine-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex: 1;
  max-width: 300px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  filter: drop-shadow(0 18px 22px rgba(0, 0, 0, 0.35));
  transform-style: preserve-3d;
  pointer-events: none;

  &:hover {
    z-index: 20;
    filter: drop-shadow(0 24px 30px rgba(0, 0, 0, 0.48));
    .machine-img {
      transform: translateZ(26px) rotateX(3deg) rotateY(-5deg) scale(1.055);
      filter: drop-shadow(0 0 24px rgba(101, 213, 255, 0.45));
    }
    .machine-name {
      border-color: rgba(255, 204, 102, 0.72);
      color: #fff;
    }
  }
}
/* 为每个产线定义单独的位置和大小调整 - 近大远小效果 */
.machine-item.pos-0-0 {
  transform: translate3d(17vw, -3vh, -120px) rotateX(4deg) rotateZ(-2deg) scale(0.7);
  z-index: 2;
  opacity: 0.86;
}

.machine-item.pos-0-1 {
  transform: translate3d(8vw, 3vh, -95px) rotateX(4deg) rotateZ(-1deg) scale(0.75);
  z-index: 3;
  opacity: 0.9;
}

.machine-item.pos-0-2 {
  transform: translate3d(-3vw, 8vh, -70px) rotateX(4deg) rotateZ(1deg) scale(0.8);
  z-index: 4;
  opacity: 0.93;
}

.machine-item.pos-1-0 {
  transform: translate3d(8vw, -10vh, -35px) rotateX(4deg) rotateZ(-2deg) scale(0.85);
  z-index: 30;
}

.machine-item.pos-1-0 .machine-content {
  z-index: 31;
}

.machine-item.pos-1-1 {
  transform: translate3d(-4vw, -4vh, 0) rotateX(4deg) scale(0.9);
  z-index: 6;
}

.machine-item.pos-1-2 {
  transform: translate3d(-12vw, 2vh, 35px) rotateX(4deg) rotateZ(1deg) scale(0.95);
  z-index: 7;
}

.machine-item.pos-2-0 {
  transform: translate3d(-5vw, -15vh, 70px) rotateX(4deg) rotateZ(-2deg) scale(1);
  z-index: 8;
}

.machine-item.pos-2-1 {
  transform: translate3d(-10vw, -8vh, 95px) rotateX(4deg) scale(1.05);
  z-index: 9;
}

.machine-item.pos-2-2 {
  transform: translate3d(-15vw, -2vh, 120px) rotateX(4deg) rotateZ(2deg) scale(1.06);
  z-index: 10;
}

.machine-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: -10px;
  transform-origin: center;
  position: relative;
  transform-style: preserve-3d;
  pointer-events: auto;
}
.machine-content::before {
  content: '';
  position: absolute;
  width: 78%;
  height: 34px;
  left: 50%;
  top: 112px;
  transform: translateX(-50%) rotateX(68deg) translateZ(-22px);
  transform-origin: center;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.52), rgba(0, 34, 78, 0.25) 48%, transparent 76%);
  filter: blur(4px);
  pointer-events: none;
}

.machine-img-container {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  padding: 6px;
  background: linear-gradient(145deg, rgba(0, 38, 72, 0.28), rgba(0, 0, 0, 0.02));
  transform-style: preserve-3d;

  &.running::before {
    content: '';
    position: absolute;
    top: 34%;
    left: -8%;
    width: 42%;
    height: 64%;
    background: linear-gradient(60deg,
        transparent,
        rgba(64, 158, 255, 0.28) 48%,
        transparent);
    animation: runningShimmer 3.2s infinite;
    z-index: 2;
    transform: rotate(-24deg);
    transform-origin: center;
    pointer-events: none;
  }
}
.machine-img-container::after {
  content: '';
  position: absolute;
  left: 11%;
  right: 11%;
  bottom: 6px;
  height: 16px;
  transform: translateZ(-18px) rotateX(72deg);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(101, 213, 255, 0.28), rgba(0, 194, 255, 0.08) 44%, transparent 72%);
  filter: blur(2px);
  pointer-events: none;
}

.machine-img {
  width: 280px; /* 稍微增大基础尺寸 */
  height: 140px;
  object-fit: contain;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  transform: translateZ(12px) rotateX(5deg) rotateY(-4deg);
  transform-origin: center bottom;
  filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.32)) drop-shadow(0 0 12px rgba(101, 213, 255, 0.12));
}

.machine-name {
  min-width: 130px;
  color: #bdefff;
  font-size: 16px;
  text-align: center;
  background: linear-gradient(90deg, rgba(2, 18, 45, 0.82), rgba(0, 67, 157, 0.55), rgba(2, 18, 45, 0.82));
  border: 1px solid rgba(101, 213, 255, 0.38);
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
  margin-top: 5px;
  box-shadow: 0 0 16px rgba(0, 183, 255, 0.14), inset 0 0 14px rgba(0, 183, 255, 0.1);
  span,
  em {
    display: block;
  }
  em {
    margin-top: 2px;
    color: #ffcc66;
    font-size: 10px;
    font-family: DIN-Bold;
    font-style: normal;
    letter-spacing: 2px;
  }
}

.fault-points {
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  padding: 10px 12px;
  min-width: 120px;
  max-width: 140px;
  color: white;
  font-size: 12px;
  box-shadow: 0 4px 15px rgba(255, 0, 0, 0.5),
  0 0 20px rgba(255, 100, 100, 0.4) inset;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  animation: pulse 2s infinite;
  transform-origin: left center;
  pointer-events: none;
}

.fault-title {
  font-weight: bold;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
  padding-bottom: 4px;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
  font-size: 13px;
  letter-spacing: 1px;
}

.fault-point {
  padding: 3px 0;
  color: #ffeb3b;
  font-weight: 500;
  text-shadow: 0 0 8px rgba(255, 235, 59, 0.8);
  position: relative;
  padding-left: 12px;
}

.fault-point::before {
  content: '●';
  position: absolute;
  left: 0;
  color: #ff4444;
  font-size: 8px;
  top: 50%;
  transform: translateY(-50%);
  animation: blink 1.5s infinite;
}

@keyframes runningShimmer {
  0% {
    transform: rotate(-24deg) translate3d(-20%, 45%, 0);
    opacity: 0;
  }
  18% {
    opacity: 1;
  }
  100% {
    transform: rotate(-24deg) translate3d(300%, 8%, 0);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(255, 0, 0, 0.5),
    0 0 20px rgba(255, 100, 100, 0.4) inset;
  }
  50% {
    box-shadow: 0 4px 25px rgba(255, 0, 0, 0.7),
    0 0 25px rgba(255, 100, 100, 0.6) inset;
  }
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
    text-shadow: 0 0 5px #ff4444;
  }
  51%, 100% {
    opacity: 0.3;
    text-shadow: none;
  }
}

.machine-img-status {
  display: flex;
  align-items: center;
  gap: 8px;
  transform-origin: center;
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

@keyframes floorDrift {
  from {
    background-position: 0 0, 0 0, center;
  }
  to {
    background-position: 44px 44px, 44px 44px, center;
  }
}
</style>
