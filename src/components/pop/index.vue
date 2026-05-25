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
    <div class="ng-mask" v-if="ngShow" @click.self="closeNgPopup">
      <div class="ng-panel">
        <div class="ng-grid"></div>
        <div class="ng-header">
          <div>
            <span>NG IMAGE</span>
            <p>{{ pointName }} 缺陷图片</p>
          </div>
          <button class="ng-close" @click="closeNgPopup">×</button>
        </div>
        <div class="ng-body">
          <div class="ng-line-panel">
            <span class="ng-panel-label">LINE INFO</span>
            <strong class="ng-line-name">{{ currentLineName }}</strong>
            <div class="ng-stat-list">
              <div class="ng-stat">
                <span>产量</span>
                <strong>{{ lineProduction }}</strong>
              </div>
              <div class="ng-stat">
                <span>剔除数</span>
                <strong class="danger">{{ lineRejectCount }}</strong>
              </div>
              <div class="ng-stat">
                <span>NG率</span>
                <strong class="warning">{{ ngRateText }}</strong>
              </div>
            </div>
          </div>

          <div class="ng-preview">
            <div class="ng-preview-title">
              <span>{{ selectedNgImage?.name || '暂无图片' }}</span>
              <em>{{ selectedNgImage?.defect || '未知缺陷' }}</em>
            </div>
            <div class="ng-preview-box">
              <img v-if="selectedNgImage?.imageUrl" :src="selectedNgImage.imageUrl" :alt="selectedNgImage.name">
              <div v-else class="ng-empty">{{ ngLoading ? '图片加载中...' : ngError || '暂无NG图片' }}</div>
            </div>
            <div class="ng-meta" v-if="selectedNgImage">
              <span>产线：{{ selectedNgImage.line }}</span>
              <span>品牌：{{ selectedNgImage.brand }}</span>
              <span>相机：{{ selectedNgImage.camera }}</span>
            </div>
          </div>
          <div class="ng-list-panel">
            <div class="ng-list-title">
              <span>机台缺陷</span>
              <em>{{ ngTotalCount }} 条</em>
            </div>
            <div class="ng-table-head">
              <span>时间</span>
              <span>缺陷</span>
              <span>操作</span>
            </div>
            <div class="ng-list" v-loading="ngLoading">
              <div
                  v-for="image in ngImages"
                  :key="image.imageUrl || image.name"
                  class="ng-row"
                  :class="{ active: selectedNgImage && selectedNgImage.imageUrl === image.imageUrl }"
                  @click="selectNgImage(image)"
              >
                <span>{{ formatTime(image.createTime) }}</span>
                <span>{{ image.defect || '其他' }}</span>
                <button title="放大预览" @click.stop="openImagePreview(image)">◎</button>
              </div>
              <div class="ng-empty-row" v-if="!ngLoading && ngImages.length === 0">
                {{ ngError || '暂无缺陷图片' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ng-zoom-mask" v-if="zoomImage" @click.self="closeImagePreview">
        <div class="ng-zoom-panel">
          <button class="ng-close ng-zoom-close" @click="closeImagePreview">×</button>
          <div class="ng-zoom-image">
            <img :src="zoomImage.imageUrl" :alt="zoomImage.name">
          </div>
          <div class="ng-zoom-info">
            <span>IMAGE DETAIL</span>
            <p>{{ zoomImage.name }}</p>
            <div class="ng-info-list">
              <div>
                <em>产线名称</em>
                <strong>{{ zoomImage.line || currentLineName }}</strong>
              </div>
              <div>
                <em>时间</em>
                <strong>{{ formatTime(zoomImage.createTime) }}</strong>
              </div>
              <div>
                <em>缺陷名称</em>
                <strong>{{ zoomImage.defect || '其他' }}</strong>
              </div>
              <div>
                <em>牌号</em>
                <strong>{{ zoomImage.brand || ngBrand }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap'
import { getNgImageList } from "@/api/api/LargeScreenData.js";

export default {
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
    },
    currentLineName() {
      return this.normalizeLine(this.lineData?.line || this.selectedNgImage?.line || '');
    },
    lineProduction() {
      return this.lineData?.production ?? 0;
    },
    lineRejectCount() {
      return this.lineData?.rejectionrate ?? 0;
    },
    ngRateText() {
      const production = Number(this.lineProduction) || 0;
      const rejectCount = Number(this.lineRejectCount) || 0;
      if (!production) return '0%';
      return `${((rejectCount / production) * 100).toFixed(3)}%`;
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
      ngShow: false,
      ngLoading: false,
      ngImages: [],
      selectedNgImage: null,
      ngError: '',
      ngPage: 1,
      ngPageSize: 100,
      ngTotalCount: 0,
      ngBrand: '黄山(金皖烟)',
      ngCamera: '0',
      zoomImage: null,
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
    async getShow(e) {
      if (this.isAnimating) {
        await this.getHide();
      }

      this.title = e.title;
      this.position = e.position || { top: 0, left: 0 };

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
    normalizeLine(line) {
      if (!line) return '';
      if (line.startsWith('gao')) {
        return `高${line.replace('gao', '')}`;
      }
      return line;
    },

    formatTime(time) {
      if (!time) return '-';
      return String(time).replace('T', ' ').slice(0, 19);
    },

    selectNgImage(image) {
      this.selectedNgImage = image;
    },

    openImagePreview(image) {
      this.selectedNgImage = image;
      this.zoomImage = image;
    },

    closeImagePreview() {
      this.zoomImage = null;
    },

    closeNgPopup() {
      this.ngShow = false;
      this.ngImages = [];
      this.selectedNgImage = null;
      this.ngError = '';
      this.zoomImage = null;
    },

    async showNgImages() {
      const line = this.normalizeLine(this.lineData?.line || '');
      if (!line || !this.pointName) {
        this.ngError = '缺少产线或检测点信息';
        this.ngShow = true;
        return;
      }

      this.ngShow = true;
      this.ngLoading = true;
      this.ngError = '';
      this.ngImages = [];
      this.selectedNgImage = null;

      try {
        const res = await getNgImageList({
          line,
          brand: this.ngBrand,
          point: this.pointName,
          camera: this.ngCamera,
          page: this.ngPage,
          pageSize: this.ngPageSize
        });
        const images = Array.isArray(res?.data) ? res.data : [];
        this.ngImages = images;
        this.ngTotalCount = res?.totalCount || images.length;
        this.selectedNgImage = images[0] || null;
        if (!images.length) {
          this.ngError = '暂无NG图片';
        }
      } catch (error) {
        console.error('获取NG图片失败:', error);
        this.ngError = '获取NG图片失败';
      } finally {
        this.ngLoading = false;
      }
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
        this.showNgImages();
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

.ng-mask {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
      radial-gradient(circle at 35% 42%, rgba(0, 194, 255, 0.13), transparent 36%),
      rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(3px);
}

.ng-panel {
  width: 92vw;
  height: 82vh;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(101, 213, 255, 0.42);
  border-radius: 8px;
  background:
      radial-gradient(circle at 16% 0%, rgba(101, 213, 255, 0.16), transparent 36%),
      linear-gradient(145deg, rgba(5, 22, 43, 0.96), rgba(2, 8, 20, 0.98));
  box-shadow:
      0 28px 82px rgba(0, 0, 0, 0.58),
      0 0 42px rgba(0, 194, 255, 0.22),
      inset 0 0 38px rgba(0, 194, 255, 0.08);
}

.ng-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
      linear-gradient(rgba(101, 213, 255, 0.055) 1px, transparent 1px),
      linear-gradient(90deg, rgba(101, 213, 255, 0.055) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 92%);
}

.ng-header {
  position: relative;
  z-index: 1;
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px 0 28px;
  border-bottom: 1px solid rgba(101, 213, 255, 0.22);
  background: linear-gradient(90deg, rgba(0, 149, 251, 0.14), transparent);
}

.ng-header span {
  display: block;
  margin-bottom: 3px;
  color: #ffcc66;
  font-family: DIN-Bold;
  font-size: 11px;
  letter-spacing: 2px;
}

.ng-header p {
  margin: 0;
  color: #eaf9ff;
  font-size: 22px;
  font-family: AlibabaPuHuiTiB;
  letter-spacing: 2px;
  text-shadow: 0 0 14px rgba(101, 213, 255, 0.45);
}

.ng-close {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(101, 213, 255, 0.38);
  border-radius: 4px;
  background: rgba(0, 149, 251, 0.12);
  color: #65d5ff;
  font-size: 22px;
  line-height: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ng-close:hover {
  color: #fff;
  border-color: rgba(255, 204, 102, 0.72);
  box-shadow: 0 0 18px rgba(255, 204, 102, 0.2);
}

.ng-body {
  position: relative;
  z-index: 1;
  height: calc(100% - 74px);
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr) 340px;
  gap: 18px;
  padding: 18px;
  box-sizing: border-box;
}

.ng-line-panel,
.ng-preview,
.ng-list-panel {
  min-height: 0;
  border: 1px solid rgba(101, 213, 255, 0.22);
  border-radius: 6px;
  background:
      linear-gradient(180deg, rgba(0, 149, 251, 0.08), rgba(2, 18, 45, 0.58)),
      radial-gradient(circle at 50% 0%, rgba(101, 213, 255, 0.1), transparent 66%);
  box-shadow: inset 0 0 22px rgba(0, 183, 255, 0.07);
}

.ng-line-panel {
  padding: 22px 18px;
  box-sizing: border-box;
  overflow: hidden;
}

.ng-panel-label {
  display: block;
  margin-bottom: 12px;
  color: #ffcc66;
  font-family: DIN-Bold;
  font-size: 12px;
  letter-spacing: 2px;
}

.ng-line-name {
  display: block;
  margin-bottom: 26px;
  color: #eaf9ff;
  font-family: AlibabaPuHuiTiB;
  font-size: 34px;
  line-height: 42px;
  letter-spacing: 2px;
  text-shadow: 0 0 18px rgba(101, 213, 255, 0.46);
  word-break: break-all;
}

.ng-stat-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ng-stat {
  min-height: 92px;
  padding: 14px 16px;
  box-sizing: border-box;
  border: 1px solid rgba(101, 213, 255, 0.2);
  border-radius: 6px;
  background:
      linear-gradient(90deg, rgba(2, 18, 45, 0.84), rgba(0, 67, 157, 0.28)),
      radial-gradient(circle at 100% 0%, rgba(101, 213, 255, 0.16), transparent 64%);
  box-shadow: inset 0 0 16px rgba(0, 183, 255, 0.08);
}

.ng-stat span {
  display: block;
  margin-bottom: 8px;
  color: #9ea8c7;
  font-size: 13px;
}

.ng-stat strong {
  display: block;
  color: #65d5ff;
  font-family: DIN-Bold;
  font-size: 34px;
  line-height: 40px;
  word-break: break-all;
}

.ng-stat strong.danger {
  color: #ff8585;
}

.ng-stat strong.warning {
  color: #ffcc66;
}

.ng-preview {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ng-preview-title {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(101, 213, 255, 0.16);
  color: #eaf9ff;
}

.ng-preview-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.ng-preview-title em {
  flex-shrink: 0;
  font-style: normal;
  color: #ffcc66;
}

.ng-preview-box {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.24);
}

.ng-preview-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid rgba(101, 213, 255, 0.2);
  box-shadow: 0 0 26px rgba(0, 0, 0, 0.34);
}

.ng-empty,
.ng-empty-row {
  color: #9ea8c7;
  font-size: 14px;
}

.ng-meta {
  height: 42px;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 16px;
  color: #bdefff;
  border-top: 1px solid rgba(101, 213, 255, 0.16);
  font-size: 13px;
}

.ng-list-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ng-list-title,
.ng-table-head,
.ng-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) 78px 54px;
  align-items: center;
}

.ng-list-title {
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(101, 213, 255, 0.18);
  color: #eaf9ff;
  font-size: 16px;
  font-weight: 700;
}

.ng-list-title em {
  grid-column: 2 / 4;
  justify-self: end;
  color: #ffcc66;
  font-style: normal;
  font-size: 13px;
}

.ng-table-head {
  height: 34px;
  padding: 0 12px;
  color: #9ea8c7;
  font-size: 12px;
  border-bottom: 1px solid rgba(101, 213, 255, 0.12);
}

.ng-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}

.ng-list::-webkit-scrollbar {
  display: none;
}

.ng-row {
  height: 38px;
  padding: 0 12px;
  color: #c8d8ee;
  font-size: 12px;
  border-bottom: 1px solid rgba(101, 213, 255, 0.08);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.ng-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ng-row:hover,
.ng-row.active {
  color: #fff;
  background: linear-gradient(90deg, rgba(0, 149, 251, 0.2), rgba(2, 18, 45, 0.18));
  box-shadow: inset 3px 0 0 #65d5ff;
}

.ng-row button {
  width: 24px;
  height: 24px;
  justify-self: center;
  border: 1px solid rgba(101, 213, 255, 0.36);
  border-radius: 4px;
  background: rgba(0, 149, 251, 0.16);
  color: #65d5ff;
  cursor: pointer;
}

.ng-row button:hover {
  color: #06101f;
  background: #65d5ff;
}

.ng-empty-row {
  padding: 28px 12px;
  text-align: center;
}

.ng-zoom-mask {
  position: fixed;
  inset: 0;
  z-index: 240;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(5px);
}

.ng-zoom-panel {
  width: 88vw;
  height: 78vh;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid rgba(101, 213, 255, 0.48);
  border-radius: 8px;
  background:
      radial-gradient(circle at 20% 0%, rgba(101, 213, 255, 0.16), transparent 34%),
      linear-gradient(145deg, rgba(5, 22, 43, 0.98), rgba(2, 8, 20, 0.99));
  box-shadow:
      0 28px 82px rgba(0, 0, 0, 0.62),
      0 0 46px rgba(0, 194, 255, 0.26),
      inset 0 0 40px rgba(0, 194, 255, 0.08);
}

.ng-zoom-close {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 2;
}

.ng-zoom-image,
.ng-zoom-info {
  min-height: 0;
  border: 1px solid rgba(101, 213, 255, 0.22);
  border-radius: 6px;
  background:
      linear-gradient(180deg, rgba(0, 149, 251, 0.08), rgba(2, 18, 45, 0.58)),
      radial-gradient(circle at 50% 0%, rgba(101, 213, 255, 0.1), transparent 66%);
}

.ng-zoom-image {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  overflow: hidden;
}

.ng-zoom-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border: 1px solid rgba(101, 213, 255, 0.22);
  box-shadow: 0 0 34px rgba(0, 0, 0, 0.38);
}

.ng-zoom-info {
  padding: 26px 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.ng-zoom-info > span {
  display: block;
  margin-bottom: 8px;
  color: #ffcc66;
  font-family: DIN-Bold;
  font-size: 12px;
  letter-spacing: 2px;
}

.ng-zoom-info > p {
  margin: 0 0 24px;
  color: #eaf9ff;
  font-size: 18px;
  line-height: 26px;
  word-break: break-all;
}

.ng-info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ng-info-list div {
  padding: 14px;
  border: 1px solid rgba(101, 213, 255, 0.18);
  border-radius: 6px;
  background: rgba(2, 18, 45, 0.58);
}

.ng-info-list em {
  display: block;
  margin-bottom: 6px;
  color: #9ea8c7;
  font-style: normal;
  font-size: 12px;
}

.ng-info-list strong {
  display: block;
  color: #fff;
  font-size: 16px;
  line-height: 22px;
  word-break: break-all;
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
