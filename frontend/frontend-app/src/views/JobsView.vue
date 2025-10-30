<template>
  <div class="jobs-view">
    <!-- 页面标题和操作 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          打印任务
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          管理和监控所有打印任务
        </p>
      </div>
      <div class="flex items-center space-x-3 mt-4 sm:mt-0">
        <n-button
          type="primary"
          @click="showCreateJobModal = true"
        >
          <template #icon>
            <n-icon>
              <PlusIcon />
            </n-icon>
          </template>
          新建任务
        </n-button>
        <n-button
          @click="refreshJobs"
          :loading="refreshing"
        >
          <template #icon>
            <n-icon>
              <RefreshIcon />
            </n-icon>
          </template>
          刷新
        </n-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">总计</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ stats.total }}</p>
          </div>
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="20" color="#3b82f6">
              <FileIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">等待中</p>
            <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ stats.pending }}</p>
          </div>
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="20" color="#f59e0b">
              <ClockIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">打印中</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.printing }}</p>
          </div>
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="20" color="#3b82f6">
              <PrinterIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">已完成</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.completed }}</p>
          </div>
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="20" color="#10b981">
              <CheckCircleIcon />
            </n-icon>
          </div>
        </div>
      </n-card>

      <n-card class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">失败</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats.failed }}</p>
          </div>
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
            <n-icon size="20" color="#ef4444">
              <CloseCircleIcon />
            </n-icon>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 筛选和搜索 -->
    <n-card class="mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            placeholder="筛选状态"
            clearable
            class="w-32"
            @update:value="handleFilterChange"
          />
          <n-select
            v-model:value="printerFilter"
            :options="printerOptions"
            placeholder="筛选打印机"
            clearable
            class="w-40"
            @update:value="handleFilterChange"
          />
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            placeholder="选择日期范围"
            clearable
            @update:value="handleFilterChange"
          />
        </div>
        <div class="flex items-center space-x-4">
          <n-input
            v-model:value="searchQuery"
            placeholder="搜索文件名"
            clearable
            class="w-64"
            @update:value="handleSearch"
          >
            <template #prefix>
              <n-icon>
                <SearchIcon />
              </n-icon>
            </template>
          </n-input>
          <n-button-group>
            <n-button
              :type="selectedJobs.length > 0 ? 'error' : 'default'"
              :disabled="selectedJobs.length === 0"
              @click="batchCancel"
            >
              批量取消
            </n-button>
            <n-button
              :disabled="selectedJobs.length === 0"
              @click="batchDelete"
            >
              批量删除
            </n-button>
          </n-button-group>
        </div>
      </div>
    </n-card>

    <!-- 任务列表 -->
    <n-card>
      <DataTable
        :data="filteredJobs"
        :columns="tableColumns"
        :loading="loading"
        :pagination="pagination"
        :row-selection="true"
        v-model:selected-rows="selectedJobs"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <!-- 创建任务模态框 -->
    <n-modal
      v-model:show="showCreateJobModal"
      preset="card"
      title="创建打印任务"
      class="w-full max-w-2xl"
      :mask-closable="false"
    >
      <CreateJobForm
        @success="handleJobCreated"
        @cancel="showCreateJobModal = false"
      />
    </n-modal>

    <!-- 任务预览模态框 -->
    <n-modal
      v-model:show="showPreviewModal"
      preset="card"
      title="任务预览"
      class="w-full max-w-4xl"
      :mask-closable="true"
    >
      <JobPreview
        v-if="previewJobId"
        :job-id="previewJobId"
        @close="showPreviewModal = false"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, NIcon, NTag, NProgress } from 'naive-ui'
import { useJobsStore } from '@/stores/jobs'
import { usePrintersStore } from '@/stores/printers'
import type { PrintJob } from '@/stores/jobs'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'
import CreateJobForm from '@/components/jobs/CreateJobForm.vue'
import JobPreview from '@/components/jobs/JobPreview.vue'
import {
  PlusOutlined as PlusIcon,
  ReloadOutlined as RefreshIcon,
  FileTextOutlined as FileIcon,
  ClockCircleOutlined as ClockIcon,
  PrinterOutlined as PrinterIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CloseCircleOutlined as CloseCircleIcon,
  SearchOutlined as SearchIcon,
  EyeOutlined as PreviewIcon,
  StopOutlined as CancelIcon,
  DeleteOutlined as DeleteIcon,
  RedoOutlined as ResubmitIcon,
  MoreOutlined as MoreIcon
} from '@vicons/antd'

