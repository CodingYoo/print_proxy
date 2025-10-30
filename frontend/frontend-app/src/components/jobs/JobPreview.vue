<template>
  <div class="job-preview">
    <div v-if="loading" class="flex justify-center py-8">
      <n-spin size="large" />
    </div>

    <div v-else-if="error" class="text-center py-8">
      <n-result status="error" title="加载失败" :description="error">
        <template #footer>
          <n-button @click="loadJobDetail">重试</n-button>
        </template>
      </n-result>
    </div>

    <div v-else-if="job" class="space-y-6">
      <!-- 任务基本信息 -->
      <n-card title="任务信息">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <n-icon size="24" color="#3b82f6">
                  <FileIcon />
                </n-icon>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                  {{ job.filename }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  任务 ID: {{ job.id }}
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">状态:</span>
                <StatusBadge :status="job.status" />
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">打印机:</span>
                <span class="text-gray-900 dark:text-gray-100">{{ job.printerName }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">用户:</span>
                <span class="text-gray-900 dark:text-gray-100">{{ job.username || '未知' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">优先级:</span>
                <n-tag :type="getPriorityType(job.priority)" size="small">
                  {{ getPriorityText(job.priority) }}
                </n-tag>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">打印设置</h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">页数:</span>
                <span class="text-gray-900 dark:text-gray-100">{{ job.pages }} 页</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">份数:</span>
                <span class="text-gray-900 dark:text-gray-100">{{ job.copies }} 份</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">纸张大小:</span>
                <span class="text-gray-900 dark:text-gray-100">{{ job.settings.paperSize || 'A4' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">方向:</span>
                <span class="text-gray-900 dark:text-gray-100">
                  {{ job.settings.orientation === 'landscape' ? '横向' : '纵向' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">彩色:</span>
                <span class="text-gray-900 dark:text-gray-100">
                  {{ job.settings.color ? '是' : '否' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">双面:</span>
                <span class="text-gray-900 dark:text-gray-100">
                  {{ job.settings.duplex ? '是' : '否' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">质量:</span>
                <span class="text-gray-900 dark:text-gray-100">
                  {{ getQualityText(job.settings.quality) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 任务进度 -->
      <n-card v-if="job.status === 'printing'" title="打印进度">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-600 dark:text-gray-400">进度:</span>
            <span class="text-gray-900 dark:text-gray-100">{{ job.progress || 0 }}%</span>
          </div>
          <n-progress
            type="line"
            :percentage="job.progress || 0"
            :show-indicator="false"
            status="info"
          />
          <div v-if="job.startedAt" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">开始时间:</span>
            <span class="text-gray-900 dark:text-gray-100">{{ formatTime(job.startedAt) }}</span>
          </div>
          <div v-if="job.estimatedDuration" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">预计用时:</span>
            <span class="text-gray-900 dark:text-gray-100">{{ formatDuration(job.estimatedDuration) }}</span>
          </div>
        </div>
      </n-card>

      <!-- 时间信息 -->
      <n-card title="时间信息">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">提交时间</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatTime(job.submittedAt) }}
            </p>
          </div>
          <div v-if="job.startedAt" class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">开始时间</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatTime(job.startedAt) }}
            </p>
          </div>
          <div v-if="job.completedAt" class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">完成时间</p>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ formatTime(job.completedAt) }}
            </p>
          </div>
        </div>
        <div v-if="job.actualDuration" class="mt-4 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-400">实际用时</p>
          <p class="font-medium text-green-600 dark:text-green-400">
            {{ formatDuration(job.actualDuration) }}
          </p>
        </div>
      </n-card>

      <!-- 错误信息 -->
      <n-card v-if="job.status === 'failed' && job.errorMessage" title="错误信息">
        <n-alert type="error" :show-icon="true">
          {{ job.errorMessage }}
        </n-alert>
      </n-card>

      <!-- 操作按钮 -->
      <div class="flex justify-end space-x-3">
        <n-button @click="$emit('close')">
          关闭
        </n-button>
        <n-button
          v-if="['pending', 'printing'].includes(job.status)"
          type="error"
          @click="cancelJob"
          :loading="cancelling"
        >
          取消任务
        </n-button>
        <n-button
          v-if="job.status === 'failed'"
          type="primary"
          @click="resubmitJob"
          :loading="resubmitting"
        >
          重新提交
        </n-button>
        <n-button
          v-if="['completed', 'failed', 'cancelled'].includes(job.status)"
          type="error"
          @click="deleteJob"
          :loading="deleting"
        >
          删除任务
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useJobsStore } from '@/stores/jobs'
import type { PrintJob } from '@/stores/jobs'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { FileTextOutlined as FileIcon } from '@vicons/antd'

interface Props {
  jobId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const message = useMessage()
const jobsStore = useJobsStore()

// 响应式状态
const job = ref<PrintJob | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const cancelling = ref(false)
const resubmitting = ref(false)
const deleting = ref(false)

// 计算属性
const getPriorityType = (priority: string) => {
  switch (priority) {
    case 'high': return 'error'
    case 'low': return 'info'
    default: return 'default'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'high': return '高优先级'
    case 'low': return '低优先级'
    default: return '普通优先级'
  }
}

const getQualityText = (quality?: string) => {
  switch (quality) {
    case 'draft': return '草稿'
    case 'high': return '高质量'
    default: return '普通'
  }
}

// 方法
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${Math.round(seconds / 3600)}小时`
}

const loadJobDetail = async () => {
  loading.value = true
  error.value = null
  
  try {
    job.value = await jobsStore.fetchJob(props.jobId)
  } catch (err: any) {
    error.value = err.message || '加载任务详情失败'
  } finally {
    loading.value = false
  }
}

const cancelJob = async () => {
  if (!job.value) return
  
  cancelling.value = true
  try {
    await jobsStore.cancelJob(job.value.id)
    job.value.status = 'cancelled'
    message.success('任务已取消')
  } catch (error) {
    message.error('取消任务失败')
  } finally {
    cancelling.value = false
  }
}

const resubmitJob = async () => {
  if (!job.value) return
  
  resubmitting.value = true
  try {
    const updatedJob = await jobsStore.resubmitJob(job.value.id)
    job.value = updatedJob
    message.success('任务已重新提交')
  } catch (error) {
    message.error('重新提交任务失败')
  } finally {
    resubmitting.value = false
  }
}

const deleteJob = async () => {
  if (!job.value) return
  
  deleting.value = true
  try {
    await jobsStore.deleteJob(job.value.id)
    message.success('任务已删除')
    emit('close')
  } catch (error) {
    message.error('删除任务失败')
  } finally {
    deleting.value = false
  }
}

// 生命周期
onMounted(() => {
  loadJobDetail()
})
</script>

<style scoped>
.job-preview {
  @apply max-w-4xl mx-auto;
}
</style>