<template>
  <div class="icon" ref="icon1">
    <i class="icon iconfont" :class="icon"></i>
  </div>
</template>

<script>
import {gsap} from 'gsap';

export default {
  props: {
    icon: {
      type: String,
      default() {
        return '';
      }
    },
  },
  mounted() {
// 获取元素引用
    const iconElement = this.$refs.icon1;

    // 使用GSAP创建动画
    gsap.fromTo(
        iconElement,
        {scale: 0}, // 起始状态（小）
        {scale: 1, duration: 1} // 结束状态（大）和持续时间（1秒）
    );
  },
  methods: {}
};
</script>

<style lang="scss" scoped>
.icon {
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;

  i {
    font-size: 20px;
    color: rgba(0, 187, 255, 1);
  }
}
</style>