const router = useRouter()
const message = useMessage()
const jobsStore = useJobsStore()
const printersStore = usePrintersStore()

// 响应式状态
const loading = computed(() => jobsStore.loading)
const jobs = computed(() => jobsStore.jobs)
const stats = computed(() => jobsStore.stats)
const refreshing = ref(false)
const selectedJobs = ref<PrintJob[]>([])

// 模态框状态
const showCreateJobModal = ref(false)
const showPreviewModal = ref(false)
const previewJobId = ref<string | null>(null)

// 筛选和搜索
const statusFilter = ref<string | null>(null)
const printerFilter = ref<string | null>(null)
const dateRange = ref<[number, number] | null>(null)
const searchQuery = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const statusOptions = [
  { label: '全部', value: null },
  { label: '等待中', value: 'pending' },
  { label: '打印中', value: 'printing' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
  { label: '已取消', value: 'cancelled' }
]

const printerOptions = computed(() => [
  { label: '全部打印机', value: null },
  ...printersStore.printers.map(printer => ({
    label: printer.name,
    value: printer.id
  }))
])

const filteredJobs = computed(() => {
  let filtered = jobs.value

  // 状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(job => job.status === statusFilter.value)
  }

  // 打印机筛选
  if (printerFilter.value) {
    filtered = filtered.filter(job => job.printerId === printerFilter.value)
  }

  // 日期范围筛选
  if (dateRange.value) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(job => {
      const jobDate = new Date(job.submittedAt).getTime()
      return jobDate >= start && jobDate <= end
    })
  }

  // 搜索筛选
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(job => 
      job.filename.toLowerCase().includes(query)
    )
  }

  return filtered
})

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  total: filteredJobs.value.length,
  totalPages: Math.ceil(filteredJobs.value.length / pageSize.value)
}))

// 表格列定义
const tableColumns = computed(() => [
  {
    title: '文件名',
    key: 'filename',
    render: (row: PrintJob) => h('div', { class: 'flex items-center space-x-2' }, [
      h('span', { class: 'font-medium truncate max-w-xs' }, row.filename),
      row.priority === 'high' ? h(NTag, { size: 'tiny', type: 'error' }, '高优先级') : null
    ])
  },
  {
    title: '状态',
    key: 'status',
    render: (row: PrintJob) => h('div', { class: 'flex items-center space-x-2' }, [
      h(StatusBadge, { status: row.status }),
      row.progress !== undefined && row.status === 'printing' 
        ? h(NProgress, { 
            type: 'line', 
            percentage: row.progress, 
            size: 'small',
            class: 'w-16'
          }) 
        : null
    ])
  },
  {
    title: '打印机',
    key: 'printerName',
    render: (row: PrintJob) => row.printerName || '未知'
  },
  {
    title: '页数/份数',
    key: 'pages',
    render: (row: PrintJob) => `${row.pages} 页 × ${row.copies} 份`
  },
  {
    title: '提交时间',
    key: 'submittedAt',
    render: (row: PrintJob) => formatTime(row.submittedAt)
  },
  {
    title: '用时',
    key: 'duration',
    render: (row: PrintJob) => {
      if (row.status === 'completed' && row.actualDuration) {
        return formatDuration(row.actualDuration)
      }
      if (row.status === 'printing' && row.startedAt) {
        const elapsed = Date.now() - new Date(row.startedAt).getTime()
        return formatDuration(elapsed / 1000)
      }
      return '-'
    }
  },
  {
    title: '操作',
    key: 'actions',
    render: (row: PrintJob) => h('div', { class: 'flex items-center space-x-1' }, [
      h('n-button', {
        size: 'small',
        quaternary: true,
        onClick: () => previewJob(row.id)
      }, { 
        icon: () => h(NIcon, null, { default: () => h(PreviewIcon) }),
        default: () => '预览'
      }),
      ['pending', 'printing'].includes(row.status) ? h('n-button', {
        size: 'small',
        type: 'error',
        quaternary: true,
        onClick: () => cancelJob(row.id)
      }, { 
        icon: () => h(NIcon, null, { default: () => h(CancelIcon) }),
        default: () => '取消'
      }) : null,
      row.status === 'failed' ? h('n-button', {
        size: 'small',
        type: 'primary',
        quaternary: true,
        onClick: () => resubmitJob(row.id)
      }, { 
        icon: () => h(NIcon, null, { default: () => h(ResubmitIcon) }),
        default: () => '重试'
      }) : null,
      ['completed', 'failed', 'cancelled'].includes(row.status) ? h('n-button', {
        size: 'small',
        type: 'error',
        quaternary: true,
        onClick: () => deleteJob(row.id)
      }, { 
        icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }),
        default: () => '删除'
      }) : null
    ])
  }
])

