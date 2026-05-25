<template>
  <div class="videos">
    <video
        :src="videoSrc"
        autoplay
        muted
        loop
        playsinline
        class="pure-video">
    </video>
  </div>
</template>

<script>
export default {
  props: ['videoSrc'],
  mounted() {
    // 确保视频播放
    const video = this.$el.querySelector('.pure-video');
    video.play().catch(e => {
      console.log('自动播放被阻止:', e);
    });
  }
}
</script>

<style lang="scss" scoped>
.videos {
  position: relative;
  width: 100%;
  height: 100%;

  .pure-video {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 保持视频比例 */
    background: #000;
  }
}
</style>