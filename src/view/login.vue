<template>
  <div class="auth-page">
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
        <span>USER LOGIN</span>
        <strong>账号登录</strong>
      </div>

      <form class="auth-form" autocomplete="off" @submit.prevent="submitForm">
        <label class="field">
          <span>用户名</span>
          <input
              v-model.trim="form.username"
              type="text"
              name="login_user"
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
                name="login_pass"
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
        <!-- 设备标识不在页面展示，请求接口时默认传入 string -->

        <button class="submit-btn" type="submit" :disabled="loading">
          <i></i>
          <span>{{ loading ? '登录中...' : '进入系统' }}</span>
        </button>
      </form>

      <div class="switch-line">
        <span>还没有账号？</span>
        <router-link to="/register">立即注册</router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { login } from '@/api/api/Auth'

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

      this.loading = true
      try {
        const res = await login({
          username: this.form.username,
          password: this.form.password,
          macAddress: 'string'
        })
        const userInfo = res.data || {}

        if (res.status === 200 && userInfo.token) {
          localStorage.setItem('token', userInfo.token)
          localStorage.setItem('access_token', userInfo.token)
          localStorage.setItem('user_info', JSON.stringify(userInfo))
          ElMessage.success(res.message || '登录成功')
          this.$router.replace('/')
        } else {
          ElMessage.error(res.message || '登录失败')
        }
      } catch (error) {
        ElMessage.error(error?.response?.data?.message || '登录失败，请检查账号信息')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
      radial-gradient(circle at 25% 20%, rgba(0, 226, 255, 0.26), transparent 28%),
      radial-gradient(circle at 76% 74%, rgba(255, 184, 77, 0.16), transparent 26%),
      linear-gradient(135deg, #030816 0%, #071b34 46%, #06101f 100%);
  color: #fff;
}

.auth-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
      linear-gradient(rgba(70, 196, 255, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(70, 196, 255, 0.08) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, transparent 0%, #000 20%, #000 78%, transparent 100%);
}

.stars {
  position: absolute;
  inset: 0;
  background:
      radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 1px, transparent 2px) 8% 12% / 190px 190px,
      radial-gradient(circle, rgba(101, 213, 255, 0.8) 0 1px, transparent 2px) 48% 38% / 230px 230px;
  animation: drift 18s linear infinite;
}

.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  top: -20%;
  height: 18vh;
  background: linear-gradient(180deg, transparent, rgba(0, 234, 255, 0.12), transparent);
  animation: scan 5s ease-in-out infinite;
}

.energy-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(62, 203, 255, 0.42);
  box-shadow: 0 0 40px rgba(0, 221, 255, 0.2), inset 0 0 28px rgba(0, 221, 255, 0.12);
}

.ring-one {
  width: 520px;
  height: 520px;
  left: 7vw;
  bottom: -190px;
  animation: rotateRing 18s linear infinite;
}

.ring-two {
  width: 360px;
  height: 360px;
  right: 9vw;
  top: -130px;
  border-color: rgba(255, 206, 112, 0.3);
  animation: rotateRing 14s linear reverse infinite;
}

.auth-panel {
  width: min(480px, calc(100vw - 48px));
  min-height: 560px;
  position: relative;
  z-index: 2;
  padding: 42px 46px 34px;
  box-sizing: border-box;
  background: linear-gradient(145deg, rgba(7, 28, 54, 0.86), rgba(4, 12, 27, 0.9));
  border: 1px solid rgba(82, 210, 255, 0.45);
  border-radius: 8px;
  box-shadow:
      0 26px 80px rgba(0, 0, 0, 0.55),
      0 0 50px rgba(0, 194, 255, 0.2),
      inset 0 0 38px rgba(0, 194, 255, 0.08);
  backdrop-filter: blur(16px);
  animation: panelIn 0.8s ease-out both;
}

.auth-panel::before,
.auth-panel::after {
  content: '';
  position: absolute;
  width: 58px;
  height: 58px;
  border-color: #65d5ff;
  border-style: solid;
}

.auth-panel::before {
  left: -1px;
  top: -1px;
  border-width: 2px 0 0 2px;
}

.auth-panel::after {
  right: -1px;
  bottom: -1px;
  border-width: 0 2px 2px 0;
}

