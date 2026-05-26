<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const apiStatus = ref('normal')
const apiMessage = ref('')
const apiUrl = ref('')
const noticeVisible = ref(false)
let recoverTimer = null

const noticeClass = computed(() => ({
  'api-notice': true,
  'api-notice-error': apiStatus.value === 'error',
  'api-notice-recovered': apiStatus.value === 'recovered'
}))

const noticeTitle = computed(() => {
  return apiStatus.value === 'recovered' ? '服务连接已恢复' : '后端服务连接异常'
})

const noticeText = computed(() => {
  if (apiStatus.value === 'recovered') {
    return '数据接口已恢复，页面会继续自动刷新数据。'
  }
  return apiMessage.value || '暂时无法获取实时数据，请确认后端服务是否启动或网络是否正常。'
})

function handleApiStatus(event) {
  const detail = event.detail || {}
  clearTimeout(recoverTimer)

  if (detail.type === 'recovered') {
    apiStatus.value = 'recovered'
    apiMessage.value = ''
    apiUrl.value = ''
    noticeVisible.value = true
    recoverTimer = setTimeout(() => {
      noticeVisible.value = false
      apiStatus.value = 'normal'
    }, 2500)
    return
  }

  apiStatus.value = 'error'
  apiMessage.value = detail.message
  apiUrl.value = detail.url
  noticeVisible.value = true
}

function reloadPage() {
  window.location.reload()
}

function closeNotice() {
  noticeVisible.value = false
}

onMounted(() => {
  window.addEventListener('api-status-change', handleApiStatus)
})

onBeforeUnmount(() => {
  window.removeEventListener('api-status-change', handleApiStatus)
  clearTimeout(recoverTimer)
})
</script>

<template>
  <div class="app-root">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <transition name="notice-slide">
      <div v-if="noticeVisible" :class="noticeClass">
        <div class="api-notice-icon"></div>
        <div class="api-notice-content">
          <strong>{{ noticeTitle }}</strong>
          <p>{{ noticeText }}</p>
          <span v-if="apiUrl">接口：{{ apiUrl }}</span>
        </div>
        <button v-if="apiStatus === 'error'" class="api-notice-retry" @click="reloadPage">重试</button>
        <button class="api-notice-close" @click="closeNotice">×</button>
      </div>
    </transition>
  </div>
</template>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  background: #030816;
}

body {
  overflow: hidden;
  color: #eaf9ff;
  font-family: AlibabaPuHuiTiR, Arial, sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.app-root {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background:
      radial-gradient(circle at 18% 14%, rgba(0, 194, 255, 0.12), transparent 28%),
      radial-gradient(circle at 82% 76%, rgba(255, 204, 102, 0.08), transparent 26%),
      #030816;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.28s ease, filter 0.28s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  filter: blur(4px);
}

.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.notice-slide-enter-from,
.notice-slide-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.api-notice {
  position: fixed;
  right: 24px;
  top: 24px;
  z-index: 3000;
  width: min(420px, calc(100vw - 48px));
  min-height: 78px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto 28px;
  gap: 12px;
  align-items: center;
  padding: 14px 12px 14px 16px;
  border: 1px solid rgba(101, 213, 255, 0.42);
  border-radius: 6px;
  background:
      radial-gradient(circle at 0% 0%, rgba(101, 213, 255, 0.2), transparent 48%),
      linear-gradient(145deg, rgba(7, 28, 54, 0.96), rgba(3, 10, 24, 0.96));
  box-shadow:
      0 18px 52px rgba(0, 0, 0, 0.42),
      0 0 28px rgba(0, 194, 255, 0.18),
      inset 0 0 22px rgba(0, 194, 255, 0.08);
  pointer-events: initial;
}

.api-notice::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #65d5ff, #ffcc66, transparent);
}

.api-notice-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid currentColor;
  position: relative;
  color: #65d5ff;
  box-shadow: 0 0 18px currentColor;
}

.api-notice-icon::before,
.api-notice-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: currentColor;
  border-radius: 2px;
}

.api-notice-icon::before {
  top: 7px;
  width: 2px;
  height: 10px;
}

.api-notice-icon::after {
  bottom: 6px;
  width: 3px;
  height: 3px;
}

.api-notice-content {
  min-width: 0;
}

.api-notice-content strong {
  display: block;
  margin-bottom: 5px;
  color: #fff;
  font-size: 15px;
  letter-spacing: 1px;
}

.api-notice-content p,
.api-notice-content span {
  display: block;
  margin: 0;
  color: #bdefff;
  font-size: 12px;
  line-height: 18px;
}

.api-notice-content span {
  margin-top: 2px;
  color: #9ea8c7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-notice-error {
  border-color: rgba(255, 133, 133, 0.48);
}

.api-notice-error .api-notice-icon {
  color: #ff8585;
}

.api-notice-recovered .api-notice-icon {
  color: #34da62;
}

.api-notice-retry,
.api-notice-close {
  height: 28px;
  border: 1px solid rgba(101, 213, 255, 0.36);
  border-radius: 4px;
  background: rgba(0, 149, 251, 0.12);
  color: #bdefff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.api-notice-retry {
  padding: 0 12px;
}

.api-notice-close {
  width: 28px;
  font-size: 18px;
  line-height: 24px;
}

.api-notice-retry:hover,
.api-notice-close:hover {
  color: #06101f;
  border-color: #65d5ff;
  background: #65d5ff;
}

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
