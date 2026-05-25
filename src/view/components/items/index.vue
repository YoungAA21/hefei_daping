<template>
  <div class="pageItemBody">
    <div class="pageItemBodyInner" ref="inner" v-if="show">
      <!--      主题部分-->
      <div class="pageItemBodyTitle"><p>{{ name }}</p></div>
      <img class="gaoguang" src="./assets/gaoguang.png" alt="">
      <div class="itemMain">
        <slot></slot>
      </div>
    </div>
    <!--      图片背景-->
    <div class="bgImg" v-if="show"></div>
    <!--    向下展开的背景-->
    <div class="bg" ref="bg" v-if="!show"></div>
  </div>
</template>

<script>

import gsap from 'gsap'


export default {
  name: "items",
  data() {
    return {
      show: false,
      styles: ''
    }
  },
  components: {},
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
          })
        }, 100)
      },
    });
    const imagesDimensions = [
      [34, 13], // topLeft 图片宽高
      [34, 13], // top 图片宽高
      [34, 13], // topRight 图片宽高
      [1, 13],  // centerLeft 图片宽高
      [1, 13],  // center 图片宽高 不用写
      [1, 13],  // centerRight 图片宽高
      [1, 2],   // bottomLeft 图片宽高
      [1, 2],   // bottom 图片宽高 不用写
      [1, 2]    // bottomRight 图片宽高
    ];
    this.styles = this.generateBackgroundStyles(imagesDimensions);
    // console.log(this.styles);
  },
  methods: {
    generateBackgroundStyles(images) {
      // 解构图片的宽度和高度
      const [
        [topLeftW, topLeftH],
        [topW, topH],
        [topRightW, topRightH],
        [centerLeftW, centerLeftH],
        [centerW, centerH],
        [centerRightW, centerRightH],
        [bottomLeftW, bottomLeftH],
        [bottomW, bottomH],
        [bottomRightW, bottomRightH]
      ] = images;

      // 计算 background-position
      const backgroundPosition = `
    top left,
    ${topLeftW}px top,
    right top,
    left ${topLeftH}px,
    ${centerLeftW}px ${topH}px,
    right ${topRightH}px,
    left bottom,
    ${bottomLeftW}px bottom,
    right bottom
  `;

      // 计算 background-size
      const backgroundSize = `
    ${topLeftW}px ${topLeftH}px,
    calc(100% - ${topLeftW}px - ${topRightW}px) ${topH}px,
    ${topRightW}px ${topRightH}px,
    ${centerLeftW}px calc(100% - ${topLeftH}px - ${bottomLeftH}px),
    calc(100% - ${centerLeftW}px - ${centerRightW}px) calc(100% - ${topH}px - ${bottomH}px),
    ${centerRightW}px calc(100% - ${topRightH}px - ${bottomRightH}px),
    ${bottomLeftW}px ${bottomLeftH}px,
    calc(100% - ${bottomLeftW}px - ${bottomRightW}px) ${bottomH}px,
    ${bottomRightW}px ${bottomRightH}px
  `;

      return `
    background-position: ${backgroundPosition.trim()};
    background-size: ${backgroundSize.trim()};
  `;
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
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: column;
  z-index: 1;
  align-content: flex-start;
  opacity: 0;

  .gaoguang {
    position: absolute;
    top: 10px;
    width: 270px;
  }

  //background: url("./assets/itembg.png") center top no-repeat;
  //background-size: 100% 100%;
}

.bg {
  height: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to bottom, rgba(#414c67, 0.3), rgba(#414c67, 0.6));
}

.itemMain {
  position: relative;
  width: 100%;
  height: calc(100% - 0px);
  margin-top: 0px;
  z-index: 10;
}

.pageItemBodyTitle {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
  width: 100%;
  height: 60px;

  p {
    font-size: 18px;
    font-family: YouSheBiaoTiHei;
    font-weight: 400;
    font-style: italic;
    color: #EDF2FF;
  }
}

.bgImg {
  position: absolute;
  top: 30px;
  left: 0;
  z-index: 0;
  width: 100%;
  height: calc(100% - 30px);
  background-image: url('./assets/itembg_top_left.png'),
  url('./assets/itembg_top.png'),
  url('./assets/itembg_top_right.png'),
  url('./assets/itembg_center_left.png'),
  url('./assets/itembg_center.png'),
  url('./assets/itembg_center_right.png'),
  url('./assets/itembg_bottom_left.png'),
  url('./assets/itembg_bottom.png'),
  url('./assets/itembg_bottom_right.png');
  background-repeat: no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat,
  no-repeat;
  background-position: top left,
  34px top,
  right top,
  left 13px,
  1px 13px,
  right 13px,
  left bottom,
  1px bottom,
  right bottom;
  background-size: 34px 13px,
  calc(100% - 34px - 34px) 13px,
  34px 13px,
  1px calc(100% - 13px - 2px),
  calc(100% - 1px - 1px) calc(100% - 13px - 2px),
  1px calc(100% - 13px - 2px),
  1px 2px,
  calc(100% - 1px - 1px) 2px,
  1px 2px;
}
</style>

