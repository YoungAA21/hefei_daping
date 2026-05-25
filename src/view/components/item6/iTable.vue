<template>
  <div class="tableCom">
    <div class="tableHead">
      <div class="tableHeadItem" v-for="(item,index) in head" :key="index" :style="{width:item.flex}">{{ item.title }}
      </div>
    </div>
    <div class="tableBody" :class="{ 'scroll-animation': shouldScroll }">
      <div class="scroll-content">
        <div class="tableBody2" v-for="(item,index) in displayList" :key="index">
          <div class="tableBody2Item" :style="{width: head[0].flex}">
            <span class="num">{{item.line}}</span>
          </div>
          <div class="tableBody2Item" :style="{width: head[1].flex}">
            <span class="num">{{item.production}}</span>
          </div>
          <div class="tableBody2Item" :style="{width: head[2].flex}">
            <span class="num">{{item.rejectionrate}}</span>
          </div>
          <div class="tableBody2Item" :style="{width: head[3].flex}">
            <span class="num">{{item.getTime}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "tableCom",
  props: {
    head: {
      type: Array,
      default() {
        return [{
          title: '产线名称',
          flex: '25%'
        }, {
          title: '产量',
          flex: '20%'
        }, {
          title: '剔除数',
          flex: '15%'
        },
          {
            title: '时间',
            flex: '40%'
          }];
      }
    },
    list: {
      type: Array,
      default() {
        return [];
      }
    },
  },
  computed: {
    shouldScroll() {
      return this.list.length > 4;
    },
    // 为了无缝滚动，需要复制一份数据
    displayList() {
      if (this.list.length <= 4) {
        return this.list;
      }
      // 复制一份数据用于无缝滚动
      return [...this.list, ...this.list];
    }
  },
  data() {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.tableCom {
  width: calc(100% - 0px);
  margin-left: 0px;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;

  .tableHead {
    width: 100%;
    height: 39px;
    min-height: 39px;
    background: rgba(#a6c6fd, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: nowrap;
    flex-direction: row;
    flex-shrink: 0;

    .tableHeadItem {
      font-size: 14px;
      font-family: PingFang SC-Bold, PingFang SC;
      font-weight: bold;
      color: #fff;
      text-align: center;
    }
  }

  .tableBody {
    position: relative;
    height: calc(34px * 4); /* 固定高度为4行 */
    overflow: hidden;

    .scroll-content {
      position: relative;
    }

    .tableBody2 {
      height: 34px;
      min-height: 34px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: nowrap;
      flex-direction: row;
      background: rgba(#308EFF, 0);

      .tableBody2Item {
        font-size: 14px;
        font-family: MicrosoftYaHei;
        font-weight: 400;
        color: #CAD3ED;
        text-shadow: 0px 4px 10px rgba(0, 42, 108, 0.12);
        text-align: center;

        .num {
          width: calc(100% - 0px);
          overflow: hidden;
          text-align: center;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }

    .tableBody2:nth-child(2n) {
      background: rgba(#a6c6fd, 0.24);
    }
  }

  /* 滚动动画 */
  .scroll-animation {
    .scroll-content {
      animation: scrollUp 20s linear infinite;

      /* 鼠标悬停时暂停滚动 */
      &:hover {
        animation-play-state: paused;
      }
    }
  }
}

/* 向上滚动动画 */
@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%); /* 向上移动一半高度（因为数据复制了一份） */
  }
}
</style>