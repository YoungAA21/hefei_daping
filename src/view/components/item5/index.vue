<template>
  <div class="itemBodys">
    <echarts  :list="lineData"></echarts>
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
  data() {
    return {
      list: []
    }
  },
  components: {echarts},
  mounted() {

    this.dataInterval = setInterval(this.getData, 120000); // Every 30 seconds
  },
  beforeDestroy() {
    clearInterval(this.dataInterval); // Clear the interval when the component is destroyed
  },
  methods: {

  },
}
</script>

<style lang="scss" scoped>
.itemBodys {
  width: 100%;
  position: relative;
  height: calc(100% - 0px);
}

.echartsBody {
  position: relative;
  width: 100%;
  height: calc(100% - 0px);
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
}
</style>
