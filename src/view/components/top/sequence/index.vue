<template>
  <canvas ref="animation_canvas" class="animation_canvas" id="animation_canvas"></canvas>
</template>

<script>

export default {
  name: "sequence",
  data() {
    return {}
  },
  props: {
    // 文件数量
    fileLength: {
      type: Number,
      default() {
        return 70;
      }
    },
    // 动画间隔
    IntervalTime: {
      type: Number,
      default() {
        return 80;
      }
    },
  },
  async mounted() {
    var that = this;
    await that.Sequence()
  },
  methods: {
    async Sequence() {
      var that = this;
      //初始化参数
      var canvas = null;
      var ctx = null;
      var sources = [];

      async function loadImages2() {
        for (let i = 0; i <= 74; i++) {
          const image = await import(`./topbg/topbg_${i}.png`);
          sources.push(image.default);
        }
      }

      await loadImages2();

      var width = this.$refs.animation_canvas.offsetWidth
      var height = this.$refs.animation_canvas.offsetHeight
      canvas = this.$refs.animation_canvas;
      canvas.width = width;
      canvas.height = height;

      ctx = canvas.getContext("2d");

      //预加载序列图片
      function loadImages(sources, callback) {
        var loadedImages = 0;
        var numImages = 0;
        var images = [];
        // get num of sources
        numImages = sources.length;
        for (var i = 0, len = sources.length; i < len; i++) {
          images[i] = new Image();
          //当一张图片加载完成时执行
          images[i].onload = function () {
            //当所有图片加载完成时，执行回调函数callback
            if (++loadedImages >= numImages) {
              callback(images);
            }
          };
          //把sources中的图片信息导入images数组
          images[i].src = sources[i];
//            console.log(images);
        }
      }

      //播放图片动画
      function playImages(images) {
        var imageNum = images.length;
        var imageNow = 0;
        setInterval(function () {
          ctx.fillStyle = "rgba(0,0,0,0)";
          ctx.clearRect(0, 0, width, height);
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(images[imageNow], 0, 0, width, height);
          imageNow++;
          if (imageNow >= imageNum) {
            imageNow = 0;
          }
        }, that.IntervalTime)
      }

      //ctx.globalAlpha=0.5
      //执行图片预加载，加载完成后执行main
      loadImages(sources, function (images) {
        playImages(images)
      });
    }
  },
}
</script>

<style lang="scss" scoped>
.animation_canvas {
  position: absolute;
  left: 0;
  top: 0px;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
