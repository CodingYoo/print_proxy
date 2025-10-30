<template>
  <div class="dashboard-view">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        总览
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">
        打印代理服务系统概览
      </p>
    </div>

    <!-- 统计卡片区域 -->
    <div class="grid-responsive mb-8">
      <!-- 打印机状态统计 -->
      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              在线打印机
            </p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ onlinePrintersCount }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              总计 {{ totalPrintersCount }} 台
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="24" color="#10b981">
              <PrinterIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <!-- 活跃任务统计 -->
      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              活跃任务
            </p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ activeJobsCount }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              等待中 {{ pendingJobsCount }} 个
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="24" color="#3b82f6">
              <TaskIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <!-- 今日完成任务 -->
      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              今日完成
            </p>
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {{ todayCompletedCount }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              成功率 {{ successRate }}%
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="24" color="#8b5cf6">
              <CheckCircleIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <!-- 系统状态 -->
      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              系统状态
            </p>
            <p class="text-2xl font-bold" :class="systemHealthColor">
              {{ systemHealthText }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              最近错误 {{ recentErrorsCount }} 个
            </p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center" :class="systemHealthBg">
            <n-icon size="24" :color="systemHealthIconColor">
              <component :is="systemHealthIcon" />
            </n-icon>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 内容区域 -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- 最新任务列表 -->
      <div class="xl:col-span-2">
        <n-card title="最新任务" class="h-full">
          <template #header-extra>
            <n-button
              text
              type="primary"
              @click="$router.push({ name: 'jobs' })"
            >
              查看全部
            </n-button>
          </template>

          <div v-if="jobsLoading" class="flex justify-center py-8">
            <n-spin size="medium" />
          </div>

          <div v-else-if="recentJobs.length === 0" class="text-center py-8 text-gray-500">
            暂无任务
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="job in recentJobs"
              :key="job.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              @click="viewJobDetail(job.id)"
            >
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <StatusBadge :status="job.status" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ job.filename }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ job.printerName }} • {{ formatTime(job.submittedAt) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ job.pages }} 页
                </p>
                <p class="text-xs text-gray-500">
                  {{ job.copies }} 份
                </p>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- 打印机状态 -->
      <div>
        <n-card title="打印机状态" class="h-full">
          <template #header-extra>
            <n-button
              text
              type="primary"
              @click="$router.push({ name: 'printers' })"
            >
              管理
            </n-button>
          </template>

          <div v-if="printersLoading" class="flex justify-center py-8">
            <n-spin size="medium" />
          </div>

          <div v-else-if="printers.length === 0" class="text-center py-8 text-gray-500">
            暂无打印机
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="printer in printers.slice(0, 6)"
              :key="printer.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <StatusBadge :status="printer.status" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {{ printer.name }}
                    <n-tag v-if="printer.isDefault" size="tiny" type="success" class="ml-2">
                      默认
                    </n-tag>
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ printer.location || '未设置位置' }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <n-button
                  size="tiny"
                  quaternary
                  circle
                  @click="refreshPrinter(printer.id)"
                  :loading="refreshingPrinters.has(printer.id)"
                >
                  <template #icon>
                    <n-icon size="14">
                      <RefreshIcon />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <!-- 快速操作区域 -->
    <div class="mt-8">
      <n-card title="快速操作">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <n-button
            size="large"
            class="h-16"
            @click="$router.push({ name: 'jobs', query: { action: 'create' } })"
          >
            <template #icon>
              <n-icon size="20">
                <PlusIcon />
              </n-icon>
            </template>
            新建任务
          </n-button>

          <n-button
            size="large"
            class="h-16"
            @click="refreshAllData"
            :loading="refreshingAll"
          >
            <template #icon>
              <n-icon size="20">
                <RefreshIcon />
              </n-icon>
            </template>
            刷新数据
          </n-button>

          <n-button
            size="large"
            class="h-16"
            @click="$router.push({ name: 'printers', query: { action: 'sync' } })"
          >
            <template #icon>
              <n-icon size="20">
                <SyncIcon />
              </n-icon>
            </template>
            同步打印机
          </n-button>

          <n-button
            size="large"
            class="h-16"
            @click="$router.push({ name: 'logs' })"
          >
            <template #icon>
              <n-icon size="20">
                <LogIcon />
              </n-icon>
            </template>
            查看日志
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { usePrintersStore } from '@/stores/printers'
import { useJobsStore } from '@/stores/jobs'
import { useLogsStore } from '@/stores/logs'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  PrinterOutlined as PrinterIcon,
  FileTextOutlined as TaskIcon,
  CheckCircleOutlined as CheckCircleIcon,
  HeartOutlined as HealthyIcon,
  WarningOutlined as WarningIcon,
  CloseCircleOutlined as CriticalIcon,
  ReloadOutlined as RefreshIcon,
  PlusOutlined as PlusIcon,
  SyncOutlined as SyncIcon,
  UnorderedListOutlined as LogIcon
} from '@vicons/antd'

const router = useRouter()
const message = useMessage()

// Store 实例
const printersStore = usePrintersStore()
const jobsStore = useJobsStore()
const logsStore = useLogsStore()

// 响应式状态
const refreshingAll = ref(false)
const refreshingPrinters = ref(new Set<string>())
const autoRefreshInterval = ref<number | null>(null)

