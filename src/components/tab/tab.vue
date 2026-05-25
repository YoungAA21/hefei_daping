/**
* @Author: 858834013@qq.com
* @Name: tab
* @Date: 2023年06月24日21:08:51
* @Desc: tab
*/
<template>
  <div class="tabs">
    <div class="tab cur" :class="{active:active==item.id}" @click="getactive(item.id)" v-for="(item,index) in list"
         :key="index"><span>{{ item.title }}</span>
    </div>
  </div>
</template>
<script>
export default {
  name: "tabs",
  components: {},
  props: {
    list: {
      type: Array,
      default() {
        return [];
      }
    },
    active: {
      type: [Number, String],
      default() {
        return 0;
      }
    },
  },
  data() {
    return {}
  },
  watch: {},
  mounted() {
  },
  methods: {
    getactive(e) {
      this.$emit('update:active', e)
    },
  }
}
</script>
<style scoped lang="scss">
.tabs {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: row;
  width: calc(100% - 40px);
  margin: 0px auto;

  .tab {
    height: 30px;
    border-radius: 3px;
    margin-left: 20px;
    //background: url("./assets/tabbg.png");
    //background-size: 100% 100%;
    opacity: 1;
    display: flex;
    cursor: pointer;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;

    span {
      font-size: 13px;
      font-family: MiSans;
      font-weight: 400;
      color: rgba(#ffffff, 0.7);
    }
  }

  .tab.active {
    //background: url("./assets/tabbgActive.png");
    //background-size: 100% 100%;
    opacity: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    align-content: flex-start;

    span {
      font-size: 13px;
      font-family: MiSans;
      font-weight: 500;
      color: #ffffff;
    }
  }
}
</style>
