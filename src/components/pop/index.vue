<template>
  <div>
    <div class="popWin" v-if="show">
      <div class="popWinMain" ref="popWinMain">
        <div class="pop-grid"></div>
        <div class="pop-sweep"></div>
        <div class="corner corner-lt"></div>
        <div class="corner corner-rb"></div>
        <div class="headTitle" v-if="showInner && lineData">
          <div class="title-pulse"></div>
          <div>
            <span>{{ pointName === '' ? 'LINE STATUS' : 'POINT STATUS' }}</span>
            <p>{{pointName===''?"高"+(lineData.length!==0? lineData.line.substring(3, 4):'') +"产线":pointName}}</p>
          </div>
        </div>
        <!-- 产线数据内容 -->
        <div class="popContent" v-if="showInner && lineData">
          <div class="data-section">
            <div class="data-item">
              <span class="data-label">产量:</span>
              <span class="data-value production">{{ lineData.production }}</span>
            </div>
            <div class="data-item">
              <span class="data-label">剔除数:</span>
              <span class="data-value rejection">{{ lineData.rejectionrate }}</span>
            </div>
          </div>

          <div class="points-section">
            <h3>检测点状态</h3>
            <div class="points-list">
              <div
                  v-for="point in filteredPoints"
                  :key="point.point"
                  class="point-item"
                  :class="point.status ? 'status-true' : 'status-false'"
              >
                <div class="point-indicator"></div>
                <span class="point-name">{{ point.point }}</span>
                <span class="point-status">{{ point.status ? '正常' : '异常' }}</span>
              </div>
            </div>
          </div>

          <!-- 添加查看详情按钮 -->
          <div class="detail-button-section">
            <button class="detail-button" @click="goToDetail">
              {{pointName===''? '查看详情':'查看检测状态'}}
            </button>
          </div>
        </div>
        <div class="popClose" ref="popClose" @click="getHide">×</div>
      </div>
    </div>
    <ng-image-viewer
        ref="ngImageViewer"
        :line-data="lineData"
        :point-name="pointName"
    />
  </div>
</template>

<script>
import gsap from 'gsap'
import NgImageViewer from "@/components/NgImage/NgImageViewer.vue";