// 计算属性 - 打印机统计
const printers = computed(() => printersStore.printers)
const printersLoading = computed(() => printersStore.loading)
const onlinePrintersCount = computed(() => printersStore.onlinePrinters.length)
const totalPrintersCount = computed(() => printers.value.length)

// 计算属性 - 任务统计
const recentJobs = computed(() => jobsStore.jobs.slice(0, 8))
const jobsLoading = computed(() => jobsStore.loading)
const activeJobsCount = computed(() => jobsStore.activeJobs.length)
const pendingJobsCount = computed(() => 
  jobsStore.jobs.filter(job => job.status === 'pending').length
)

// 计算属性 - 今日完成任务
const todayCompletedCount = computed(() => {
  const today = new Date().toDateString()
  return jobsStore.jobs.filter(job => 
    job.status === 'completed' && 
    new Date(job.completedAt || '').toDateString() === today
  ).length
})

const successRate = computed(() => {
  const today = new Date().toDateString()
  const todayJobs = jobsStore.jobs.filter(job => 
    new Date(job.submittedAt).toDateString() === today
  )
  if (todayJobs.length === 0) return 100
  
  const completedJobs = todayJobs.filter(job => job.status === 'completed')
  return Math.round((completedJobs.length / todayJobs.length) * 100)
})

// 计算属性 - 系统健康状态
const systemHealth = computed(() => logsStore.getSystemHealth)
const recentErrorsCount = computed(() => logsStore.errorLogs.length)

const systemHealthText = computed(() => {
  switch (systemHealth.value) {
    case 'healthy': return '健康'
    case 'warning': return '警告'
    case 'critical': return '严重'
    default: return '未知'
  }
})

const systemHealthColor = computed(() => {
  switch (systemHealth.value) {
    case 'healthy': return 'text-green-600 dark:text-green-400'
    case 'warning': return 'text-yellow-600 dark:text-yellow-400'
    case 'critical': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
})

const systemHealthBg = computed(() => {
  switch (systemHealth.value) {
    case 'healthy': return 'bg-green-100 dark:bg-green-900/20'
    case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20'
    case 'critical': return 'bg-red-100 dark:bg-red-900/20'
    default: return 'bg-gray-100 dark:bg-gray-900/20'
  }
})

const systemHealthIconColor = computed(() => {
  switch (systemHealth.value) {
    case 'healthy': return '#10b981'
    case 'warning': return '#f59e0b'
    case 'critical': return '#ef4444'
    default: return '#6b7280'
  }
})

const systemHealthIcon = computed(() => {
  switch (systemHealth.value) {
    case 'healthy': return HealthyIcon
    case 'warning': return WarningIcon
    case 'critical': return CriticalIcon
    default: return HealthyIcon
  }
})

// 方法
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString()
}

const viewJobDetail = (jobId: string) => {
  router.push({ name: 'jobs', query: { jobId } })
}

const refreshPrinter = async (printerId: string) => {
  refreshingPrinters.value.add(printerId)
  try {
    await printersStore.refreshPrinterStatus(printerId)
    message.success('打印机状态已刷新')
  } catch (error) {
    message.error('刷新打印机状态失败')
  } finally {
    refreshingPrinters.value.delete(printerId)
  }
}

const refreshAllData = async () => {
  refreshingAll.value = true
  try {
    await Promise.all([
      printersStore.fetchPrinters(),
      jobsStore.fetchJobs({ page: 1, pageSize: 20 }),
      jobsStore.fetchJobStats(),
      logsStore.fetchLogStats()
    ])
    message.success('数据已刷新')
  } catch (error) {
    message.error('刷新数据失败')
  } finally {
    refreshingAll.value = false
  }
}

const loadInitialData = async () => {
  try {
    await Promise.all([
      printersStore.fetchPrinters(),
      jobsStore.fetchJobs({ page: 1, pageSize: 20 }),
      jobsStore.fetchJobStats(),
      logsStore.fetchLogStats()
    ])
  } catch (error) {
    console.error('Failed to load initial data:', error)
  }
}

// 设置自动刷新
const setupAutoRefresh = () => {
  autoRefreshInterval.value = window.setInterval(async () => {
    try {
      await Promise.all([
        printersStore.fetchPrinters(),
        jobsStore.fetchJobStats(),
        logsStore.fetchLogStats()
      ])
    } catch (error) {
      console.error('Auto refresh failed:', error)
    }
  }, 30000) // 每30秒刷新一次
}

const clearAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
  }
}

// 生命周期
onMounted(() => {
  loadInitialData()
  setupAutoRefresh()
})

onUnmounted(() => {
  clearAutoRefresh()
})
</script>

<style scoped>
.dashboard-view {
  @apply max-w-7xl mx-auto;
}

.grid-responsive {
  @apply grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6;
}

.stat-card {
  @apply transition-all duration-200 hover:shadow-md;
}

.stat-card :deep(.n-card-header) {
  @apply pb-4;
}

.stat-card :deep(.n-card__content) {
  @apply pt-0;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .grid-responsive {
    @apply grid-cols-1 gap-4;
  }
  
  .dashboard-view {
    @apply px-4;
  }
}
</style>