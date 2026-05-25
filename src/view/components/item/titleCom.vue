<template>
  <div class="titleBodyCom">
    <div class="icons">
      <i class="icon iconfont" :class="icon"></i>
    </div>
    <div class="iconx">
      <div class="icon1" ref="icon1"></div>
      <div class="icon2" ref="icon2"></div>
      <div class="icon3" ref="icon3"></div>
      <div class="icon4" ref="icon4"></div>
    </div>
    <div class="itemTitle">
        <span class="text" v-for="(char, index) in titleArray" :style="{ '--delay': index * 0.1 + 's' }">{{
            char
          }}</span>
    </div>
    <div class="titleLineBody">
      <div class="dot1"></div>
      <div class="titleLine">
        <div class="titleLineInner" ref="titleLineInner"></div>
      </div>
      <div class="dot2"></div>
    </div>
  </div>
</template>

<script>
import icon from './icon.vue'
import gsap from 'gsap'

export default {
  name: "titleCom",
  data() {
    return {
      list: [
        '#61cde0',
        '#fefefe',
        '#207ffa',
        'rgba(198, 212, 255, 0.6)'
      ]
    }
  },
  computed: {
    titleArray() {
      return this.name.split('');
    }
  },
  components: {icon},
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
  },
  watch: {},
  mounted() {
    this.startAnimation();
    this.iconStartAnimation();
  },
  methods: {
    iconStartAnimation() {
      const icons = [this.$refs.icon1, this.$refs.icon2, this.$refs.icon3, this.$refs.icon4];
      icons.forEach((icon, index) => {
        this.animateIconBackgroundColor(icon, index);
      });
    },
    animateIconBackgroundColor(icon, startIndex) {
      const colors = [...this.list.slice(startIndex), ...this.list.slice(0, startIndex)];
      const tl = gsap.timeline({repeat: -1, paused: true});

      colors.forEach((color, i) => {
        tl.to(icon, {backgroundColor: colors[(i + 1) % colors.length], duration: 1});
      });

      tl.play();
    },
    startAnimation() {
      gsap.to(this.$refs.titleLineInner, 3, {
        left: "120%",
        repeat: -1,
        ease: "linear"
      });
    }
  },
}
</script>

<style lang="scss" scoped>

.titleBodyCom {
  width: calc(100% - 0px);
  position: relative;
  height: 50px;
  margin-left: 0px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  z-index: 1;
  align-content: flex-start;

  .icons {
    width: 30px;
    height: 30px;
    font-size: 16px;
    color: #bed4fe;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;

    .icon {
      font-size: 20px;
      font-weight: 400;
      background: linear-gradient(to bottom, #d6e1ff, #92bcff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .iconx {
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;
    width: 25px;

    .icon1 {
      width: 4px;
      height: 8px;
      background: rgba(21, 104, 255, 0.5);
    }

    .icon2 {
      width: 2px;
      height: 8px;
      background: #00D2FF;
    }

    .icon3 {
      width: 4px;
      height: 8px;
      background: rgba(198, 212, 255, 0.15);
    }

    .icon4 {
      width: 2px;
      height: 8px;
      background: rgba(198, 212, 255, 0.6);
    }
  }

  .titleRight {
    position: absolute;
    right: 0;
    bottom: 0;

    img {
      width: 34px;
      height: 7px;
    }
  }


  .titleLineBody {
    position: absolute;
    bottom: 1px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;
    width: calc(100% - 30px);
    left: 30px;

    .dot1 {
      height: 4px;
      width: 4px;
      position: absolute;
      left: 0;
      z-index: 1;
      background: #00D2FF;
    }

    .dot2 {
      height: 4px;
      width: 4px;
      position: absolute;
      right: 0;
      z-index: 1;
      background: #00D2FF;
    }

    .titleLine {
      height: 1px;
      position: relative;
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

      .titleLineInner {
        width: 40%;
        position: absolute;
        left: 0;
        top: 0;
        height: 1px;
        background: linear-gradient(to right, #314472, #5e93d3 50%, #314472);
      }
    }
  }

  .itemTitle {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;
    margin-left: 10px;

    .text {
      opacity: 0;
      transform: translateY(1em);
      animation: appear 0.5s forwards;
      animation-delay: var(--delay);
      font-size: 20px;
      font-family: AlibabaPuHuiTiB;
      font-weight: 400;
      background: linear-gradient(to bottom, #d6e1ff, #92bcff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  @keyframes appear {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

}
</style>

