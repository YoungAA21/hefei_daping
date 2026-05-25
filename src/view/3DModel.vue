<template>
  <div class="container">
    <div class="top">
      <div class="back-button" @click="goBack">
        <i class="icon-back"></i>
        返回首页
      </div>
      <top name="3D产线" class="wow fadeInDown" data-wow-delay="0.2s"></top>
    </div>
    <div class="home">
      <div class="machine">
        <!-- 3D模型容器 -->
        <div id="model-container" ref="modelContainer">
          <canvas id="three-canvas" ref="threeCanvas"></canvas>
        </div>

        <!-- 右侧垂直刻度条 -->
        <div class="scale-bar vertical-scale" ref="verticalScale">
          <div class="scale-track">
            <div class="scale-ticks">
              <div v-for="n in 21" :key="'v-' + n" class="scale-tick"
                   :class="{ 'scale-tick-major': n % 5 === 1 }"></div>
            </div>
            <div class="scale-slider" ref="verticalSlider"
                 :style="{ top: verticalSliderPosition + '%' }"
                 @mousedown="startVerticalDrag">
              <div class="slider-handle"></div>
            </div>
          </div>
          <div class="scale-label">垂直旋转</div>
        </div>

        <!-- 底部水平刻度条 -->
        <div class="scale-bar horizontal-scale" ref="horizontalScale">
          <div class="scale-track">
            <div class="scale-ticks">
              <div v-for="n in 21" :key="'h-' + n" class="scale-tick"
                   :class="{ 'scale-tick-major': n % 5 === 1 }"></div>
            </div>
            <div class="scale-slider" ref="horizontalSlider"
                 :style="{ left: horizontalSliderPosition + '%' }"
                 @mousedown="startHorizontalDrag">
              <div class="slider-handle"></div>
            </div>
          </div>
          <div class="scale-label">水平旋转</div>
        </div>

        <!-- 悬浮气泡 -->
        <div class="bubble bubble-1" :class="{ 'bubble-active': activeBubble === 1 }" @click="showPop(receivedLineData.points[0].point)">
          <div class="bubble-content">
            <div class="bubble-icon">{{ receivedLineData.points[0].point }}</div>
            <div class="bubble-icon">检测</div>
          </div>
        </div>

        <div class="bubble bubble-2" :class="{ 'bubble-active': activeBubble === 2 }" @click="showPop(receivedLineData.points[1].point)">
          <div class="bubble-content">
            <div class="bubble-icon">{{ receivedLineData.points[1].point }}</div>
            <div class="bubble-icon">检测</div>
          </div>
        </div>

        <div class="bubble bubble-3" :class="{ 'bubble-active': activeBubble === 3 }" @click="showPop(receivedLineData.points[2].point)">
          <div class="bubble-content">
            <div class="bubble-icon">{{ receivedLineData.points[2].point }}</div>
            <div class="bubble-icon">检测</div>
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
    <pop ref="pop" :lineData="receivedLineData" :point-name="currentPoint"></pop>
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
import pop from "@/components/pop/index.vue";

