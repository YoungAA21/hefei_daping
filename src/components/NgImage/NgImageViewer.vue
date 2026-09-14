<template>
  <Teleport to="body">
    <Transition name="workbench">
      <div v-if="show" ref="dialog" class="ng-mask" tabindex="-1" role="dialog" aria-modal="true" :aria-label="`${pointName}缺陷图片工作台`" @keydown="handleKeys" @click.self="close">
        <section class="ng-panel">
          <header class="ng-header">
            <div class="header-emblem"><span>NG</span></div>
            <div><span class="eyebrow">缺陷影像中心</span><h2>{{ pointName }}<span>缺陷图片工作台</span></h2></div>
            <div class="header-context"><span class="status-dot"></span>{{ currentLineName }}产线 <i>/</i> CAMERA {{ defaultCamera }}</div>
            <button class="icon-button" aria-label="关闭缺陷图片" @click="close">×</button>
          </header>
          <div class="ng-body">
            <aside class="analysis-column">
              <div class="section-label"><span>01 / 产线概览</span></div>
              <div class="line-id"><span>当前产线</span><strong>{{ currentLineName || '—' }}<small>LINE</small></strong></div>
              <div class="metric"><span>累计产量 <small>件</small></span><strong>{{ number(lineProduction) }}</strong><div class="metric-rule"></div></div>
              <div class="metric amber"><span>累计剔除 <small>件</small></span><strong>{{ number(lineRejectCount) }}</strong><div class="metric-rule"></div></div>
              <div class="ng-rate"><span>累计 NG 率</span><strong>{{ ngRateText }}</strong></div>
              <div class="distribution-heading">本页缺陷分布 <span>{{ distribution.length }} 类</span></div>
              <div class="distribution-ring"><div class="ring-orbit"></div><div class="ring-fill" :style="ringStyle"></div><div class="ring-center"><strong>{{ images.length }}</strong><span>本页图片</span></div></div>
              <div class="distribution-list"><button v-for="item in distribution" :key="item.name" class="distribution-item" :class="{ chosen: defectFilter === item.name }" :style="{'--color':item.color}" @click="filterDefect(item.name)"><span><i></i>{{ item.name }}<b>{{ item.count }}</b></span><div class="bar-track"><i :style="{width:`${item.percent}%`}"></i></div></button><span v-if="!images.length" class="muted">暂无可统计的图片</span></div>
            </aside>
            <main class="inspection-column">
              <div class="section-label"><span>02 / 图像检视</span></div>
              <div class="preview-heading"><div><h3 :title="selectedImage?.name">{{ selectedImage?.name || '暂无选中图片' }}</h3></div><span class="defect-tag" v-if="selectedImage">{{ selectedImage.defect || '其他' }}</span></div>
              <div v-if="loading" class="loading-stage"><div class="loading-orbit"></div><strong>正在调取缺陷影像</strong><span>读取所选品牌与相机的图片记录</span></div>
              <div v-else-if="error && !images.length" class="empty-stage"><span>◇</span><strong>{{ error }}</strong><button class="action-button" @click="loadNgImages">重新加载</button></div>
              <NgImageSurface v-else :src="selectedImage?.imageUrl" :name="selectedImage?.name" />
              <div class="preview-navigation"><button class="text-button" :disabled="selectedIndex <= 0" @click="moveSelection(-1)">← 上一张</button><span><b>{{ selectedIndex < 0 ? '—' : String(selectedIndex + 1).padStart(2,'0') }}</b> / {{ visibleImages.length }}</span><button class="text-button" :disabled="selectedIndex < 0 || selectedIndex >= visibleImages.length-1" @click="moveSelection(1)">下一张 →</button><button class="action-button" :disabled="!selectedImage?.imageUrl" @click="openImagePreview(selectedImage)">⛶ 放大检视</button></div>
              <div class="image-metadata"><div><span>采集时间</span><strong>{{ formatTime(selectedImage?.createTime) }}</strong></div><div><span>产品品牌</span><strong>{{ selectedImage?.brand || defaultBrand }}</strong></div><div><span>检测相机</span><strong>CAM {{ selectedImage?.camera ?? defaultCamera }}</strong></div></div>
              <div class="inspection-note"><i></i>原始缺陷影像<span>缩放后可滚动查看图像细节</span></div>
            </main>
            <aside class="catalog-column">
              <div class="section-label"><span>03 / 缺陷档案</span><em>{{ number(totalCount) }} 条</em></div>
              <div class="ng-filter-bar"><label><span>产品品牌</span><select v-model="defaultBrand" :disabled="loading" @change="handleFilterChange"><option v-for="brand in brandOptions" :key="brand" :value="brand">{{ brand }}</option></select></label><label><span>检测相机</span><select v-model="defaultCamera" :disabled="loading" @change="handleFilterChange"><option v-for="camera in cameraOptions" :key="camera" :value="camera">CAM {{ camera }}</option></select></label><button aria-label="刷新缺陷列表" :disabled="loading" @click="loadNgImages">↻</button></div>
              <div class="catalog-summary"><span>{{ defectFilter || '全部缺陷' }} · 本页 {{ visibleImages.length }} 张</span><button v-if="defectFilter" @click="filterDefect(defectFilter)">清除筛选 ×</button><span v-else>按采集时间倒序</span></div>
              <div class="ng-list">
                <div v-if="loading" class="skeleton-list"><div v-for="n in 6" :key="n" class="skeleton-row"></div></div>
                <template v-else><button v-for="(image,index) in visibleImages" :key="`${page}-${image.imageUrl}-${index}`" class="ng-row" :class="{active:selectedImage === image}" :style="{'--delay':`${Math.min(index,8)*35}ms`}" :aria-pressed="selectedImage === image" @click="selectImage(image)"><div class="thumbnail"><img v-if="image.imageUrl" :src="image.imageUrl" :alt="image.name" loading="lazy" @error="$event.target.style.display='none'"/><span>NG</span></div><div class="row-content"><div><strong>{{ image.defect || '其他' }}</strong><em>{{ String(index+1).padStart(2,'0') }}</em></div><time>{{ formatTime(image.createTime) }}</time><span :title="image.name">{{ image.name }}</span></div><span class="row-arrow">›</span></button><div v-if="!visibleImages.length" class="catalog-empty">{{ error || '当前筛选暂无图片' }}</div></template>
              </div>
              <div class="pagination"><button :disabled="loading || page <= 1" @click="changePage(-1)">上一页</button><span>{{ page }} <i>/ {{ pageCount }}</i></span><button :disabled="loading || page >= pageCount" @click="changePage(1)">下一页</button></div>
            </aside>
          </div>
          <footer class="ng-footer"><span><i></i>缺陷影像追溯 · {{ currentLineName }} / {{ pointName }}</span><span>ESC 关闭窗口</span></footer>
        </section>
        <Transition name="zoom"><div v-if="zoomImage" class="ng-zoom-mask" role="dialog" aria-modal="true" aria-label="缺陷图片放大检视" @click.self="closeImagePreview"><section class="ng-zoom-panel"><header><div><span class="eyebrow">IMAGE DETAIL</span><h3>{{ zoomImage.defect || '其他' }} · 原图检视</h3></div><button class="icon-button" aria-label="关闭放大检视" @click="closeImagePreview">×</button></header><NgImageSurface :src="zoomImage.imageUrl" :name="zoomImage.name" enlarged/><footer><span>{{ zoomImage.name }}</span><span>{{ zoomImage.line || currentLineName }} · {{ zoomImage.brand || defaultBrand }} · CAM {{ zoomImage.camera ?? defaultCamera }} · {{ formatTime(zoomImage.createTime) }}</span></footer></section></div></Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { getNgImageList } from "@/api/api/LargeScreenData.js";