.panel-glow {
  position: absolute;
  inset: 1px;
  pointer-events: none;
  background: linear-gradient(120deg, transparent 0%, rgba(74, 226, 255, 0.2) 48%, transparent 58%);
  animation: panelLight 4.5s ease-in-out infinite;
}

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.brand-mark {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(101, 213, 255, 0.6);
  background: rgba(0, 149, 251, 0.14);
  box-shadow: 0 0 24px rgba(0, 204, 255, 0.34);
  transform: rotate(45deg);
}

.brand-mark span {
  width: 20px;
  height: 20px;
  border: 2px solid #ffcc66;
  display: block;
  transform: rotate(45deg);
  animation: pulseCore 1.8s ease-in-out infinite;
}

.brand h1 {
  margin: 0;
  font-size: 28px;
  font-family: AlibabaPuHuiTi_2_115_Black;
  letter-spacing: 4px;
}

.brand p {
  margin-top: 4px;
  color: #65d5ff;
  font-size: 12px;
  letter-spacing: 2px;
}

.panel-title {
  position: relative;
  z-index: 1;
  margin: 46px 0 28px;
}

.panel-title span {
  color: #ffcc66;
  font-family: DIN-Bold;
  font-size: 13px;
  letter-spacing: 5px;
}

.panel-title strong {
  display: block;
  margin-top: 8px;
  font-size: 30px;
  letter-spacing: 3px;
}

.auth-form {
  position: relative;
  z-index: 1;
}

.field {
  display: block;
  margin-bottom: 20px;
}

.field span {
  display: block;
  margin-bottom: 9px;
  color: #9ea8c7;
  font-size: 14px;
}

.field input {
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid rgba(68, 114, 203, 0.75);
  border-radius: 4px;
  outline: none;
  padding: 0 15px;
  color: #fff;
  background: rgba(3, 15, 32, 0.76);
  box-shadow: inset 0 0 16px rgba(0, 149, 251, 0.12);
  transition: border-color 0.25s, box-shadow 0.25s;
}

.field input:focus {
  border-color: #65d5ff;
  box-shadow: 0 0 18px rgba(0, 221, 255, 0.26), inset 0 0 20px rgba(0, 149, 251, 0.18);
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 64px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  height: 32px;
  width: 38px;
  border: 1px solid rgba(101, 213, 255, 0.42);
  border-radius: 4px;
  color: #65d5ff;
  background: rgba(0, 149, 251, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: #fff;
  border-color: #ffcc66;
}

.password-toggle span {
  width: 18px;
  height: 12px;
  display: block;
  position: relative;
  border: 2px solid currentColor;
  border-radius: 50% / 60%;
}

.password-toggle span::before {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  left: 50%;
  top: 50%;
  border-radius: 50%;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.password-toggle span::after {
  content: '';
  position: absolute;
  width: 24px;
  height: 2px;
  left: 50%;
  top: 50%;
  background: currentColor;
  transform: translate(-50%, -50%) rotate(-38deg) scaleX(1);
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.password-toggle.is-visible span::after {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(-38deg) scaleX(0);
}

.submit-btn {
  width: 100%;
  height: 52px;
  margin-top: 10px;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  color: #06101f;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(90deg, #65d5ff 0%, #ffcc66 100%);
  box-shadow: 0 0 26px rgba(101, 213, 255, 0.36);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.submit-btn i {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 62%);
  transform: translateX(-120%);
  animation: buttonSweep 2.6s ease-in-out infinite;
}

.submit-btn span {
  position: relative;
  z-index: 1;
}

.switch-line {
  position: relative;
  z-index: 1;
  margin-top: 22px;
  text-align: center;
  color: #9ea8c7;
  font-size: 14px;
}

.switch-line a {
  color: #65d5ff;
  margin-left: 8px;
  text-decoration: none;
}

@keyframes drift {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-80px, 80px, 0); }
}

@keyframes scan {
  0%, 100% { transform: translateY(0); opacity: 0; }
  15%, 75% { opacity: 1; }
  50% { transform: translateY(125vh); }
}

@keyframes rotateRing {
  to { transform: rotate(360deg); }
}

@keyframes panelIn {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes panelLight {
  0%, 100% { transform: translateX(-120%); opacity: 0; }
  35%, 65% { opacity: 1; }
  100% { transform: translateX(120%); }
}

@keyframes pulseCore {
  50% { box-shadow: 0 0 18px #ffcc66; transform: rotate(45deg) scale(0.78); }
}

@keyframes buttonSweep {
  45%, 100% { transform: translateX(120%); }
}
</style>
