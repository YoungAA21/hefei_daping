<template>
  <div class="itemBodys2">
    <iTable :list="filteredList"></iTable>
  </div>
</template>

<script>
import iTable from './iTable.vue'
import {getlineInfo} from "@/api/api/LargeScreenData.js";

export default {
  props: {
    lineData: {
      type: Array,
      default: () => []
    }
  },
  name: "alarmList",
  data() {
    return {
      filteredList: []
    }
  },
  components: {iTable},
  async mounted() {
    await this.getLineData();
    // 启动5秒定时请求
    this.dataInterval = setInterval(this.getLineData, 5000);
  },
  beforeDestroy() {
    // 组件销毁时清除定时器
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }
  },
  methods: {
    // 获取当前时间，精确到秒
    getCurrentTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },

    async getLineData() {
      try {
        const data = {};
        const res = await getlineInfo(data);

        if (!this.lineData[0] || !this.lineData[0].line) {
          return;
        }

        const targetLine = this.lineData[0].line;

        const lineData = res.data.find(item => {
          let lineName = item.line;
          if (lineName && lineName.startsWith('高')) {
            const lineNumber = lineName.replace('高', '');
            lineName = `gao${lineNumber}`;
          }
          return lineName === targetLine;
        });

        if (lineData) {
          const dataWithTime = {
            ...lineData,
            getTime: this.getCurrentTime()
          };

          // 改为将新数据添加到数组末尾
          this.filteredList.push(dataWithTime);

          // 始终保持最多10条数据
          if (this.filteredList.length > 10) {
            this.filteredList = this.filteredList.slice(1); // 移除最旧的一条
          }

          // 按时间正序排序（最早的在最前面）
          this.filteredList.sort((a, b) => {
            return new Date(a.getTime) - new Date(b.getTime);
          });
        }

      } catch (error) {
        console.error('获取产线数据失败:', error);
      }
    }
  },
}
</script>
<style lang="scss" scoped>
.itemBodys2 {
  position: relative;
  width: 100%;
  height: calc(100% - 20px);
  margin-top: 10px;
}
</style>