<template>
  <div class="numcard numcardItem2">
    <vue-number-roll-plus
        :number="number1"
        :speed="1.5"
        :isSemicolon="isSemicolon"
        v-if="show"
        background="transparent"
    >
    </vue-number-roll-plus>
  </div>

</template>

<script>
import VueNumberRollPlus from "vue3-number-roll-plus"
import "vue3-number-roll-plus/main.css"

export default {
  components: {
    VueNumberRollPlus
  },
  props: {
    number: {
      type: [Number, String],
      default() {
        return 0;
      }
    },
    isFixed: {
      type: Boolean,
      default() {
        return false;
      }
    },
    isSemicolon: {
      type: Boolean,
      default() {
        return false;
      }
    },
  },
  computed: {
    number1: function () {
      var num = (this.number.toFixed(2)).toString()
      return num.split(".")[0]
    },
  },
  data() {
    return {
      show: true,
    }
  },
  watch: {
    number() {
      this.show = false
      this.$nextTick(() => {
        this.show = true
      })
    },
  },
  mounted() {
    this.show = false
    this.$nextTick(() => {
      this.show = true
    })
  },
}
</script>

<style lang="scss">
.numcardItem2 {
  .real-time-num {
    background: url("./assets/cardNum.png") #062053 no-repeat !important;
    width: 35px;
    height: 42px;
    margin-left: 5px;
    margin-right: 5px;
    background-size: 100% 100% !important;
    font-size: 25px;
    font-family: DIN-Bold;
    font-weight: bold;
    color: #FFFFFF;

    span {
      font-size: 25px;
      font-family: DIN-Bold;
      font-weight: bold;
    }
  }

  .real-time-num .real-time-num-item > div {
    background: linear-gradient(to bottom, #ffffff, #86c7de);
    -webkit-background-clip: text;
    color: transparent;
  }
}
</style>
