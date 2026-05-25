<template>
  <div class="popContainer">
    <div class="popWin" v-if="show">
      <div class="popWinBg" v-if="show"></div>
      <div class="popWinMain" ref="popWinMain" v-if="show">
        <bg></bg>
        <div class="headTitle">
          <p>{{ title }}</p>
        </div>
        <div class="popClose" ref="popClose" v-if="showInner" @click="getHide"></div>
        <div class="slot" v-if="showInner">
          <div class="iframe-container">
            <iframe
                v-if="url"
                :src="url"
                class="web-frame"
                frameborder="0"
                allowfullscreen
                @load="onIframeLoad"
            ></iframe>
            <div v-else class="no-url">暂无视频链接</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap'
import bg from './bg.vue'

export default {
  data() {
    return {
      show: false,
      showInner: false,
      url: '',
      title: '',
      scale: 1
    }
  },
  components: { bg },
  methods: {
    getShow(e) {
      console.log('接收到的参数:', e)
      var that = this;
      this.title = e.title
      this.url = e.url || ''
      that.show = true
      that.$nextTick(() => {
        gsap.to(this.$refs.popWinMain, {
          duration: 1,
          height: '80vh',
          onComplete: () => {
            this.showInner = true
            this.$nextTick(() => {
              gsap.to(this.$refs.popClose, {
                duration: 1,
                transform: ' rotateX(180deg)',
                onComplete: () => {
                  this.showInner = true
                }
              })
            })
          }
        })
      })
    },

    onIframeLoad() {
      // iframe加载完成后自动计算缩放比例
      this.$nextTick(() => {
        this.calculateScale();
      });
    },

    calculateScale() {
      const iframe = this.$el.querySelector('.web-frame');
      if (!iframe) return;

      // 给iframe一些时间来完全渲染
      setTimeout(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          const iframeBody = iframeDoc.body;
          const iframeHtml = iframeDoc.documentElement;

          // 获取iframe内容的实际尺寸
          const contentWidth = Math.max(
              iframeBody.scrollWidth,
              iframeBody.offsetWidth,
              iframeHtml.scrollWidth,
              iframeHtml.offsetWidth,
              iframeHtml.clientWidth
          );

          const contentHeight = Math.max(
              iframeBody.scrollHeight,
              iframeBody.offsetHeight,
              iframeHtml.scrollHeight,
              iframeHtml.offsetHeight,
              iframeHtml.clientHeight
          );

          // 获取容器尺寸
          const container = this.$el.querySelector('.iframe-container');
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;

          // 计算缩放比例
          const scaleX = containerWidth / contentWidth;
          const scaleY = containerHeight / contentHeight;
          this.scale = Math.min(scaleX, scaleY, 1); // 取最小值，最大不超过1

          console.log(`内容尺寸: ${contentWidth}x${contentHeight}, 容器尺寸: ${containerWidth}x${containerHeight}, 缩放比例: ${this.scale}`);

        } catch (error) {
          console.warn('无法访问iframe内容，使用默认缩放:', error);
          // 如果跨域无法访问，使用默认缩放
          this.scale = 0.8;
        }
      }, 1000);
    },

    getHide() {
      this.showInner = false
      this.$nextTick(() => {
        gsap.to(this.$refs.popWinMain, {
          duration: 1,
          height: '0%',
          onComplete: () => {
            this.show = false
            this.url = ''
            this.scale = 1
          }
        })
      })
    }
  },
}
</script>

<style lang="scss" scoped>
.popWinBg {
  position: fixed;
  z-index: 10;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: initial;
}

.popWin {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
  position: fixed;
  z-index: 121;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  pointer-events: none;
}

.popWinMain {
  pointer-events: initial;
  position: relative;
  overflow: hidden;
  width: 80vw;
  max-width: 80vw;
  height: 0%;
  max-height: 90vh;
  z-index: 100;

  .slot {
    position: absolute;
    top: 80px;
    left: 30px;
    width: calc(100% - 60px);
    height: calc(100% - 100px);

    .iframe-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f5f5f5;
    }

    .web-frame {
      width: 100%;
      height: 100%;
      border: none;
      background: #fff;
      transform: scale(v-bind(scale));
      transform-origin: center center;
      transition: transform 0.3s ease;
    }

    .no-url {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #999;
      font-size: 16px;
      background: #f5f5f5;
    }
  }
}

.popClose {
  position: absolute;
  right: 10px;
  top: 10px;
  background: url("./assets/icon_close.png") no-repeat;
  width: 64px;
  height: 64px;
  background-size: 100% 100%;
  cursor: pointer;
  z-index: 1;
}

.headTitle {
  height: 80px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
  margin-left: 30px;
  font-size: 24px;
  font-family: PangMenZhengDao;
  color: #fff;
}
</style>