# 性能优化和用户体验功能使用指南

本文档介绍任务 7 实现的性能优化和用户体验增强功能的使用方法。

## 1. 代码分割和懒加载

### 1.1 路由懒加载

所有路由已自动配置为懒加载，无需额外配置。路由组件会在访问时才加载。

```typescript
// 路由配置已自动使用懒加载
// 在 src/router/lazy-routes.ts 中集中管理
```

### 1.2 预加载关键路由

应用启动后会自动预加载常用页面：

```typescript
import { preloadCriticalRoutes, preloadRoutesByPermissions } from '@/router/lazy-routes'

// 预加载关键路由（自动执行）
preloadCriticalRoutes()

// 根据用户权限预加载
preloadRoutesByPermissions(['printer:view', 'job:view'])
```

### 1.3 组件懒加载工具

```typescript
import { lazyLoadComponent, preloadComponent } from '@/utils/lazy-load'

// 延迟加载组件
const MyComponent = lazyLoadComponent(
  () => import('@/components/MyComponent.vue'),
  200 // 延迟时间
)

// 预加载组件
preloadComponent(() => import('@/components/HeavyComponent.vue'))
```

### 1.4 Vite 构建优化

已配置细粒度的代码分割：
- Vue 核心库单独打包
- Naive UI 组件库单独打包
- 第三方库按类型分割
- 启用 CSS 代码分割

## 2. 加载状态和动画

### 2.1 页面切换动画

页面切换动画已自动应用到所有路由：

```vue
<template>
  <!-- 在 App.vue 中已配置 -->
  <PageTransition :name="route.meta.transition || 'fade'" mode="out-in">
    <component :is="Component" :key="route.path" />
  </PageTransition>
</template>
```

可用的过渡效果：
- `fade` - 淡入淡出
- `slide-left` - 左滑
- `slide-right` - 右滑
- `slide-up` - 上滑
- `slide-down` - 下滑
- `zoom` - 缩放

### 2.2 加载状态指示器

```vue
<template>
  <!-- 使用加载指示器 -->
  <LoadingIndicator
    :show="loading"
    type="spinner"
    size="medium"
    description="加载中..."
  />
  
  <!-- 进度条类型 -->
  <LoadingIndicator
    type="bar"
    :percentage="progress"
    :show-percentage="true"
  />
  
  <!-- 点状加载 -->
  <LoadingIndicator type="dots" />
  
  <!-- 脉冲加载 -->
  <LoadingIndicator type="pulse" />
</template>

<script setup lang="ts">
import LoadingIndicator from '@/components/loading/LoadingIndicator.vue'
</script>
```

### 2.3 骨架屏

```vue
<template>
  <!-- 卡片骨架屏 -->
  <SkeletonLoader v-if="loading" type="card" />
  
  <!-- 列表骨架屏 -->
  <SkeletonLoader type="list" :count="5" />
  
  <!-- 表格骨架屏 -->
  <SkeletonLoader type="table" :rows="10" :columns="4" />
  
  <!-- 表单骨架屏 -->
  <SkeletonLoader type="form" :count="3" />
  
  <!-- 自定义骨架屏 -->
  <SkeletonLoader type="custom">
    <div class="custom-skeleton">
      <!-- 自定义内容 -->
    </div>
  </SkeletonLoader>
</template>

<script setup lang="ts">
import SkeletonLoader from '@/components/loading/SkeletonLoader.vue'
</script>
```

### 2.4 加载状态管理

```typescript
import { useLoading } from '@/composables/useLoading'

const { 
  isGlobalLoading,
  startGlobalLoading,
  finishGlobalLoading,
  withLoading,
  createLoadingState
} = useLoading()

// 全局加载
startGlobalLoading()
// ... 执行操作
finishGlobalLoading()

// 包装异步函数
await withLoading(
  async () => {
    // 异步操作
  },
  {
    global: true,
    successMessage: '操作成功',
    errorMessage: '操作失败'
  }
)

// 局部加载状态
const { loading, startLoading, stopLoading } = createLoadingState()
```

### 2.5 平滑状态转换

```typescript
import { 
  useNumberTransition,
  useFadeTransition,
  useSlideTransition,
  useDelayedShow
} from '@/composables/useTransition'

// 数值平滑过渡
const { currentValue, transitionTo } = useNumberTransition(0)
transitionTo(100) // 平滑过渡到 100

// 淡入淡出
const { isVisible, fadeIn, fadeOut } = useFadeTransition()
fadeIn(300) // 300ms 淡入

// 滑动效果
const { slideIn, slideOut } = useSlideTransition(false, 'down')
slideIn(300)

// 延迟显示（防止闪烁）
const { shouldShow, show, hide } = useDelayedShow(200)
show() // 200ms 后显示
```

## 3. 错误处理和用户反馈

### 3.1 全局错误处理

全局错误处理已自动配置，会捕获所有未处理的错误和 Promise 拒绝。

```typescript
import { globalErrorHandler } from '@/utils/error-handler'

// 手动处理错误
globalErrorHandler.handle(error, {
  showMessage: true,
  logToConsole: true,
  reportToServer: true,
  customMessage: '自定义错误消息'
})
```

### 3.2 组件级错误处理

```typescript
import { useErrorHandler } from '@/composables/useErrorHandler'

const { 
  handleError,
  withErrorHandling,
  showSuccess,
  showError
} = useErrorHandler()

// 处理错误
try {
  // 操作
} catch (error) {
  handleError(error, {
    showMessage: true,
    customMessage: '操作失败'
  })
}

// 包装异步函数
const result = await withErrorHandling(
  async () => {
    // 异步操作
  },
  {
    showMessage: true,
    customMessage: '操作失败'
  }
)

// 显示反馈消息
showSuccess('操作成功')
showError('操作失败')
```

