<template>
  <div class="numcard numcardItem1">
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
    number2: function () {
      var num = (this.number.toFixed(2)).toString()
      return num.split(".")[1]
    }
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
.numcardItem1 {
  .real-time-num {
    //background: url("./assets/numbg.png") #062053 no-repeat !important;
    width: auto !important;
    height: 48px;
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
    background: linear-gradient(to bottom, #fff, #d8e2ff);
    -webkit-background-clip: text;
    color: transparent;
  }
}
</style>
<style lang="scss" scoped>

.numcard {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  align-content: flex-start;
}

.dot {
  font-size: 30px;
  font-family: OPPOSans;
  font-weight: bold;
  color: rgba(17, 255, 254, 1);
  text-shadow: 0px 4px 10px rgba(0, 42, 108, 0.12);
}


</style>
