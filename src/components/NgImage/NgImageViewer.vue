<template>
  <div class="ng-mask" v-if="show" @click.self="close">
    <div class="ng-panel">
      <div class="ng-grid"></div>
      <div class="ng-header">
        <div>
          <span>NG IMAGE</span>
          <p>{{ pointName }} 缺陷图片</p>
        </div>
        <button class="ng-close" @click="close">×</button>
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
            <span>{{ selectedImage?.name || '暂无图片' }}</span>
            <em>{{ selectedImage?.defect || '未知缺陷' }}</em>
          </div>
          <div class="ng-preview-box">
            <img v-if="selectedImage?.imageUrl" :src="selectedImage.imageUrl" :alt="selectedImage.name">
            <div v-else class="ng-empty">{{ loading ? '图片加载中...' : error || '暂无NG图片' }}</div>
          </div>
          <div class="ng-meta" v-if="selectedImage">
            <span>产线：{{ selectedImage.line }}</span>
            <span>品牌：{{ selectedImage.brand }}</span>
            <span>相机：{{ selectedImage.camera }}</span>
          </div>
        </div>

        <div class="ng-list-panel">
          <div class="ng-list-title">
            <span>机台缺陷</span>
            <em>{{ totalCount }} 条</em>
          </div>
          <div class="ng-table-head">
            <span>时间</span>
            <span>缺陷</span>
            <span>操作</span>
          </div>
          <div class="ng-list" v-loading="loading">
            <div
                v-for="image in images"
                :key="image.imageUrl || image.name"
                class="ng-row"
                :class="{ active: selectedImage && selectedImage.imageUrl === image.imageUrl }"
                @click="selectImage(image)"
            >
              <span>{{ formatTime(image.createTime) }}</span>
              <span>{{ image.defect || '其他' }}</span>
              <button title="放大预览" @click.stop="openImagePreview(image)">◎</button>
            </div>
            <div class="ng-empty-row" v-if="!loading && images.length === 0">
              {{ error || '暂无缺陷图片' }}
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
              <strong>{{ zoomImage.brand || defaultBrand }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getNgImageList } from "@/api/api/LargeScreenData.js";

