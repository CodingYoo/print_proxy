<template>
  <div class="dashboard-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">Print Proxy Service 控制台</h1>
      <p class="page-subtitle">统一管理打印机、打印任务与操作日志</p>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <!-- 打印机数量统计 -->
      <n-card class="stat-card stat-card-printers" :bordered="false">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">打印机数量</p>
            <p class="stat-value">{{ totalPrintersCount }}</p>
            <p class="stat-desc">最近打印机：{{ latestPrinterModel }}</p>
          </div>
        </div>
      </n-card>

      <!-- 任务总数统计 -->
      <n-card class="stat-card stat-card-jobs" :bordered="false">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">任务总数</p>
            <p class="stat-value">{{ totalJobsCount }}</p>
            <p class="stat-desc">处理/排队中：{{ pendingJobsCount }}</p>
          </div>
        </div>
      </n-card>

      <!-- 已完成统计 -->
      <n-card class="stat-card stat-card-completed" :bordered="false">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">已完成</p>
            <p class="stat-value">{{ completedJobsCount }}</p>
            <p class="stat-desc">最近完成任务占比：{{ successRate }}%</p>
          </div>
        </div>
      </n-card>

      <!-- 失败/异常统计 -->
      <n-card class="stat-card stat-card-errors" :bordered="false">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">失败/异常</p>
            <p class="stat-value" :class="recentErrorsCount > 0 ? 'text-red-600' : 'text-green-600'">{{ recentErrorsCount }}</p>
            <p class="stat-desc" :class="recentErrorsCount > 0 ? 'text-red-500' : 'text-gray-500'">
              {{ recentErrorsCount > 0 ? '请留意错误日志' : '请留意错误日志并避免问题' }}
            </p>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 最新任务列表 -->
      <div class="content-main">
        <n-card title="最新打印任务" :bordered="false" class="content-card">
          <template #header-extra>
            <div class="card-actions">
              <n-button text class="view-all-link" @click="$router.push({ name: 'jobs' })">
                任务列表
              </n-button>
              <n-button text class="view-all-link" @click="$router.push({ name: 'api-docs' })">
                API
              </n-button>
            </div>
          </template>

          <div v-if="jobsLoading" class="flex justify-center py-8">
            <n-spin size="medium" />
          </div>

          <div v-else-if="recentJobs.length === 0" class="empty-state">
            <p>暂无打印任务</p>
          </div>

          <div v-else class="jobs-list">
            <div
              v-for="job in recentJobs"
              :key="job.id"
              class="job-item"
              @click="viewJobDetail(job.id)"
            >
              <div class="job-info">
                <StatusBadge :status="job.status" />
                <div class="job-details">
                  <p class="job-filename">{{ job.title }}</p>
                  <p class="job-meta">
                    类型：{{ job.file_type.toUpperCase() }} • 份数：{{ job.copies }}
                  </p>
                </div>
              </div>
              <div class="job-status">
                <span class="status-badge" :class="'status-' + job.status">
                  {{ getStatusText(job.status) }}
                </span>
              </div>
            </div>
          </div>
        </n-card>
      </div>

      <!-- 打印机状态 -->
      <div class="content-sidebar">
        <n-card title="打印机状态快照" :bordered="false" class="content-card">
          <template #header-extra>
            <n-button text class="view-all-link" @click="$router.push({ name: 'printers' })">
              管理打印机
            </n-button>
          </template>

          <div v-if="printersLoading" class="flex justify-center py-8">
            <n-spin size="medium" />
          </div>

          <div v-else-if="printers.length === 0" class="empty-state">
            <p>暂无打印机</p>
          </div>

          <div v-else class="printers-list">
            <div
              v-for="printer in printers.slice(0, 6)"
              :key="printer.id"
              class="printer-item"
            >
              <div class="printer-info">
                <div class="printer-icon">
                  <n-icon size="18" color="#4285f4">
                    <PrinterIcon />
                  </n-icon>
                </div>
                <div class="printer-details">
                  <p class="printer-name">{{ printer.name }}</p>
                  <p class="printer-status">状态：{{ getStatusText(printer.status) }}</p>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { usePrintersStore } from '@/stores/printers'
