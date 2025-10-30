<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false">
      <div class="login-header">
        <div class="logo-container">
          <div class="logo-circle">
            <span class="logo-text">P</span>
          </div>
        </div>
        <h1 class="login-title">Print Proxy Service</h1>
        <p class="login-subtitle">统一打印代理平台</p>
      </div>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        size="large"
        label-placement="top"
        :show-label="true"
      >
        <n-form-item path="username" label="用户名">
          <n-input
            v-model:value="formData.username"
            placeholder="输入用户名"
            :disabled="loading"
            @keydown.enter="handleLogin"
          />
        </n-form-item>

        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            placeholder="输入密码"
            :disabled="loading"
            @keydown.enter="handleLogin"
          />
        </n-form-item>

        <n-form-item>
          <div class="form-footer">
            <n-checkbox v-model:checked="formData.remember" :disabled="loading">
              保持登录状态
            </n-checkbox>
            <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">
              忘记密码？
            </a>
          </div>
        </n-form-item>

        <n-form-item>
          <n-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="loading"
            block
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '立即登录' }}
          </n-button>
        </n-form-item>
      </n-form>

      <div v-if="error" class="error-message">
        <n-alert type="error" :show-icon="false">
          {{ error }}
        </n-alert>
      </div>

      <div class="login-footer">
        <p class="footer-text">如未配置账号，请联系系统管理员开通访问权限。</p>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

// 表单引用
const formRef = ref<FormInst | null>(null)

// 表单数据
const formData = reactive<LoginCredentials>({
  username: '',
  password: '',
  remember: false
})

// 加载状态
const loading = ref(false)
const error = ref<string | null>(null)

// 表单验证规则
const rules: FormRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: ['blur', 'input']
    },
    {
      min: 3,
      max: 50,
      message: '用户名长度应在 3 到 50 个字符之间',
      trigger: ['blur']
    }
  ],
  password: [
    {
      required: true,
      message: '请输入密码',
      trigger: ['blur', 'input']
    },
    {
      min: 6,
      message: '密码长度至少为 6 个字符',
      trigger: ['blur']
    }
  ]
}

// 处理登录
const handleLogin = async () => {
  error.value = null

  // 验证表单
  try {
    await formRef.value?.validate()
  } catch (validationError) {
    return
  }

  loading.value = true

  try {
    // 调用登录接口
    await authStore.login(formData)

    message.success('登录成功')

    // 获取重定向路径
    const redirect = (route.query.redirect as string) || '/dashboard'
    
    // 跳转到目标页面
    await router.push(redirect)
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.response?.data?.detail || authStore.error || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}

// 处理忘记密码
const handleForgotPassword = () => {
  message.info('请联系系统管理员重置密码')
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a5f 0%, #2a5279 50%, #1e3a5f 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 40px 32px;
  background: #ffffff;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.logo-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
}

.logo-text {
  font-size: 36px;
  font-weight: 600;
  color: #4285f4;
  line-height: 1;
}

.login-title {
  font-size: 26px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: 0.3px;
}

.login-subtitle {
  font-size: 14px;
  color: #999999;
  margin: 0;
  font-weight: 400;
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-link {
  color: #4285f4;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #1967d2;
  text-decoration: underline;
}

.login-button {
  height: 44px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  background: #4285f4;
  border: none;
  transition: all 0.3s ease;
}

.login-button:hover:not(:disabled) {
  background: #1967d2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.error-message {
  margin-top: 16px;
}

.login-footer {
  margin-top: 28px;
  text-align: center;
}

.footer-text {
  font-size: 13px;
  color: #999999;
  margin: 0;
  line-height: 1.6;
}

/* 自定义表单样式 */
:deep(.n-form-item-label) {
  color: #666666;
  font-size: 14px;
  font-weight: 500;
  padding-bottom: 8px;
}

:deep(.n-input) {
  border-radius: 8px;
  height: 44px;
}

:deep(.n-input__input-el) {
  font-size: 14px;
}

:deep(.n-checkbox__label) {
  font-size: 14px;
  color: #666666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
    padding: 32px 24px;
  }

  .login-title {
    font-size: 22px;
  }

  .logo-circle {
    width: 64px;
    height: 64px;
  }

  .logo-text {
    font-size: 32px;
  }
}
</style>
