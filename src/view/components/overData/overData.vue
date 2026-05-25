<template>
  <div class="overview">
    <div class="overview-item">
      <div class="overview-icon">
        <i class="iconfont icon-channeng">
          <img class="iconfont_img" src="../../../assets/icon/total_pro.png"/>
        </i>
      </div>
      <div class="overview-content">
        <div class="overview-label">总产量</div>
        <div class="overview-value">1,258,743</div>
        <div class="overview-unit">件</div>
      </div>
      <div class="overview-glow"></div>
    </div>

    <div class="overview-item">
      <div class="overview-icon">
        <i class="iconfont icon-biaoqian">
          <img class="iconfont_img" src="../../../assets/icon/NG.png"/>
        </i>
      </div>
      <div class="overview-content">
        <div class="overview-label">NG率</div>
        <div class="overview-value">0.85<span class="overview-percent">%</span></div>
        <div class="overview-trend up">↓ 较昨日下降 0.12%</div>
      </div>
      <div class="overview-glow"></div>
    </div>

    <div class="overview-item">
      <div class="overview-icon">
        <i class="iconfont icon-shanchu">
          <img class="iconfont_img" src="../../../assets/icon/error_total.png"/>
        </i>
      </div>
      <div class="overview-content">
        <div class="overview-label">剔除数</div>
        <div class="overview-value">10,687</div>
        <div class="overview-trend down">↑ 较昨日增加 234</div>
      </div>
      <div class="overview-glow"></div>
    </div>

    <div class="overview-item">
      <div class="overview-icon">
        <i class="iconfont icon-shijian">
          <img class="iconfont_img" src="../../../assets/icon/work_time.png"/>
        </i>
      </div>
      <div class="overview-content">
        <div class="overview-label">运行时长</div>
        <div class="overview-value">286<span class="overview-unit-small">h</span></div>
        <div class="overview-trend">本月累计 648h</div>
      </div>
      <div class="overview-glow"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Overview',
  data() {
    return {
      // 可以在这里定义数据，后续可以从props传入
    }
  }
}
</script>

<style lang="scss" scoped>
.overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 0 40px;
  height: 100%;
}

.overview-item {
  position: relative;
  background: linear-gradient(135deg,
      rgba(16, 36, 71, 0.8) 0%,
      rgba(10, 25, 55, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 12px;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(64, 158, 255, 0.6);
    box-shadow:
        0 12px 40px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(64, 158, 255, 0.1),
        transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }
}

.overview-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg,
      transparent,
      rgba(64, 158, 255, 0.1),
      transparent);
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.overview-item:hover .overview-glow {
  opacity: 1;
  animation: glowPulse 2s infinite;
}

.overview-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  .iconfont {
    font-size: 24px;
    color: white;
  }
  .iconfont_img{
    width: 60px;
    height: 60px;
  }
}

.overview-content {
  flex: 1;
}

.overview-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
  font-weight: 300;
  letter-spacing: 1px;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.5);
  margin-bottom: 2px;
  font-family: 'Arial', sans-serif;

  .overview-percent {
    font-size: 18px;
    margin-left: 2px;
  }

  .overview-unit-small {
    font-size: 18px;
    margin-left: 2px;
    font-weight: normal;
  }
}

.overview-unit {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
}

.overview-trend {
  font-size: 12px;
  margin-top: 3px;

  &.up {
    color: #67c23a;
  }

  &.down {
    color: #f56c6c;
  }

  &:not(.up):not(.down) {
    color: rgba(255, 255, 255, 0.6);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* 响应式调整 */
@media (max-width: 1920px) {
  .overview {
    padding: 0 30px;
    gap: 15px;
  }

  .overview-value {
    font-size: 24px;
  }

  .overview-icon {
    width: 45px;
    height: 45px;

    .iconfont {
      font-size: 20px;
    }
  }
}

@media (max-width: 1440px) {
  .overview {
    padding: 0 20px;
    gap: 12px;
  }

  .overview-value {
    font-size: 22px;
  }

  .overview-item {
    padding: 12px 15px;
  }
}
</style>