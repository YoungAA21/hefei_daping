<template>
  <div class="itemBodys">
    <echarts v-if="lineData.length>0" :list="lineData"></echarts>
  </div>
</template>

<script>
import echarts from "./components/echarts.vue";

export default {
  props: {
    lineData: {
      type: Array,
      default: () => []
    }
  },
  components: {echarts},
}
</script>

<style lang="scss" scoped>
.itemBodys {
  width: 100%;
  position: relative;
  height: calc(100% - 0px);
}
</style>