export default {
  data() {
    return {
      list: [],
      filteredList: [],
      currentLineData: null,
      highlightTimer: null,
      dataInterval: null,
      currentPop: null,
      currentMachhine: null,
      currentPoint: null,
      receivedLineData: null,
      activeBubble: null,

      // Three.js相关
      threeInitialized: false,
      isDragging: false,
      previousMousePosition: { x: 0, y: 0 },
      rotation: { x: 0, y: 0 }, // 弧度值
      cameraDistance: 8,

      // 刻度条相关
      verticalSliderPosition: 50,   // 垂直滑块位置百分比
      horizontalSliderPosition: 50, // 水平滑块位置百分比
      isVerticalDragging: false,    // 垂直拖动状态
      isHorizontalDragging: false,  // 水平拖动状态

      // 旋转角度限制（弧度）
      rotationLimits: {
        x: { min: -Math.PI/2, max: Math.PI/2 },   // 垂直旋转限制 (-90° 到 90°)
        y: { min: -Math.PI, max: Math.PI }        // 水平旋转限制 (-180° 到 180°)
      }
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
    // 清除所有定时器
    if (this.highlightTimer) {
      clearInterval(this.highlightTimer);
    }
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }

    // 移除事件监听器
    const container = this.$refs.modelContainer;
    if (container) {
      container.removeEventListener('mousedown', this.handleMouseDown);
      container.removeEventListener('mousemove', this.handleMouseMove);
      container.removeEventListener('mouseup', this.handleMouseUp);
      container.removeEventListener('wheel', this.handleWheel);
    }

    // 清理刻度条事件监听器
    document.removeEventListener('mousemove', this.handleVerticalDrag);
    document.removeEventListener('mouseup', this.stopVerticalDrag);
    document.removeEventListener('mousemove', this.handleHorizontalDrag);
    document.removeEventListener('mouseup', this.stopHorizontalDrag);

    // 清理刻度条元素的事件监听器
    if (this.$refs.verticalSlider) {
      this.$refs.verticalSlider.removeEventListener('mousedown', this.startVerticalDrag);
    }
    if (this.$refs.horizontalSlider) {
      this.$refs.horizontalSlider.removeEventListener('mousedown', this.startHorizontalDrag);
    }
  },
  created() {
    this.getRouteData();
  },
  methods: {
    // 返回首页
    goBack() {
      this.$router.push('/');
    },
    getRouteData() {
      if (this.$route.query.lineData) {
        try {
          const lineData = JSON.parse(this.$route.query.lineData);
          this.receivedLineData = lineData;

          if (lineData.line) {
            const lineNumber = lineData.line.replace('gao', '');
            this.currentLineData = {
              ...line,
              lineName: `高${lineNumber}产线`
            };
          }
        } catch (error) {
          console.error('解析产线数据失败:', error);
        }
      }
    },
    filterLineData(allData) {
      if (!this.receivedLineData || !this.receivedLineData.line) {
        return [];
      }

      const targetLine = this.receivedLineData.line;
      const filtered = allData.filter(item => item.line === targetLine);
      return filtered;
    },

    async getLineData() {
      try {
        const data = {};
        const res = await getlineInfo(data);
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
          this.filteredList = this.filterLineData(formattedData);
        }
      } catch (error) {
        console.error('获取产线数据失败:', error);
      }
    },

    async showPop(pointName) {
      this.currentPoint = pointName;
      const machineElement = event.currentTarget;
      const rect = machineElement.getBoundingClientRect();
      this.$refs.pop.getShow({
        title: this.receivedLineData.line,
        position: {
          top: rect.top + window.scrollY + rect.height / 2 - 80,
          left: rect.right + window.scrollX + 50
        }
      });
    },

    enterFullscreen() {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.log('自动全屏失败，尝试模拟 F11:', err);
          this.simulateF11();
        });
      } else {
        this.simulateF11();
      }
    },

    simulateF11() {
      try {
        const f11Event = new KeyboardEvent('keydown', {
          key: 'F11',
          code: 'F11',
          keyCode: 122,
          which: 122,
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(f11Event);
        if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        }
      } catch (error) {
        console.log('模拟 F11 失败:', error);
      }
    },

    checkFullscreen() {
      return !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
    },

    // 动态加载Three.js避免代理问题
    async initThreeJS() {
      try {
        // 动态导入Three.js
        const THREE = await import('three');

        const container = this.$refs.modelContainer;
        const canvas = this.$refs.threeCanvas;

        // 1. 创建场景 - 设置为透明背景
        const scene = new THREE.Scene();
        scene.background = null; // 重要：设置为透明背景

        // 2. 创建相机
        const camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );

        // 3. 创建渲染器 - 启用alpha通道
        const renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: true, // 启用透明度
          preserveDrawingBuffer: true // 可选：保留绘图缓冲区
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // 4. 设置渲染器清除颜色和透明度
        renderer.setClearColor(0x000000, 0); // 黑色，完全透明

        // 5. 添加灯光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        scene.add(directionalLight);

        // 6. 创建机器模型
        const machineGroup = this.createMachineModel(THREE);
        scene.add(machineGroup);

        // 7. 添加网格地面 - 可以选择保留或移除
        // 如果保留网格，可以设置半透明
        const gridHelper = new THREE.GridHelper(10, 10, 0x1a5276, 0x1a5276);
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3; // 设置网格透明度
        scene.add(gridHelper);

        // 8. 设置初始相机位置
        this.updateCameraPosition(camera);

        // 9. 添加手动拖拽控制
        this.setupManualControls(container, machineGroup);

        // 10. 动画循环
        const animate = () => {
          if (!this.threeInitialized) return;

          requestAnimationFrame(animate);
          this.updateCameraPosition(camera);
          renderer.render(scene, camera);
        };

        // 存储引用
        this.threeScene = scene;
        this.threeCamera = camera;
        this.threeRenderer = renderer;
        this.threeMachine = machineGroup;
        this.threeInitialized = true;

        animate();

        // 窗口大小变化处理
        window.addEventListener('resize', () => {
          if (this.threeInitialized) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
          }
        });

        console.log('Three.js 初始化成功 - 透明背景');

      } catch (error) {
        console.error('Three.js 初始化失败:', error);
        this.showFallbackImage();
      }
    },

    createMachineModel(THREE) {
      const group = new THREE.Group();

      // 主底座
      const baseGeometry = new THREE.BoxGeometry(6, 0.3, 3);
      const baseMaterial = new THREE.MeshBasicMaterial({
        color: 0x2c3e50
      });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.position.y = 0.15;
      group.add(base);

      // 机器主体
      const bodyGeometry = new THREE.BoxGeometry(4, 3, 2);
      const bodyMaterial = new THREE.MeshBasicMaterial({
        color: 0x34495e
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1.8;
      group.add(body);

      // 控制面板
      const panelGeometry = new THREE.BoxGeometry(0.2, 1.5, 1);
      const panelMaterial = new THREE.MeshBasicMaterial({
        color: 0xe74c3c
      });
      const panel = new THREE.Mesh(panelGeometry, panelMaterial);
      panel.position.set(-2.1, 2.25, 0);
      group.add(panel);

      // 传送带
      const beltGeometry = new THREE.BoxGeometry(5, 0.1, 1);
      const beltMaterial = new THREE.MeshBasicMaterial({
        color: 0xf39c12
      });
      const belt = new THREE.Mesh(beltGeometry, beltMaterial);
      belt.position.set(0, 0.25, 1.5);
      group.add(belt);

      // 滚筒
      const rollerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
      const rollerMaterial = new THREE.MeshBasicMaterial({
        color: 0x7f8c8d
      });
      const leftRoller = new THREE.Mesh(rollerGeometry, rollerMaterial);
      leftRoller.rotation.z = Math.PI / 2;
      leftRoller.position.set(-2.5, 0.3, 1.5);
      group.add(leftRoller);

      const rightRoller = new THREE.Mesh(rollerGeometry, rollerMaterial);
      rightRoller.rotation.z = Math.PI / 2;
      rightRoller.position.set(2.5, 0.3, 1.5);
      group.add(rightRoller);

      // 顶部结构
      const topGeometry = new THREE.CylinderGeometry(1.5, 1, 1, 6);
      const topMaterial = new THREE.MeshBasicMaterial({
        color: 0x3498db
      });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 4.5;
      group.add(top);

      return group;
    },

    updateCameraPosition(camera) {
      const x = this.cameraDistance * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
      const z = this.cameraDistance * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);
      const y = this.cameraDistance * Math.sin(this.rotation.x);

      camera.position.set(x, y + 2, z);
      camera.lookAt(0, 2, 0);
    },

    // 手动实现拖拽控制
    setupManualControls(container, machineGroup) {
      container.addEventListener('mousedown', this.handleMouseDown);
      container.addEventListener('mousemove', this.handleMouseMove);
      container.addEventListener('mouseup', this.handleMouseUp);
      container.addEventListener('wheel', this.handleWheel);

      this.threeMachine = machineGroup;
    },

    handleMouseDown(event) {
      this.isDragging = true;
      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      this.$refs.modelContainer.style.cursor = 'grabbing';
    },

    handleMouseMove(event) {
      if (!this.isDragging || !this.threeInitialized) return;

      const deltaMove = {
        x: event.clientX - this.previousMousePosition.x,
        y: event.clientY - this.previousMousePosition.y
      };

      // 旋转模型
      this.rotation.y += deltaMove.x * 0.01;
      this.rotation.x += deltaMove.y * 0.01;

      // 限制旋转角度
      this.rotation.x = Math.max(
          this.rotationLimits.x.min,
          Math.min(this.rotationLimits.x.max, this.rotation.x)
      );

      this.rotation.y = Math.max(
          this.rotationLimits.y.min,
          Math.min(this.rotationLimits.y.max, this.rotation.y)
      );

      // 更新滑块位置
      this.updateSlidersFromRotation();

      this.previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    },


    handleMouseUp() {
      this.isDragging = false;
      this.$refs.modelContainer.style.cursor = 'grab';
    },

    handleWheel(event) {
      event.preventDefault();

      // 缩放控制
      const zoomSpeed = 0.1;
      const delta = Math.sign(event.deltaY);

      this.cameraDistance *= (1 + delta * zoomSpeed);

      // 限制缩放范围
      this.cameraDistance = Math.max(5, Math.min(50, this.cameraDistance));
    },

    showFallbackImage() {
      const container = this.$refs.modelContainer;
      container.innerHTML = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;background:#0a0f2e;">
          <div style="font-size:20px;margin-bottom:10px;">3D模型加载失败</div>
          <div style="font-size:14px;opacity:0.7;">使用静态图片替代</div>
        </div>
      `;
    },
    // 开始垂直拖动
    startVerticalDrag(event) {
      this.isVerticalDragging = true;
      document.addEventListener('mousemove', this.handleVerticalDrag);
      document.addEventListener('mouseup', this.stopVerticalDrag);
      event.preventDefault();
    },

    // 处理垂直拖动
    handleVerticalDrag(event) {
      if (!this.isVerticalDragging) return;

      const scaleBar = this.$refs.verticalScale;
      const rect = scaleBar.getBoundingClientRect();
      const position = ((event.clientY - rect.top) / rect.height) * 100;

      // 限制在 0-100% 范围内
      this.verticalSliderPosition = Math.max(0, Math.min(100, position));

      // 更新旋转角度
      this.updateRotationFromSliders();
    },

    // 停止垂直拖动
    stopVerticalDrag() {
      this.isVerticalDragging = false;
      document.removeEventListener('mousemove', this.handleVerticalDrag);
      document.removeEventListener('mouseup', this.stopVerticalDrag);
    },

    // 开始水平拖动
    startHorizontalDrag(event) {
      this.isHorizontalDragging = true;
      document.addEventListener('mousemove', this.handleHorizontalDrag);
      document.addEventListener('mouseup', this.stopHorizontalDrag);
      event.preventDefault();
    },

    // 处理水平拖动
    handleHorizontalDrag(event) {
      if (!this.isHorizontalDragging) return;

      const scaleBar = this.$refs.horizontalScale;
      const rect = scaleBar.getBoundingClientRect();
      const position = ((event.clientX - rect.left) / rect.width) * 100;

      // 限制在 0-100% 范围内
      this.horizontalSliderPosition = Math.max(0, Math.min(100, position));

      // 更新旋转角度
      this.updateRotationFromSliders();
    },

    // 停止水平拖动
    stopHorizontalDrag() {
      this.isHorizontalDragging = false;
      document.removeEventListener('mousemove', this.handleHorizontalDrag);
      document.removeEventListener('mouseup', this.stopHorizontalDrag);
    },

    // 根据滑块位置更新旋转角度
    updateRotationFromSliders() {
      // 垂直旋转：0% = -90°, 50% = 0°, 100% = 90°
      const verticalRange = this.rotationLimits.x.max - this.rotationLimits.x.min;
      this.rotation.x = this.rotationLimits.x.min + (this.verticalSliderPosition / 100) * verticalRange;

      // 水平旋转：0% = -180°, 50% = 0°, 100% = 180°
      const horizontalRange = this.rotationLimits.y.max - this.rotationLimits.y.min;
      this.rotation.y = this.rotationLimits.y.min + (this.horizontalSliderPosition / 100) * horizontalRange;
    },

    // 根据旋转角度更新滑块位置
    updateSlidersFromRotation() {
      // 垂直滑块位置
      const verticalRange = this.rotationLimits.x.max - this.rotationLimits.x.min;
      this.verticalSliderPosition = ((this.rotation.x - this.rotationLimits.x.min) / verticalRange) * 100;

      // 水平滑块位置
      const horizontalRange = this.rotationLimits.y.max - this.rotationLimits.y.min;
      this.horizontalSliderPosition = ((this.rotation.y - this.rotationLimits.y.min) / horizontalRange) * 100;
    },
  },
  mounted() {
    setTimeout(() => {
      if (!this.checkFullscreen()) {
        this.enterFullscreen();
      }
    }, 50);

    this.getLineData();
    this.dataInterval = setInterval(this.getLineData, 5000);

    // 延迟初始化 Three.js
    this.$nextTick(() => {
      setTimeout(() => {
        this.initThreeJS();
      }, 500);
    });
  },
}
</script>

<style lang="scss" scoped>
.container{
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background: url("../assets/bg.png") center;
  overflow: hidden;
}
.top{
  width: 100%;
  height: 7vh;
  display: flex;
  align-items: center;
  position: relative;
}

.back-button {
  position: absolute;
  left: 20px;
  top: 130%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(14, 33, 71, 0.8);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    background: rgba(24, 53, 111, 0.9);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-50%) scale(1.05);
  }

  .icon-back {
    font-size: 14px;
  }
}

.data{
  width: 100%;
  height: 20vh;
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 10px;
  padding: 0 10px;
}
.home {
  width: 100%;
  height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: url("../assets/bg.png");
  background-size: 100% 100%;
  position: relative;
}

.machine{
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  position: relative;
}

#model-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

#three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* 悬浮气泡样式 */
.bubble {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.9), rgba(0, 102, 255, 0.9));
  border: 2px solid rgba(255, 255, 255, 0.6);
  box-shadow:
      0 0 20px rgba(0, 242, 255, 0.6),
      inset 0 0 20px rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  &:hover {
    transform: scale(1.1);
    box-shadow:
        0 0 30px rgba(0, 242, 255, 0.8),
        inset 0 0 25px rgba(255, 255, 255, 0.3);
  }

  &.bubble-active {
    transform: scale(1.15);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(0, 242, 255, 0.95));
    box-shadow:
        0 0 40px rgba(0, 242, 255, 1),
        inset 0 0 30px rgba(255, 255, 255, 0.4);
    z-index: 20;
  }
}

// 气泡位置
.bubble-1 {
  top: 30%;
  left: 25%;
  animation-delay: 0s;
}

.bubble-2 {
  top: 60%;
  left: 50%;
  animation-delay: 1s;
}

.bubble-3 {
  top: 20%;
  left: 70%;
  animation-delay: 2s;
}

.bubble-content {
  text-align: center;
  color: #fff;
  font-weight: bold;
  padding: 1px 1px 1px 1px;
}

.bubble-icon {
  font-size: 14px;
  margin-bottom: 2px;
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

.bubble-active {
  animation: none !important;
}

.item1 {
  height: 100%;
}

.item2s {
  height: 100%;
}

// 刻度条基础样式
.scale-bar {
  position: absolute;
  background: rgba(14, 33, 71, 0.8);
  border: 1px solid rgba(0, 242, 255, 0.6);
  border-radius: 8px;
  z-index: 20;

  .scale-track {
    position: relative;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    overflow: hidden;
  }

  .scale-ticks {
    position: absolute;
    display: flex;
  }

  .scale-tick {
    background: rgba(255, 255, 255, 0.4);

    &.scale-tick-major {
      background: rgba(0, 242, 255, 0.8);
    }
  }

  .scale-slider {
    position: absolute;
    cursor: pointer;
    transition: all 0.1s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  .slider-handle {
    background: linear-gradient(135deg, #00f2ff, #0066ff);
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 242, 255, 0.8);
  }

  .scale-label {
    color: #fff;
    font-size: 12px;
    text-align: center;
    margin-top: 5px;
    opacity: 0.8;
  }
}

// 垂直刻度条（右侧）
.vertical-scale {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 300px;
  padding: 10px 5px;

  .scale-track {
    width: 8px;
    height: 100%;
    margin: 0 auto;
  }

  .scale-ticks {
    flex-direction: column;
    width: 100%;
    height: 100%;
    justify-content: space-between;
  }

  .scale-tick {
    width: 6px;
    height: 1px;
    margin: 0 auto;

    &.scale-tick-major {
      width: 12px;
      height: 2px;
    }
  }

  .scale-slider {
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
  }

  .slider-handle {
    width: 16px;
    height: 16px;
  }
}

// 水平刻度条（底部）
.horizontal-scale {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 30px;
  padding: 5px 10px;

  .scale-track {
    width: 100%;
    height: 8px;
    margin: auto 0;
  }

  .scale-ticks {
    width: 100%;
    height: 100%;
    justify-content: space-between;
  }

  .scale-tick {
    height: 6px;
    width: 1px;
    margin: auto 0;

    &.scale-tick-major {
      height: 12px;
      width: 2px;
    }
  }

  .scale-slider {
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
  }

  .slider-handle {
    width: 16px;
    height: 16px;
  }
}

// 确保机器容器不会与刻度条重叠
.machine {
  width: calc(100% - 60px);
  height: calc(100% - 60px);
  margin-right: 60px;
  margin-bottom: 60px;
}
</style>