<template>
  <div class="itemBodys">
    <echarts1 :list="lineData"></echarts1>
  </div>
</template>

<script>

import echarts1 from "./echarts/index.vue";

export default {
  props: {
    lineData: {
      type: Array,
      default: () => []
    }
  },
  components: {echarts1},

}
</script>

<style lang="scss" scoped>
.itemBodys {
  position: relative;
  width: calc(100% - 20px);
  margin: 0 auto;
  height: calc(100% - 0px);
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  flex-wrap: nowrap;
  flex-direction: column;
  align-content: flex-start;
}
</style>