export default {
  name: 'NgImageViewer',
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
  data() {
    return {
      show: false,
      loading: false,
      images: [],
      selectedImage: null,
      zoomImage: null,
      error: '',
      page: 1,
      pageSize: 100,
      totalCount: 0,
      defaultBrand: '黄山(金皖烟)',
      defaultCamera: '0',
    }
  },
  computed: {
    currentLineName() {
      return this.normalizeLine(this.lineData?.line || this.selectedImage?.line || '');
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
  methods: {
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
    selectImage(image) {
      this.selectedImage = image;
    },
    openImagePreview(image) {
      this.selectedImage = image;
      this.zoomImage = image;
    },
    closeImagePreview() {
      this.zoomImage = null;
    },
    close() {
      this.show = false;
      this.images = [];
      this.selectedImage = null;
      this.zoomImage = null;
      this.error = '';
      this.$emit('close');
    },
    async open() {
      const line = this.normalizeLine(this.lineData?.line || '');
      this.show = true;
      this.loading = true;
      this.error = '';
      this.images = [];
      this.selectedImage = null;
      this.zoomImage = null;

      if (!line || !this.pointName) {
        this.error = '缺少产线或检测点信息';
        this.loading = false;
        return;
      }

      try {
        const res = await getNgImageList({
          line,
          brand: this.defaultBrand,
          point: this.pointName,
          camera: this.defaultCamera,
          page: this.page,
          pageSize: this.pageSize
        });
        const images = Array.isArray(res?.data) ? res.data : [];
        this.images = images;
        this.totalCount = res?.totalCount || images.length;
        this.selectedImage = images[0] || null;
        if (!images.length) {
          this.error = '暂无NG图片';
        }
      } catch (error) {
        console.error('获取NG图片失败:', error);
        this.error = '获取NG图片失败';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
  position: relative;
  padding: 20px 18px;
  box-sizing: border-box;
  overflow: hidden;
  background:
      radial-gradient(circle at 50% 0%, rgba(101, 213, 255, 0.24), transparent 34%),
      linear-gradient(180deg, rgba(0, 149, 251, 0.1), rgba(2, 18, 45, 0.68));
}

.ng-line-panel::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 56px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(101, 213, 255, 0.9), rgba(255, 204, 102, 0.8), transparent);
  box-shadow: 0 0 18px rgba(101, 213, 255, 0.42);
}

.ng-line-panel::after {
  content: '';
  position: absolute;
  width: 170px;
  height: 170px;
  right: -78px;
  top: -72px;
  border: 1px solid rgba(101, 213, 255, 0.18);
  border-radius: 50%;
  box-shadow:
      0 0 28px rgba(101, 213, 255, 0.08),
      inset 0 0 24px rgba(101, 213, 255, 0.08);
  pointer-events: none;
}

.ng-panel-label {
  position: relative;
  z-index: 1;
  width: max-content;
  display: block;
  margin-bottom: 22px;
  padding: 5px 10px;
  border: 1px solid rgba(101, 213, 255, 0.32);
  border-radius: 3px;
  background: rgba(0, 149, 251, 0.1);
  color: #ffcc66;
  font-family: DIN-Bold;
  font-size: 12px;
  letter-spacing: 2px;
  box-shadow: inset 0 0 12px rgba(101, 213, 255, 0.08);
}

.ng-line-name {
  position: relative;
  z-index: 1;
  display: block;
  margin-bottom: 22px;
  color: #eaf9ff;
  font-family: AlibabaPuHuiTiB;
  font-size: 38px;
  line-height: 44px;
  letter-spacing: 2px;
  text-shadow:
      0 0 14px rgba(101, 213, 255, 0.58),
      0 0 28px rgba(101, 213, 255, 0.28);
  word-break: break-all;
}

.ng-stat-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ng-stat {
  position: relative;
  min-height: 86px;
  padding: 13px 14px 12px 18px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(101, 213, 255, 0.24);
  border-radius: 6px;
  background:
      linear-gradient(90deg, rgba(2, 18, 45, 0.9), rgba(0, 67, 157, 0.34)),
      radial-gradient(circle at 100% 0%, rgba(101, 213, 255, 0.2), transparent 64%);
  box-shadow:
      inset 0 0 18px rgba(0, 183, 255, 0.08),
      0 0 18px rgba(0, 183, 255, 0.08);
}

.ng-stat::before {
  content: '';
  position: absolute;
  left: 0;
  top: 13px;
  bottom: 13px;
  width: 3px;
  background: linear-gradient(180deg, transparent, #65d5ff, transparent);
  box-shadow: 0 0 14px rgba(101, 213, 255, 0.9);
}

.ng-stat::after {
  content: '';
  position: absolute;
  right: -28px;
  top: 10px;
  width: 82px;
  height: 82px;
  border: 1px dashed rgba(101, 213, 255, 0.16);
  border-radius: 50%;
  pointer-events: none;
}

.ng-stat:nth-child(2)::before {
  background: linear-gradient(180deg, transparent, #ff8585, transparent);
  box-shadow: 0 0 14px rgba(255, 133, 133, 0.7);
}

.ng-stat:nth-child(3)::before {
  background: linear-gradient(180deg, transparent, #ffcc66, transparent);
  box-shadow: 0 0 14px rgba(255, 204, 102, 0.7);
}

.ng-stat span {
  position: relative;
  z-index: 1;
  display: block;
  margin-bottom: 6px;
  color: #9ddff3;
  font-size: 12px;
  letter-spacing: 2px;
}

.ng-stat strong {
  position: relative;
  z-index: 1;
  display: block;
  color: #65d5ff;
  font-family: DIN-Bold;
  font-size: 36px;
  line-height: 42px;
  text-shadow: 0 0 18px rgba(101, 213, 255, 0.36);
  word-break: break-all;
}

.ng-stat strong.danger {
  color: #ff8585;
  text-shadow: 0 0 18px rgba(255, 133, 133, 0.32);
}

.ng-stat strong.warning {
  color: #ffcc66;
  text-shadow: 0 0 18px rgba(255, 204, 102, 0.36);
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
</style>
