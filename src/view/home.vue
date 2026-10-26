<template>
  <div class="container">
    <div class="screen-grid"></div>
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
    <div class="main-stage">
    <div class="home">
      <FactoryScene :machines="machineRows.flat()" @select="showPop" />
    </div>
      <lineDefectInsights @statistics-change="updateShiftStatistics" />
    <div class="data">
      <productionInsights :line-data="list" :score-rows="shiftScoreRows" :score-context="shiftScoreContext" />
    </div>
    </div>
    <pop ref="pop" :lineData="currentMachineData" @close="onPopClose"></pop>
  </div>
</template>

<script>
import {getlineInfo} from "@/api/api/LargeScreenData.js";
import { logout } from "@/api/api/Auth.js";
import { isDemoMode, exitDemo } from '@/api/demoData';
import { ElMessage } from 'element-plus'
import top from "./components/top/index.vue";
import productionInsights from "./components/productionInsights/index.vue";
import lineDefectInsights from "./components/lineDefectInsights/index.vue";
import FactoryScene from "./components/factoryScene/index.vue";
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
      shiftScoreRows: Array.from({ length: 9 }, (_, i) => ({ name: `高${i + 1}`, value: null, note: '等待数据' })),
      shiftScoreContext: '当前班次',
      highlightTimer: null,
      dataInterval: null, // 数据请求定时器
      isLineDataLoading: false,
      currentPop: null, // 当前显示的pop
      currentMachine: null,
      currentMachhine:null,
      currentMachineData: null, // 专门存储当前选中产线的实时数据
      machineRows: [
        [
          { name: '高1产线', des:'gao1', img: machineStop, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高2产线', des:'gao2', img: machineStop, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高3产线', des:'gao3', img: machineStop, isUsing: false, showPop: false, faultPoints: [] }
        ],
        [
          { name: '高4产线', des:'gao4', img: machineStop, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高5产线', des:'gao5', img: machineStop, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高6产线', des:'gao6', img: machineStop, isUsing: false, showPop: false, faultPoints: [] }
        ],
        [
          { name: '高7产线', des:'gao7', img: machineStop, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高8产线', des:'gao8', img: machineStop, isUsing: false, showPop: false, faultPoints: [] },
          { name: '高9产线', des:'gao9', img: machineStop, isUsing: false, showPop: false, faultPoints: [] }
        ]
      ]
    }
  },
  components: {
    top,
    productionInsights,
    lineDefectInsights,
    FactoryScene,
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
    updateShiftStatistics({ rows, context }) {
      this.shiftScoreRows = rows;
      this.shiftScoreContext = context;
    },
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
        ElMessage.warning(this.list.length ? `${machine.name}暂无数据，暂时无法查看详情` : '尚未获取到产线数据，请检查后端连接后重试');
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
      if (isDemoMode()) { exitDemo(); return; }
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
  height: 25vh;
  position: relative;
  z-index: 3;
  padding: 0 12px 10px;
  box-sizing: border-box;
}
@keyframes rotateRing {
  to { transform: rotate(360deg); }
}
/* 设备在左侧保持三行三列，右侧独立展示班次统计。 */
.main-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320PX, 26%);
  grid-template-rows: minmax(0, 1fr) 29vh;
  gap: 18PX;
  height: 93vh;
  padding: 18PX 24PX 14PX;
  box-sizing: border-box;
  position: relative;
  z-index: 2;
}
.home { position: relative; height: 100%; min-width: 0; min-height: 0; }
.main-stage > .home { grid-column: 1; grid-row: 1; }
.main-stage > .line-insights { grid-column: 2; grid-row: 1; }
.main-stage > .data { grid-column: 1 / 3; grid-row: 2; height: 100%; padding: 0; min-width: 0; min-height: 0; }
@media (max-width: 1400PX) {
  .main-stage { grid-template-columns: minmax(0, 1fr) minmax(310PX, 28%); gap: 10PX; padding: 12PX; }
}
</style>
