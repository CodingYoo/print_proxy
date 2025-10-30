<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false">
      <div class="login-header">
        <h1 class="login-title">打印代理服务</h1>
        <p class="login-subtitle">欢迎登录</p>
      </div>

      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        size="large"
        label-placement="left"
        :show-label="false"
      >
        <n-form-item path="username">
          <n-input
            v-model:value="formData.username"
            placeholder="用户名"
            :disabled="loading"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="UserOutlined" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="password">
          <n-input
            v-model:value="formData.password"
            type="password"
            show-password-on="click"
            placeholder="密码"
            :disabled="loading"
            @keydown.enter="handleLogin"
          >
            <template #prefix>
              <n-icon :component="LockOutlined" />
            </template>
          </n-input>
        </n-form-item>

        <n-form-item>
          <n-checkbox v-model:checked="formData.remember" :disabled="loading">
            记住我
          </n-checkbox>
        </n-form-item>

        <n-form-item>
          <n-button
            type="primary"
            size="large"
            :loading="loading"
            :disabled="loading"
            block
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </n-button>
        </n-form-item>
      </n-form>

      <div v-if="error" class="error-message">
        <n-alert type="error" :show-icon="false">
          {{ error }}
        </n-alert>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, type FormInst, type FormRules } from 'naive-ui'
import { UserOutlined, LockOutlined } from '@vicons/antd'
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
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.error-message {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
