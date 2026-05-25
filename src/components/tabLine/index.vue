/**
* @Author: 858834013@qq.com
* @Name: tabs
* @Date: 2022-6-14
* @Desc:
*/
<template>
  <div class="tabs">
    <div class="tab cur" :class="{active:active==item.id}" @click="getactive(item.id)" v-for="(item,index) in list"
         :key="index"><span>{{ item.name }}</span>
      <div class="line"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "tabs",
  props: {
    list: {
      type: Array,
      default() {
        return [];
      }
    },
    active: {
      type: Number,
      default() {
        return 0;
      }
    },
  },
  methods: {
    getactive(e) {
      this.$emit('update:active', e)
    },
  }
}
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: nowrap;
  flex-direction: row;
  width: 100%;

  .tab {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: column;
    position: relative;
    height: 50px;
    margin-right: 30px;
    cursor: pointer;

    span {
      font-size: 14px;
      font-family: MicrosoftYaHei;
      font-weight: 400;
      color: #B8C4DD;
    }

    .line {
      position: absolute;
      bottom: 0px;
      background: none;
      width: 71px;
      height: 11px;
      background-size: 100% 100%;
    }
  }

  .tab.active {
    span {
      font-size: 14px;
      font-family: MicrosoftYaHei;
      font-weight: 400;
      color: #FFFFFF;
    }

    .line {
      background: url("./assets/bg.png") no-repeat;
      background-size: 100% 100%;
    }
  }
}
</style>