import { useJobsStore } from '@/stores/jobs'
import StatusBadge from '@/components/common/StatusBadge.vue'
import {
  PrinterOutlined as PrinterIcon
} from '@vicons/antd'

const router = useRouter()
const message = useMessage()

// Store 实例
const printersStore = usePrintersStore()
const jobsStore = useJobsStore()

// 响应式状态
const refreshingAll = ref(false)
const refreshingPrinters = ref(new Set<string>())
const autoRefreshInterval = ref<number | null>(null)

// 计算属性 - 打印机统计
const printers = computed(() => printersStore.printers)
const printersLoading = computed(() => printersStore.loading)
const onlinePrintersCount = computed(() => printersStore.onlinePrinters.length)
const totalPrintersCount = computed(() => printers.value.length)

// 最新打印机型号
const latestPrinterModel = computed(() => {
  if (printers.value.length === 0) return '无'
  const latestPrinter = printers.value[0]
  return latestPrinter?.name || 'HPRT HM-T260LR'
})

// 计算属性 - 任务统计
const recentJobs = computed(() => jobsStore.jobs.slice(0, 6))
const jobsLoading = computed(() => jobsStore.loading)
const activeJobsCount = computed(() => jobsStore.activeJobs.length)
const totalJobsCount = computed(() => jobsStore.jobs.length)
const pendingJobsCount = computed(() => 
  jobsStore.jobs.filter(job => job.status === 'pending' || job.status === 'printing').length
)

// 计算属性 - 完成任务
const completedJobsCount = computed(() => {
  return jobsStore.jobs.filter(job => job.status === 'completed').length
})

const successRate = computed(() => {
  const total = jobsStore.jobs.length
  if (total === 0) return 100
  
  const completed = completedJobsCount.value
  return Math.round((completed / total) * 100)
})

// 计算属性 - 系统健康状态
const recentErrorsCount = computed(() => {
  return jobsStore.jobs.filter(job => job.status === 'failed' || job.status === 'cancelled').length
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

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败',
    'error': '错误',
    'online': 'online',
    'offline': 'offline',
    'idle': '空闲',
    'printing': '打印中'
  }
  return statusMap[status] || status
}

const viewJobDetail = (jobId: number) => {
  router.push({ name: 'jobs', query: { jobId: jobId.toString() } })
}

const refreshAllData = async () => {
  refreshingAll.value = true
  try {
    await Promise.all([
      printersStore.fetchPrinters(),
      jobsStore.fetchJobs({ page: 1, pageSize: 20 })
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
      jobsStore.fetchJobs({ page: 1, pageSize: 20 })
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
        jobsStore.fetchJobs({ page: 1, pageSize: 20 })
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
  max-width: 1400px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: 0.3px;
}

.page-subtitle {
  font-size: 14px;
  color: #999999;
  margin: 0;
}

/* 统计卡片区域 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-content {
  padding: 8px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: #666666;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  line-height: 1;
}

.stat-desc {
  font-size: 13px;
  color: #999999;
  margin: 0;
}

/* 内容区域 */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.content-card :deep(.n-card-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

.content-card :deep(.n-card__content) {
  padding: 24px;
}

.card-actions {
  display: flex;
  gap: 16px;
}

.view-all-link {
  color: #4285f4;
  font-size: 14px;
}

.view-all-link:hover {
  color: #1967d2;
}

/* 任务列表 */
.jobs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.job-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.job-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.job-details {
  flex: 1;
  min-width: 0;
}

.job-filename {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.job-meta {
  font-size: 12px;
  color: #999999;
  margin: 0;
}

.job-status {
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3e0;
  color: #f57c00;
}

.status-processing {
  background: #e3f2fd;
  color: #1976d2;
}

.status-completed {
  background: #e8f5e9;
  color: #388e3c;
}

.status-failed,
.status-error {
  background: #ffebee;
  color: #d32f2f;
}

/* 打印机列表 */
.printers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.printer-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.printer-item:hover {
  background: #f0f0f0;
}

.printer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.printer-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.printer-details {
  flex: 1;
  min-width: 0;
}

.printer-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.printer-status {
  font-size: 12px;
  color: #999999;
  margin: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #999999;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .stat-value {
    font-size: 32px;
  }

  .content-card :deep(.n-card-header),
  .content-card :deep(.n-card__content) {
    padding: 16px;
  }
}
</style>