export default { 
  components: { NgImageViewer },
  props: {
    lineData: {
      type: Object,
      default: () => ({})
    },
    pointName: {
      type: String,
      default: ''
    }
  },
  computed: {
    filteredPoints() {
      if (!this.pointName) {
        return this.lineData.points || [];
      }
      return (this.lineData.points || []).filter(point =>
          point.point === this.pointName
      );
    }
  },
  data() {
    return {
      show: false,
      showInner: false,
      url: '',
      title: '',
      position: { top: 0, left: 0 },
      isAnimating: false,
    }
  },
  watch: {
    // 监听lineData的变化，实时更新pop内容
    lineData: {
      handler(newData) {
        if (newData && this.show) {
          // 数据更新时，可以在这里添加一些视觉反馈
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    getSafePosition(position = { top: 0, left: 0 }) {
      const margin = 16;
      const panelWidth = 285;
      const panelHeight = Math.round(window.innerHeight * 0.4);
      const maxLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - panelHeight - margin);

      return {
        left: Math.min(Math.max(position.left || margin, margin), maxLeft),
        top: Math.min(Math.max(position.top || margin, margin), maxTop)
      };
    },

    async getShow(e) {
      if (this.isAnimating) {
        await this.getHide();
      }

      this.title = e.title;
      this.position = this.getSafePosition(e.position);

      this.show = true;
      this.isAnimating = true;

      await this.$nextTick();

      gsap.set(this.$refs.popWinMain, {
        height: '0px',
        opacity: 0,
        scale: 0.92,
        rotationX: -8
      });

      return new Promise((resolve) => {
        gsap.to(this.$refs.popWinMain, {
          duration: 0.55,
          height: '40vh', // 增加高度以适应新按钮
          opacity: 1,
          scale: 1,
          rotationX: 0,
          ease: 'power3.out',
          onComplete: () => {
            this.showInner = true;
            this.isAnimating = false;
            resolve();
          }
        });
      });
    },

    getHide() {
      return new Promise((resolve) => {
        this.showInner = false;
        this.isAnimating = true;
        this.$nextTick(() => {
          gsap.to(this.$refs.popWinMain, {
            duration: 0.35,
            height: '0px',
            opacity: 0,
            scale: 0.94,
            rotationX: -6,
            ease: 'power2.in',
            onComplete: () => {
              this.show = false;
              this.isAnimating = false;
              this.$emit('close');
              resolve();
            }
          });
        });
      });
    },
    // 跳转到详情页面
    goToDetail() {
      console.log('当前监测点:', this.pointName);

      if (!this.pointName) {
        // 点击产线本身，跳转到详情页
        if (this.lineData) {
          this.getHide();
          this.$router.push({
            name: 'detail',
            query: {
              lineData: JSON.stringify(this.lineData),
              filteredPoints: JSON.stringify(this.filteredPoints)
            }
          });
        }
      } else {
        this.$refs.ngImageViewer?.open();
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.popWinBg {
  position: fixed;
  z-index: 10;
  width: 10px;
  background: rgba(0, 0, 0, 0.4);
  height: 10px;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: initial;
}

.popWin {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  position: fixed;
  z-index: 121;
  width: auto;
  top: 0;
  left: 0;
  pointer-events: none;
}

.popWinMain {
  pointer-events: initial;
  position: relative;
  overflow: hidden;
  width: 285px;
  max-width: 500px;
  z-index: 100;
  transform-origin: center center;
  top: v-bind('position.top + "px"');
  left: v-bind('position.left + "px"');
  background:
      radial-gradient(circle at 16% 0%, rgba(101, 213, 255, 0.18), transparent 34%),
      linear-gradient(145deg, rgba(7, 28, 54, 0.94), rgba(3, 10, 24, 0.96));
  border: 1px solid rgba(101, 213, 255, 0.5);
  border-radius: 8px;
  backdrop-filter: blur(14px);
  box-shadow:
      0 24px 68px rgba(0, 0, 0, 0.48),
      0 0 34px rgba(0, 194, 255, 0.22),
      inset 0 0 30px rgba(0, 194, 255, 0.08);
}

.pop-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
      linear-gradient(rgba(101, 213, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(101, 213, 255, 0.06) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.75), transparent 88%);
}

.pop-sweep {
  position: absolute;
  width: 52%;
  height: 120%;
  left: -65%;
  top: -10%;
  pointer-events: none;
  background: linear-gradient(110deg, transparent, rgba(101, 213, 255, 0.16), transparent);
  animation: popSweep 4s ease-in-out infinite;
}

.corner {
  position: absolute;
  width: 42px;
  height: 42px;
  pointer-events: none;
  border-color: #65d5ff;
  border-style: solid;
}

.corner-lt {
  left: 0;
  top: 0;
  border-width: 2px 0 0 2px;
}

.corner-rb {
  right: 0;
  bottom: 0;
  border-width: 0 2px 2px 0;
}

.headTitle {
  height: 66px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
  padding: 0 42px 0 18px;
  box-sizing: border-box;
  position: relative;
  color: #fff;
  border-bottom: 1px solid rgba(101, 213, 255, 0.22);
  background: linear-gradient(90deg, rgba(0, 149, 251, 0.14), transparent);
}

.headTitle::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #65d5ff, #ffcc66, transparent);
  animation: lineGlow 2.8s ease-in-out infinite;
}

.title-pulse {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  position: relative;
  border-radius: 50%;
  border: 1px solid rgba(101, 213, 255, 0.82);
  background:
      radial-gradient(circle, #ffcc66 0 20%, rgba(101, 213, 255, 0.45) 22% 44%, rgba(2, 18, 45, 0.9) 46%);
  box-shadow: 0 0 24px rgba(101, 213, 255, 0.45), inset 0 0 14px rgba(255, 255, 255, 0.16);
}

.title-pulse::before {
  content: '';
  position: absolute;
  inset: -8px;
  border: 1px solid rgba(101, 213, 255, 0.36);
  border-radius: 50%;
  animation: radarPulse 2.2s ease-in-out infinite;
}

.title-pulse::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 1px dashed rgba(255, 204, 102, 0.4);
  border-radius: 50%;
  animation: rotateRing 5s linear infinite;
}

.headTitle span {
  display: block;
  margin-bottom: 2px;
  color: #ffcc66;
  font-family: DIN-Bold;
  font-size: 10px;
  letter-spacing: 2px;
}

.headTitle p {
  margin: 0;
  color: #eaf9ff;
  font-size: 19px;
  font-family: AlibabaPuHuiTiB;
  letter-spacing: 2px;
  text-shadow: 0 0 14px rgba(101, 213, 255, 0.45);
}

.popContent {
  padding: 18px;
  position: relative;
  z-index: 1;
  color: #fff;
}

.data-section {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  padding: 0;
  background: none;
}

.data-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  border: 1px solid rgba(101, 213, 255, 0.28);
  border-radius: 6px;
  background:
      linear-gradient(180deg, rgba(0, 149, 251, 0.12), rgba(2, 18, 45, 0.56)),
      radial-gradient(circle at 50% 0%, rgba(101, 213, 255, 0.16), transparent 62%);
  box-shadow: inset 0 0 16px rgba(0, 183, 255, 0.08);
  animation: itemRise 0.5s ease-out both;

  .data-label {
    color: #9ea8c7;
    font-size: 12px;
    margin-bottom: 5px;
  }

  .data-value {
    font-size: 20px;
    font-weight: bold;

    &.production {
      color: #34da62; // 绿色表示产量
    }

    &.rejection {
      color: #eb2100; // 红色表示剔除数
    }
  }
}

.points-section {
  h3 {
    margin: 0 0 15px 0;
    color: #eaf9ff;
    font-size: 16px;
    font-weight: bold;
    letter-spacing: 1px;
  }
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100px; /* 设置固定高度 */
  overflow-y: auto; /* 垂直滚动 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.point-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid rgba(101, 213, 255, 0.16);
  background: linear-gradient(90deg, rgba(2, 18, 45, 0.76), rgba(0, 67, 157, 0.24));
  box-shadow: inset 0 0 12px rgba(0, 183, 255, 0.06);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  animation: itemRise 0.5s ease-out both;

  &.status-true {
    border-left: 3px solid #34da62;
  }

  &.status-false {
    border-left: 3px solid #ff4d4f;
  }

  &:hover {
    transform: translateX(4px);
    border-color: rgba(101, 213, 255, 0.38);
    box-shadow: 0 0 18px rgba(0, 183, 255, 0.14), inset 0 0 14px rgba(0, 183, 255, 0.1);
  }
}

.point-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  .status-true & {
    background: #34da62;
    box-shadow: 0 0 8px #34da62;
  }

  .status-false & {
    background: #ff4d4f;
    box-shadow: 0 0 8px #ff4d4f;
  }
}

.point-name {
  color: #fff;
  font-size: 14px;
  flex: 1;
}

.point-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;

  .status-true & {
    background: rgba(52, 218, 98, 0.2);
    color: #34da62;
  }

  .status-false & {
    background: rgba(255, 77, 79, 0.18);
    color: #ff8585;
  }
}

.popClose {
  position: absolute;
  right: 12px;
  top: 13px;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(101, 213, 255, 0.35);
  background: rgba(0, 149, 251, 0.12);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #65d5ff;
  font-size: 18px;
  cursor: pointer;
  z-index: 2;
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #fff;
    border-color: rgba(255, 204, 102, 0.7);
    box-shadow: 0 0 18px rgba(255, 204, 102, 0.2);
    transform: rotate(90deg);
  }
}

.detail-button-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(101, 213, 255, 0.18);
  display: flex;
  justify-content: center;
}

.detail-button {
  width: 100%;
  height: 40px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #65d5ff 0%, #ffcc66 100%);
  color: #06101f;
  border: none;
  padding: 0 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 22px rgba(101, 213, 255, 0.28);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.48), transparent);
    transform: translateX(-120%);
    animation: buttonSweep 2.8s ease-in-out infinite;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 28px rgba(255, 204, 102, 0.32);
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes popSweep {
  0%, 100% {
    transform: translateX(0);
    opacity: 0;
  }
  35%, 70% {
    opacity: 1;
  }
  100% {
    transform: translateX(340%);
  }
}

@keyframes radarPulse {
  0%, 100% {
    transform: scale(0.75);
    opacity: 0.65;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.08;
  }
}

@keyframes rotateRing {
  to {
    transform: rotate(360deg);
  }
}

@keyframes lineGlow {
  0%, 100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}

@keyframes itemRise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes buttonSweep {
  45%, 100% {
    transform: translateX(120%);
  }
}
</style>
