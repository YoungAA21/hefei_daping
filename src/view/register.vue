<template>
  <div class="auth-page register-page">
    <div class="stars"></div>
    <div class="scan-line"></div>
    <div class="energy-ring ring-one"></div>
    <div class="energy-ring ring-two"></div>

    <section class="auth-panel">
      <div class="panel-glow"></div>
      <div class="brand">
        <div class="brand-mark">
          <span></span>
        </div>
        <div>
          <h1>检测监控大屏</h1>
          <p>Industrial Monitoring System</p>
        </div>
      </div>

      <div class="panel-title">
        <span>USER REGISTER</span>
        <strong>账号注册</strong>
      </div>

      <form class="auth-form" autocomplete="off" @submit.prevent="submitForm">
        <label class="field">
          <span>用户名</span>
          <input
              v-model.trim="form.username"
              type="text"
              name="register_user"
              autocomplete="off"
              :readonly="inputReadonly"
              placeholder="请输入用户名"
              @focus="inputReadonly = false"
          >
        </label>
        <label class="field">
          <span>密码</span>
          <div class="password-field">
            <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                name="register_pass"
                autocomplete="new-password"
                :readonly="inputReadonly"
                placeholder="请输入密码"
                @focus="inputReadonly = false"
            >
            <button
                class="password-toggle"
                :class="{ 'is-visible': showPassword }"
                type="button"
                :title="showPassword ? '隐藏密码' : '查看密码'"
                @click="showPassword = !showPassword"
            >
              <span></span>
            </button>
          </div>
        </label>
        <!-- 角色和权限不在页面展示，请求接口时默认传入 Admin 和 1 -->

        <button class="submit-btn" type="submit" :disabled="loading">
          <i></i>
          <span>{{ loading ? '注册中...' : '创建账号' }}</span>
        </button>
      </form>

      <div class="switch-line">
        <span>已有账号？</span>
        <router-link to="/login">返回登录</router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { register } from '@/api/api/Auth'

function getErrorMessage(error) {
  const data = error?.response?.data
  if (typeof data === 'string') return data
  if (data?.message) return data.message
  if (data?.title) return data.title
  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (firstError) return firstError
  }
  return error?.message || '注册失败，请稍后重试'
}

export default {
  data() {
    return {
      loading: false,
      showPassword: false,
      inputReadonly: true,
      form: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    async submitForm() {
      if (!this.form.username || !this.form.password) {
        ElMessage.warning('请输入用户名和密码')
        return
      }
      if (this.form.username.length < 3) {
        ElMessage.warning('用户名至少 3 位')
        return
      }
      if (this.form.password.length < 6) {
        ElMessage.warning('密码至少 6 位')
        return
      }

      this.loading = true
      try {
        const res = await register({
          username: this.form.username,
          password: this.form.password,
          role: 'Admin',
          permission: '1'
        })
        if (res?.userId || res?.username) {
          ElMessage.success('注册成功，请登录')
          this.$router.replace('/login')
        } else {
          ElMessage.error(res?.message || '注册失败')
        }
      } catch (error) {
        ElMessage.error(getErrorMessage(error))
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import './auth.scss';

.register-page {
  .auth-panel {
    min-height: 560px;
  }
}
</style>