// 方法
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}秒`
  if (seconds < 3600) return `${Math.round(seconds / 60)}分钟`
  return `${Math.round(seconds / 3600)}小时`
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadJobs()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadJobs()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadJobs()
}

const loadJobs = async () => {
  const params: any = {
    page: currentPage.value,
    pageSize: pageSize.value
  }

  if (statusFilter.value) params.status = statusFilter.value
  if (printerFilter.value) params.printerId = printerFilter.value
  if (dateRange.value) {
    params.startDate = new Date(dateRange.value[0]).toISOString()
    params.endDate = new Date(dateRange.value[1]).toISOString()
  }
  if (searchQuery.value) params.search = searchQuery.value

  await jobsStore.fetchJobs(params)
}

const refreshJobs = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadJobs(),
      jobsStore.fetchJobStats()
    ])
    message.success('任务列表已刷新')
  } catch (error) {
    message.error('刷新任务列表失败')
  } finally {
    refreshing.value = false
  }
}

const previewJob = (jobId: string) => {
  previewJobId.value = jobId
  showPreviewModal.value = true
}

const cancelJob = async (jobId: string) => {
  try {
    await jobsStore.cancelJob(jobId)
    message.success('任务已取消')
  } catch (error) {
    message.error('取消任务失败')
  }
}

const resubmitJob = async (jobId: string) => {
  try {
    await jobsStore.resubmitJob(jobId)
    message.success('任务已重新提交')
  } catch (error) {
    message.error('重新提交任务失败')
  }
}

const deleteJob = async (jobId: string) => {
  try {
    await jobsStore.deleteJob(jobId)
    message.success('任务已删除')
  } catch (error) {
    message.error('删除任务失败')
  }
}

const batchCancel = async () => {
  if (selectedJobs.value.length === 0) return

  try {
    const jobIds = selectedJobs.value.map(job => job.id)
    await jobsStore.batchCancelJobs(jobIds)
    message.success(`已取消 ${jobIds.length} 个任务`)
    selectedJobs.value = []
  } catch (error) {
    message.error('批量取消任务失败')
  }
}

const batchDelete = async () => {
  if (selectedJobs.value.length === 0) return

  try {
    const jobIds = selectedJobs.value.map(job => job.id)
    await jobsStore.batchDeleteJobs(jobIds)
    message.success(`已删除 ${jobIds.length} 个任务`)
    selectedJobs.value = []
  } catch (error) {
    message.error('批量删除任务失败')
  }
}

const handleJobCreated = () => {
  showCreateJobModal.value = false
  refreshJobs()
  message.success('任务创建成功')
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    printersStore.fetchPrinters(),
    loadJobs(),
    jobsStore.fetchJobStats()
  ])
})
</script>

<style scoped>
.jobs-view {
  @apply max-w-7xl mx-auto;
}

.stat-card {
  @apply transition-all duration-200 hover:shadow-md;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .jobs-view {
    @apply px-4;
  }
}
</style>