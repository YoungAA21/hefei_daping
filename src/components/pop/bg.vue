<template>
  <div class="gridView">
    <!--  左上角-->
    <div class="gLeftTop"></div>
    <!--  顶部中间-->
    <div class="gTopCenter"></div>
    <!--  右上角-->
    <div class="gRightTop"></div>
    <!--    中间部分-->
    <div class="gCenterMain">
      <!--  左侧中间-->
      <div class="gLeftCenter"></div>
      <!--  右侧中间-->
      <div class="gRightCenter"></div>
      <!--  中间-->
      <div class="gCenter"></div>
    </div>
    <!--  左下角-->
    <div class="gLeftBottom"></div>
    <!--  底部中间-->
    <div class="gBottomCenter"></div>
    <!--  右下角-->
    <div class="gRightBottom"></div>
  </div>
</template>

<script>

export default {
  name: "gridView"
}
</script>

<style lang="scss" scoped>
.gridView {
  position: absolute;
  top: 0;
  left: 0;
  width: 150px;
  height: 200px;
  bottom: 0;
  right: 0;
  z-index: -1;
  pointer-events: none; //避免div层被点击
  //左上角
  .gLeftTop {
    background: url("./assets/left_top.png") no-repeat;
    background-size: 100% 100%;
    position: absolute;
    left: 0;
    width: 20PX;
    height: 20PX;
  }

  //顶部中间
  .gTopCenter {
    width: calc(100% - 20PX - 326PX);
    left: 20PX;
    position: absolute;
    height: 20PX;
    background: url("./assets/top.png") repeat-x;
    background-size: 100% 100%;
  }

  //右上角
  .gRightTop {
    background: url("./assets/right_top.png") no-repeat;
    background-size: 100% 100%;
    position: absolute;
    right: 0;
    top: 0;
    width: 326PX;
    height: 20PX;
  }

  //左下角
  .gLeftBottom {
    background: url("./assets/left_bottom.png") no-repeat;
    background-size: 100% 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    width: 12PX;
    height: 19PX;
  }

  //底部中间
  .gBottomCenter {
    width: calc(100% - 12PX - 126PX);
    left: 12PX;
    bottom: 0;
    position: absolute;
    height: 19PX;
    background: url("./assets/bottom.png") repeat-x;
    background-size: 100% 100%;
  }

  //右下角
  .gRightBottom {
    background: url("./assets/right_bottom.png") no-repeat;
    background-size: 100% 100%;
    position: absolute;
    right: 0;
    bottom: 0;
    width: 126PX;
    height: 19PX;
  }

  //中间部分
  .gCenterMain {
    width: 100%;
    height: calc(100% - 20PX - 19PX);
    position: absolute;
    top: 20PX;
    bottom: 19PX;
    //左侧中间
    .gLeftCenter {
      left: 0;
      height: 100%;
      position: absolute;
      background: url("./assets/left_center.png") repeat-y;
      background-size: 100%;
      width: 2PX;
    }

    .gCenter {
      width: calc(100% - 2PX - 2PX);
      left: 2PX;
      bottom: 0;
      position: absolute;
      height: 100%;
      background: url("./assets/center.png") no-repeat;
      background-size: 100% 100%;
    }

    //右侧中间
    .gRightCenter {
      height: 100%;
      position: absolute;
      right: 0;
      background: url("./assets/right_center.png");
      background-size: 100% 100%;
      width: 2PX;
    }
  }
}
</style>
