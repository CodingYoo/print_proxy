<template>
  <n-tag
    :type="tagType"
    :size="size"
    :round="round"
    :bordered="bordered"
    :class="customClass"
  >
    <template v-if="showIcon" #icon>
      <n-icon>
        <component :is="statusIcon" />
      </n-icon>
    </template>
    {{ displayText }}
  </n-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NIcon } from 'naive-ui'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PauseCircleOutlined
} from '@vicons/antd'

export type StatusType = 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info' 
  | 'processing' 
  | 'pending'
  | 'paused'
  | 'cancelled'
  // 打印机状态
  | 'online'
  | 'offline'
  | 'busy'
  // 任务状态
  | 'printing'
  | 'completed'
  | 'failed'

export type StatusSize = 'small' | 'medium' | 'large'

interface Props {
  status: StatusType
  text?: string
  size?: StatusSize
  round?: boolean
  bordered?: boolean
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  round: true,
  bordered: false,
  showIcon: true
})

// 状态到标签类型的映射
const tagType = computed(() => {
  const typeMap: Record<StatusType, string> = {
    success: 'success',
    warning: 'warning', 
    error: 'error',
    info: 'info',
    processing: 'info',
    pending: 'default',
    paused: 'warning',
    cancelled: 'error',
    // 打印机状态
    online: 'success',
    offline: 'error',
    busy: 'warning',
    // 任务状态
    printing: 'info',
    completed: 'success',
    failed: 'error'
  }
  return typeMap[props.status] as any
})

// 状态图标映射
const statusIcon = computed(() => {
  const iconMap: Record<StatusType, any> = {
    success: CheckCircleOutlined,
    warning: ExclamationCircleOutlined,
    error: CloseCircleOutlined,
    info: ExclamationCircleOutlined,
    processing: SyncOutlined,
    pending: ClockCircleOutlined,
    paused: PauseCircleOutlined,
    cancelled: CloseCircleOutlined,
    // 打印机状态
    online: CheckCircleOutlined,
    offline: CloseCircleOutlined,
    busy: SyncOutlined,
    // 任务状态
    printing: SyncOutlined,
    completed: CheckCircleOutlined,
    failed: CloseCircleOutlined
  }
  return iconMap[props.status]
})

// 显示文本
const displayText = computed(() => {
  if (props.text) {
    return props.text
  }
  
  const textMap: Record<StatusType, string> = {
    success: '成功',
    warning: '警告',
    error: '错误',
    info: '信息',
    processing: '处理中',
    pending: '等待中',
    paused: '已暂停',
    cancelled: '已取消',
    // 打印机状态
    online: '在线',
    offline: '离线',
    busy: '忙碌',
    // 任务状态
    printing: '打印中',
    completed: '已完成',
    failed: '失败'
  }
  return textMap[props.status]
})

// 自定义样式类
const customClass = computed(() => {
  const classes = []
  
  // 处理中状态添加动画
  if (['processing', 'printing', 'busy'].includes(props.status)) {
    classes.push('animate-pulse')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
:deep(.n-tag .n-icon) {
  @apply mr-1;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}
</style>