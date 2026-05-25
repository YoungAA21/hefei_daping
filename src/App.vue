<script setup>

</script>

<template>
  <router-view/>
</template>

<style lang="scss">

p {
  margin: 0;
}
@font-face {
  font-family: 'DIN-Bold';
  src: url('./fonts/DIN-Bold.otf');
}

@font-face {
  font-family: AlibabaPuHuiTi_2_115_Black;
  src: url('./fonts/AlibabaPuHuiTi-2-115-Black/AlibabaPuHuiTi-2-115-Black.ttf');
}

@font-face {
  font-family: 'AlibabaPuHuiTiR';
  src: url('./fonts/AlibabaPuHuiTi-2-55-Regular/AlibabaPuHuiTi-2-55-Regular.ttf') format('truetype'); /* 现代浏览器 */
}
@font-face {
  font-family: 'AlibabaPuHuiTiB';
  src: url('./fonts/AlibabaPuHuiTi-2-85-Bold/AlibabaPuHuiTi-2-85-Bold.ttf') format('truetype'); /* 现代浏览器 */
}
.hideScrollBar::-webkit-scrollbar {
  width: 0
}

.hideScrollBar {
  -ms-overflow-style: none;
  overflow: -moz-scrollbars-none;
}

.el-popper.is-light {
  background: #0a1b50 !important;
  border: none !important;
}

.el-select-dropdown__item {
  font-size: 14px !important;
  font-family: PingFang;
  color: #FFFFFF !important;
  height: 30px !important;
  border: 1px solid rgba(#4a5f85, 0);
}

.el-select-dropdown__item:hover {
  border: 1px solid #4a5f85;
}

.el-select__popper.el-popper {
  border: 1px solid #4a5f85;
}

.el-popper__arrow {
  display: none;
}

.el-select-dropdown__item.hover, .el-select-dropdown__item:hover {
  background: rgba(9, 27, 82, 0.6) !important;
}

.el-select-dropdown {
  background: rgba(9, 27, 82, 0.6);
  border: 1px solid #004583;
  border-radius: 2px;
  box-shadow: none;
  margin-top: -10px;

  .el-scrollbar {
    --el-scrollbar-opacity: 0.3;
    --el-scrollbar-bg-color: #0a1b50;
    --el-scrollbar-hover-opacity: 0.5;
    --el-scrollbar-hover-bg-color: #0a1b50;
  }
}

.el-scrollbar {
  .el-select-dropdown__list {
    margin: 0 !important;
  }
}

.ml30 {
  margin-left: 30px;
}

.el-select-dropdown.is-multiple .el-select-dropdown__item.selected {
  background: none !important;
}

//火狐浏览器
.scrollBar {
  scrollbar-width: 'auto'; //只有 auto、thin、none
  scrollbar-color: #15777b #15777b; /* 第一个颜色为滚动条的颜色， 第二个颜色为滚动条轨道的颜色 */
}

//谷歌浏览器
.scrollBar::-webkit-scrollbar {
  width: 3px;
  height: 6px;
}

/*滚动条滑块*/
.scrollBar::-webkit-scrollbar-thumb { /*滚动条里面小方块*/
  //border-radius: 10px;
  box-shadow: inset 0 0 5px #57d5cb;
  background: #114b4e;
}

/*滚动条轨道*/
.scrollBar::-webkit-scrollbar-track { /*滚动条里面轨道*/
  box-shadow: inset 0 0 5px #0f696e;
  //border-radius: 10px;
}

.el-scrollbar {
  background-color: #00429d;
  border: 1px solid #4472cb;

  .el-dropdown-menu {
    background: #05162f;
  }

  .el-dropdown-menu__item {
    color: #47c4ff;
    background: #05162f;
  }

  .el-dropdown-menu__item:hover {
    background-color: #4472cb;
  }

  .popper__arrow {
    border: 1px solid #4472cb !important;
  }

  .popper__arrow::after {
    border-top-color: #46bcff !important;
    border-bottom-color: #46bcff !important;
  }
}

</style>
