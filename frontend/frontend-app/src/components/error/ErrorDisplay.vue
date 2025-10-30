<template>
  <div class="error-display" :class="[`error-${type}`, `error-${size}`]">
    <n-result
      :status="resultStatus"
      :title="title || defaultTitle"
      :description="description"
    >
      <template #icon>
        <n-icon v-if="customIcon" :size="iconSize">
          <component :is="customIcon" />
        </n-icon>
      </template>

      <template #footer>
        <n-space justify="center">
          <n-button
            v-if="showRetry"
            type="primary"
            :loading="retrying"
            @click="handleRetry"
          >
            {{ retryText }}
          </n-button>
          <n-button v-if="showBack" @click="handleBack">
            {{ backText }}
          </n-button>
          <n-button v-if="showHome" @click="handleHome">
            {{ homeText }}
          </n-button>
          <slot name="actions" />
        </n-space>
      </template>
    </n-result>

    <!-- 错误详情（可折叠） -->
    <div v-if="showDetails && errorDetails" class="error-details">
      <n-collapse>
        <n-collapse-item title="错误详情" name="details">
          <n-code :code="errorDetails" language="json" />
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NResult, NButton, NSpace, NIcon, NCollapse, NCollapseItem, NCode } from 'naive-ui'
import type { Component } from 'vue'

interface Props {
  type?: 'network' | 'auth' | 'permission' | 'notfound' | 'server' | 'validation' | 'unknown'
  title?: string
  description?: string
  size?: 'small' | 'medium' | 'large'
  showRetry?: boolean
  showBack?: boolean
  showHome?: boolean
  showDetails?: boolean
  retryText?: string
  backText?: string
  homeText?: string
  customIcon?: Component
  error?: Error
}

const props = withDefaults(defineProps<Props>(), {
  type: 'unknown',
  size: 'medium',
  showRetry: true,
  showBack: false,
  showHome: false,
  showDetails: false,
  retryText: '重试',
  backText: '返回',
  homeText: '回到首页'
})

const emit = defineEmits<{
  retry: []
  back: []
  home: []
}>()

const router = useRouter()
const retrying = ref(false)

// 根据错误类型确定结果状态
const resultStatus = computed(() => {
  switch (props.type) {
    case 'network':
    case 'server':
      return 'error'
    case 'auth':
    case 'permission':
      return '403'
    case 'notfound':
      return '404'
    case 'validation':
      return 'warning'
    default:
      return 'error'
  }
})

// 默认标题
const defaultTitle = computed(() => {
  switch (props.type) {
    case 'network':
      return '网络连接失败'
    case 'auth':
      return '认证失败'
    case 'permission':
      return '权限不足'
    case 'notfound':
      return '页面未找到'
    case 'server':
      return '服务器错误'
    case 'validation':
      return '数据验证失败'
    default:
      return '操作失败'
  }
})

// 图标大小
const iconSize = computed(() => {
  switch (props.size) {
    case 'small':
      return 48
    case 'large':
      return 96
    default:
      return 72
  }
})

// 错误详情
const errorDetails = computed(() => {
  if (!props.error) return null

  return JSON.stringify(
    {
      message: props.error.message,
      name: props.error.name,
      stack: props.error.stack
    },
    null,
    2
  )
})

// 处理重试
const handleRetry = async () => {
  retrying.value = true
  try {
    emit('retry')
  } finally {
    setTimeout(() => {
      retrying.value = false
    }, 500)
  }
}

// 处理返回
const handleBack = () => {
  emit('back')
  router.back()
}

// 处理回到首页
const handleHome = () => {
  emit('home')
  router.push('/')
}
</script>

<style scoped>
.error-display {
  padding: 40px 20px;
  text-align: center;
}

.error-small {
  padding: 20px 10px;
}

.error-large {
  padding: 60px 40px;
}

.error-details {
  margin-top: 24px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  text-align: left;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .error-display {
    padding: 20px 10px;
  }

  .error-large {
    padding: 30px 20px;
  }
}
</style>