### 3.3 错误显示组件

```vue
<template>
  <!-- 网络错误 -->
  <ErrorDisplay
    type="network"
    title="网络连接失败"
    description="请检查您的网络设置"
    :show-retry="true"
    @retry="handleRetry"
  />
  
  <!-- 权限错误 -->
  <ErrorDisplay
    type="permission"
    :show-back="true"
    :show-home="true"
  />
  
  <!-- 404 错误 -->
  <ErrorDisplay
    type="notfound"
    :show-home="true"
  />
  
  <!-- 服务器错误 -->
  <ErrorDisplay
    type="server"
    :show-retry="true"
    :show-details="true"
    :error="error"
  />
</template>

<script setup lang="ts">
import ErrorDisplay from '@/components/error/ErrorDisplay.vue'
</script>
```

### 3.4 用户反馈

```typescript
import { useFeedback } from '@/composables/useFeedback'

const {
  success,
  error,
  warning,
  info,
  notifySuccess,
  confirm,
  confirmDelete,
  progressFeedback,
  copySuccess,
  saveSuccess
} = useFeedback()

// 消息提示
success('操作成功')
error('操作失败')
warning('警告信息')
info('提示信息')

// 通知
notifySuccess('操作成功', '详细描述')
notifyError('操作失败', '错误详情')

// 确认对话框
const confirmed = await confirm({
  title: '确认操作',
  content: '确定要执行此操作吗？',
  type: 'warning'
})

// 删除确认
const shouldDelete = await confirmDelete('项目名称')

// 进度反馈
const feedback = progressFeedback(
  '正在处理...',
  '处理成功',
  '处理失败'
)
// ... 执行操作
feedback.success() // 或 feedback.error()

// 快捷反馈
copySuccess() // 复制成功
saveSuccess() // 保存成功
```

### 3.5 网络请求重试

```typescript
import { retry, createRetryable, globalRetryManager } from '@/utils/retry'

// 手动重试
const result = await retry(
  async () => {
    // 异步操作
  },
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    onRetry: (error, attempt) => {
      console.log(`重试第 ${attempt} 次`)
    }
  }
)

// 创建可重试的函数
const fetchData = createRetryable(
  async (id: string) => {
    // 获取数据
  },
  { maxAttempts: 3 }
)

// 使用重试管理器
await globalRetryManager.execute(
  'fetch-users',
  async () => {
    // 异步操作
  },
  { maxAttempts: 3 }
)

// 取消重试
globalRetryManager.cancel('fetch-users')
```

### 3.6 API 请求重试

```typescript
import { requestWithRetry } from '@/api/client'

// 带重试的请求
const response = await requestWithRetry({
  url: '/api/data',
  method: 'GET',
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
})

// 简单重试（使用默认配置）
const response = await requestWithRetry({
  url: '/api/data',
  method: 'GET',
  retry: true
})
```

## 最佳实践

### 1. 性能优化
- 使用路由懒加载减少初始加载时间
- 预加载关键路由提升用户体验
- 使用骨架屏避免白屏
- 合理使用代码分割

### 2. 加载状态
- 长时间操作显示加载指示器
- 使用延迟显示避免闪烁
- 提供进度反馈让用户了解进度
- 使用平滑过渡提升视觉体验

### 3. 错误处理
- 统一使用错误处理机制
- 提供友好的错误提示
- 关键操作添加确认对话框
- 网络请求启用自动重试
- 记录错误日志便于调试

### 4. 用户反馈
- 操作成功给予明确反馈
- 错误信息清晰易懂
- 提供重试和返回选项
- 使用通知而非弹窗（非关键信息）

## 示例：完整的数据加载流程

```vue
<template>
  <div>
    <!-- 加载状态 -->
    <SkeletonLoader v-if="loading" type="list" :count="5" />
    
    <!-- 错误状态 -->
    <ErrorDisplay
      v-else-if="error"
      type="network"
      :show-retry="true"
      @retry="loadData"
    />
    
    <!-- 数据展示 -->
    <div v-else>
      <!-- 内容 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLoading } from '@/composables/useLoading'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useFeedback } from '@/composables/useFeedback'
import SkeletonLoader from '@/components/loading/SkeletonLoader.vue'
import ErrorDisplay from '@/components/error/ErrorDisplay.vue'

const { withLoading } = useLoading()
const { handleError } = useErrorHandler()
const { success } = useFeedback()

const loading = ref(false)
const error = ref(false)
const data = ref([])

const loadData = async () => {
  loading.value = true
  error.value = false
  
  try {
    const result = await withLoading(
      async () => {
        // API 请求
        return await fetchData()
      },
      {
        global: true,
        errorMessage: '加载数据失败'
      }
    )
    
    if (result) {
      data.value = result
      success('数据加载成功')
    }
  } catch (err) {
    error.value = true
    handleError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
```

## 总结

任务 7 实现的功能大幅提升了应用的性能和用户体验：

1. **代码分割和懒加载**：减少初始加载时间，提升首屏渲染速度
2. **加载状态和动画**：提供流畅的视觉反馈，提升用户体验
3. **错误处理和用户反馈**：统一的错误处理机制，友好的用户提示

这些功能已集成到应用中，开发者可以直接使用，无需额外配置。
