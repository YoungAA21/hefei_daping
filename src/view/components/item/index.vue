<template>
  <div class="pageItemBody">
    <div class="pageItemBodyInner" ref="inner" v-if="show">
      <titleCom :icon="icon" :name="name"></titleCom>
      <!--      主题部分-->
      <div class="itemMain">
        <div class="icon_left_top"></div>
        <div class="icon_right_bottom"></div>
        <div class="mainLine">
          <div class="mainLineInner" ref="mainLineInner"></div>
        </div>
        <slot></slot>
      </div>
    </div>
    <!--    向下展开的背景-->
    <div class="bg" ref="bg" v-if="!show"></div>
  </div>
</template>

<script>

import gsap from 'gsap'
import titleCom from './titleCom.vue'

export default {
  name: "item",
  data() {
    return {
      show: false
    }
  },
  components: {titleCom},
  props: {
    name: {
      type: String,
      default() {
        return '';
      }
    },
    icon: {
      type: String,
      default() {
        return '';
      }
    },
    delay: {
      type: Number,
      default() {
        return 0;
      }
    },
    duration: {
      type: Number,
      default() {
        return 0.5;
      }
    },
  },
  mounted() {
    var that = this;
    gsap.to(this.$refs.bg, {
      height: '100%',
      delay: that.delay,
      duration: that.duration, // 动画持续时间（以秒为单位）
      ease: 'none', // 使用线性动画缓动函数
      onComplete: () => {
        // 动画完成后触发的回调函数
        setTimeout(() => {
          that.show = true
          // 添加新的 GSAP 动画来改变透明度
          that.$nextTick(() => {
            gsap.to(that.$refs.inner, {
              opacity: 1,
              duration: 1, // 这里可以设置渐显动画的持续时间
            });
            that.startAnimation()
          })
        }, 100)
      },
    });
  },
  methods: {
    startAnimation() {
      gsap.to(this.$refs.mainLineInner, {
        duration: 3,
        right: "120%",
        repeat: -1,
        ease: "linear"
      });
    }
  },
}
</script>

<style lang="scss" scoped>
.pageItemBody {
  width: 100%;
  position: relative;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: nowrap;
  flex-direction: column;
  z-index: 1;
  align-content: flex-start;

  .titleInfo {
    width: calc(100% - 0px);
    margin: 0 auto;
    height: 60px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;
  }
}

.pageItemBodyInner {
  width: 100%;
  position: relative;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: nowrap;
  flex-direction: column;
  z-index: 1;
  align-content: flex-start;
  opacity: 0;
  //background: url("./assets/itembg.png") center top no-repeat;
  //background-size: 100% 100%;
}

.bg {
  height: 0%;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to bottom, rgba(#414c67, 0.3), rgba(#414c67, 0.6));
}

.itemMain {
  position: relative;
  width: 100%;
  height: calc(100% - 50px);
  margin-top: 5px;
  z-index: 10;
  overflow: hidden;
  border: 1px solid rgba(101, 213, 255, 0.42);
  background:
      linear-gradient(145deg, rgba(4, 23, 47, 0.78), rgba(3, 11, 26, 0.82)),
      radial-gradient(circle at 15% 0%, rgba(101, 213, 255, 0.16), transparent 38%);
  box-shadow:
      0 16px 42px rgba(0, 0, 0, 0.28),
      0 0 28px rgba(0, 194, 255, 0.12),
      inset 0 0 24px rgba(0, 194, 255, 0.08);
  backdrop-filter: blur(8px);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(rgba(101, 213, 255, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(101, 213, 255, 0.06) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent 80%);
  }

  &::after {
    content: '';
    position: absolute;
    width: 45%;
    height: 100%;
    top: 0;
    left: -55%;
    pointer-events: none;
    background: linear-gradient(110deg, transparent, rgba(101, 213, 255, 0.12), transparent);
    animation: cardSweep 4.8s ease-in-out infinite;
  }

  .icon_left_top {
    background: url("./assets/icon_left_top.png") no-repeat;
    width: 5px;
    height: 5px;
    background-size: 100% 100%;
    position: absolute;
    left: 0;
    top: 0;
  }

  .icon_right_bottom {
    background: url("./assets/icon_right_bottom.png") no-repeat;
    width: 5px;
    height: 5px;
    background-size: 100% 100%;
    position: absolute;
    right: 0;
    bottom: 0;
  }

  .mainLine {
    height: 1px;
    position: absolute;
    background: rgba(53, 80, 111, 1);
    bottom: 0;
    width: 100%;
    display: flex;
    overflow: hidden;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;

    .mainLineInner {
      width: 40%;
      position: absolute;
      right: -30%;
      top: 0;
      height: 1px;
      background: linear-gradient(to right, rgba(49, 68, 114, 0), #65d5ff 50%, rgba(49, 68, 114, 0));
    }
  }
}

@keyframes cardSweep {
  0%, 100% {
    transform: translateX(0);
    opacity: 0;
  }
  35%, 70% {
    opacity: 1;
  }
  100% {
    transform: translateX(360%);
  }
}
</style>
