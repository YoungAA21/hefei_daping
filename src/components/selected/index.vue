<template>
  <div class="el-selectedBody1">
    <el-select @change="getData" popper-class="el-selectedBody3" :model-value="active" class="el-selectedBody2"
               placeholder="请选择">
      <el-option
          v-for="item in list"
          :key="item.value"
          :label="item.label"
          :value="item.value"
      />
    </el-select>
  </div>
</template>

<script>

export default {
  name: "elselect",
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
  methods: {
    getData(e) {
      this.$emit('update:active', e)
    }
  },
}
</script>

<style lang="scss" scoped>
.el-selectedBody1 {
  width: 116px;
  height: 32px;
  background: url("./assets/selectedbg.png") no-repeat;
  background-size: 100% 100%;
}

:deep(.el-selectedBody2) {
  .el-input__wrapper {
    background: none;
    height: 28px;
    box-shadow: 0 0 0 0px #fff inset !important;
    outline: none;

    .el-input__inner {
      font-size: 14px;
      font-family: PingFang SC-Medium, PingFang SC;
      font-weight: 500;
      color: #FFFFFF;
    }
  }
}

.el-selectedBody3 {

  .el-select-dropdown.is-multiple .el-select-dropdown__item.selected {
    background: none !important;
  }

  .el-select-dropdown__item {
    font-size: 14px !important;
    font-family: PingFang;
    color: #FFFFFF !important;
    height: 30px !important;
    line-height: 30px !important;
    border: 1px solid rgba(#4a5f85, 0);
  }

  .el-popper__arrow {
    display: none;
  }

  .el-select-dropdown__item.hover, .el-select-dropdown__item:hover {
    background: rgba(9, 27, 82, 0.6) !important;
  }

  .el-select-dropdown.is-multiple .el-select-dropdown__item.selected {
    background: none !important;
  }

}

</style>
<style lang="scss">
.el-selectedBody3 {
  background: #0a1b50 !important;
  border: none !important;

  .el-popper__arrow::before {
    border: 1px solid #409eff !important;
    background: #409eff !important;
    right: 0;
  }
}

</style>