import NgImageSurface from './NgImageSurface.vue';
import { resolveNgImageUrl } from "@/utils/ngImageUrl.js";

export default {
  name: 'NgImageViewer',
  components: { NgImageSurface },
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
      pageSize: 24,
      defectFilter: '',
      requestVersion: 0,
      totalCount: 0,
      defaultBrand: '黄山(金皖烟)',
      defaultCamera: '0',
      brandOptions: ['黄山(金皖烟)', '黄山(新制皖烟)'],
      cameraOptions: ['0', '1', '2', '3'],
    }
  },
  computed: {
    distribution() {
      const counts = new Map();
      this.images.forEach(image => { const name = image.defect || '其他'; counts.set(name, (counts.get(name) || 0) + 1); });
      const colors = ['#65e6ff', '#ffcc66', '#ff9275', '#8c9bff', '#63d9b4'];
      return [...counts].sort((a,b) => b[1]-a[1]).map(([name,count],index) => ({name,count,color:colors[index%colors.length],percent:this.images.length ? count/this.images.length*100 : 0}));
    },
    ringStyle() {
      if (!this.images.length) return {background:'#17364a'};
      let offset = 0;
      return {background:`conic-gradient(${this.distribution.map(item => {const start = offset; offset += item.percent; return `${item.color} ${start}% ${offset}%`;}).join(',')})`};
    },
    visibleImages() { return this.images.filter(image => !this.defectFilter || (image.defect || '其他') === this.defectFilter); },
    selectedIndex() { return this.visibleImages.indexOf(this.selectedImage); },
    pageCount() { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); },
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
      if (!production || rejectCount < 0 || rejectCount > production) return '—';
      return `${((rejectCount / production) * 100).toFixed(3)}%`;
    }
  },
  beforeUnmount() { this.requestVersion++; },
  methods: {
    number(value) { const number = Number(value); return value === null || value === undefined || !Number.isFinite(number) ? '—' : number.toLocaleString('zh-CN'); },
    filterDefect(name) { this.defectFilter = this.defectFilter === name ? '' : name; this.selectedImage = this.visibleImages[0] || null; },
    moveSelection(step) { const image = this.visibleImages[this.selectedIndex + step]; if (image) this.selectImage(image); },
    changePage(step) { const next = this.page + step; if (this.loading || next < 1 || next > this.pageCount) return; this.page = next; this.loadNgImages(); },
    handleKeys(event) {
      if (event.key === 'Escape') { event.stopPropagation(); this.zoomImage ? this.closeImagePreview() : this.close(); }
      if (event.key === 'Tab') {
        const container = this.$refs.dialog?.querySelector(this.zoomImage ? '.ng-zoom-panel' : '.ng-panel');
        const controls = [...(container?.querySelectorAll('button:not(:disabled), select:not(:disabled), [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
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
    resolvePointQueryValue(pointName) {
      const pointMap = {
        '商标纸': 'sbz',
        '卡纸': 'kz',
        '前半条烟透明纸': 'qbtytmz',
        '后半条烟透明纸': 'hbtytmz',
        '内道透明纸': 'ndtmz',
        '内岛透明纸': 'ndtmz',
        '外道透明纸': 'wdtmz',
        '内道商标纸': 'sbz',
        '内岛商标纸': 'sbz'
      };
      const normalizedPoint = String(pointName || '').trim();
      return pointMap[normalizedPoint] || normalizedPoint;
    },
    selectImage(image) {
      this.selectedImage = image;
    },
    openImagePreview(image) {
      this.selectedImage = image;
      this.zoomImage = image;
      this.$nextTick(() => this.$refs.dialog?.querySelector('.ng-zoom-panel .icon-button')?.focus());
    },
    closeImagePreview() {
      this.zoomImage = null;
      this.$nextTick(() => this.$refs.dialog?.querySelector('.preview-navigation .action-button')?.focus());
    },
    close() {
      this.requestVersion++;
      this.loading = false;
      this.show = false;
      this.images = [];
      this.selectedImage = null;
      this.zoomImage = null;
      this.error = '';
      this.$emit('close');
    },
    handleFilterChange() {
      this.totalCount = 0;
      this.page = 1;
      this.loadNgImages();
    },
    async open() {
      this.show = true;
      this.totalCount = 0;
      this.page = 1;
      await this.$nextTick();
      this.$refs.dialog?.focus();
      await this.loadNgImages();
    },
    async loadNgImages() {
      const version = ++this.requestVersion;
      this.defectFilter = '';
      const line = this.normalizeLine(this.lineData?.line || '');
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
          point: this.resolvePointQueryValue(this.pointName),
          camera: this.defaultCamera,
          page: this.page,
          pageSize: this.pageSize
        });
        if (version !== this.requestVersion) return;
        const images = Array.isArray(res?.data) ? res.data.map(image => ({
          ...image,
          imageUrl: resolveNgImageUrl(image.imageUrl)
        })) : [];
        this.images = images;
        this.totalCount = Number.isFinite(Number(res?.totalCount)) ? Math.max(0, Number(res.totalCount)) : images.length;
        this.selectedImage = images[0] || null;
        if (!images.length) {
          this.error = '暂无NG图片';
        }
      } catch (error) {
        if (version !== this.requestVersion) return;
        console.error('获取NG图片失败:', error);
        this.error = '获取NG图片失败';
      } finally {
        if (version === this.requestVersion) this.loading = false;
      }
    }
  }
}
</script>
<style scoped lang="scss" src="./ng-workbench.scss"></style>
