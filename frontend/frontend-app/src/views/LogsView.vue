<template>
  <div class="logs-view max-w-7xl mx-auto">
    <!-- 页面标题 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">日志查看</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">查看和分析系统运行日志</p>
      </div>
      <div class="flex items-center space-x-3 mt-4 sm:mt-0">
        <n-button @click="refreshLogs" :loading="refreshing">
          <template #icon>
            <n-icon><RefreshIcon /></n-icon>
          </template>
          刷新
        </n-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <n-card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">总日志数</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.total }}</p>
          </div>
        </div>
      </n-card>
      <n-card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">错误日志</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.byLevel.error }}</p>
          </div>
        </div>
      </n-card>
      <n-card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">警告日志</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.byLevel.warning }}</p>
          </div>
        </div>
      </n-card>
      <n-card>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">信息日志</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.byLevel.info }}</p>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 筛选区域 -->
    <n-card class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <n-select
          v-model:value="levelFilter"
          :options="levelOptions"
          placeholder="筛选级别"
          clearable
          class="w-32"
          @update:value="handleFilterChange"
        />
        <n-select
          v-model:value="typeFilter"
          :options="typeOptions"
          placeholder="筛选类型"
          clearable
          class="w-32"
          @update:value="handleFilterChange"
        />
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索日志内容"
          clearable
          class="flex-1"
          @update:value="handleSearch"
        >
          <template #prefix>
            <n-icon><SearchIcon /></n-icon>
          </template>
        </n-input>
      </div>
    </n-card>

    <!-- 日志列表 -->
    <n-card>
      <div v-if="loading" class="flex justify-center py-8">
        <n-spin size="large" />
      </div>
      <div v-else-if="filteredLogs.length === 0" class="text-center py-8">
        <n-empty description="暂无日志数据" />
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="log in paginatedLogs"
          :key="log.id"
          class="p-4 rounded-lg border"
          :class="getLogClass(log.level)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <n-tag :type="getLevelType(log.level)" size="small">
                  {{ getLevelText(log.level) }}
                </n-tag>
                <n-tag type="info" size="small">{{ getTypeText(log.type) }}</n-tag>
                <span class="text-sm text-gray-500">{{ formatTime(log.timestamp) }}</span>
              </div>
              <p class="text-gray-900 dark:text-gray-100">{{ log.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="filteredLogs.length > 0" class="flex justify-center mt-6">
        <n-pagination
          v-model:page="currentPage"
          :page-count="totalPages"
          :page-size="pageSize"
          @update:page="handlePageChange"
        />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useLogsStore } from '@/stores/logs'
import type { LogLevel, LogType } from '@/stores/logs'
import {
  ReloadOutlined as RefreshIcon,
  SearchOutlined as SearchIcon
} from '@vicons/antd'

const message = useMessage()
const logsStore = useLogsStore()

const loading = computed(() => logsStore.loading)
const logs = computed(() => logsStore.logs)
const stats = computed(() => logsStore.stats)
const refreshing = ref(false)

const levelFilter = ref<LogLevel | null>(null)
const typeFilter = ref<LogType | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(50)

const levelOptions = [
  { label: '全部级别', value: null },
  { label: '调试', value: 'debug' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warning' },
  { label: '错误', value: 'error' },
  { label: '严重', value: 'critical' }
]

const typeOptions = [
  { label: '全部类型', value: null },
  { label: '系统', value: 'system' },
  { label: '打印机', value: 'printer' },
  { label: '任务', value: 'job' },
  { label: '认证', value: 'auth' },
  { label: 'API', value: 'api' }
]

const filteredLogs = computed(() => {
  let filtered = logs.value
  if (levelFilter.value) {
    filtered = filtered.filter(log => log.level === levelFilter.value)
  }
  if (typeFilter.value) {
    filtered = filtered.filter(log => log.type === typeFilter.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(log => log.message.toLowerCase().includes(query))
  }
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / pageSize.value))

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredLogs.value.slice(start, start + pageSize.value)
})

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getLevelType = (level: LogLevel) => {
  const map: Record<LogLevel, any> = {
    debug: 'default',
    info: 'info',
    warning: 'warning',
    error: 'error',
    critical: 'error'
  }
  return map[level]
}

const getLevelText = (level: LogLevel) => {
  const map: Record<LogLevel, string> = {
    debug: '调试',
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return map[level]
}

const getTypeText = (type: LogType) => {
  const map: Record<LogType, string> = {
    system: '系统',
    printer: '打印机',
    job: '任务',
    auth: '认证',
    api: 'API'
  }
  return map[type]
}

const getLogClass = (level: LogLevel) => {
  if (level === 'error' || level === 'critical') {
    return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
  }
  if (level === 'warning') {
    return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10'
  }
  return 'border-gray-200 dark:border-gray-700'
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadLogs()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = () => {
  loadLogs()
}

const loadLogs = async () => {
  const params: any = { page: currentPage.value, pageSize: pageSize.value }
  if (levelFilter.value) params.level = levelFilter.value
  if (typeFilter.value) params.type = typeFilter.value
  if (searchQuery.value) params.search = searchQuery.value
  await logsStore.fetchLogs(params)
}

const refreshLogs = async () => {
  refreshing.value = true
  try {
    await Promise.all([loadLogs(), logsStore.fetchLogStats()])
    message.success('日志列表已刷新')
  } catch (error) {
    message.error('刷新日志列表失败')
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadLogs(), logsStore.fetchLogStats()])
})
</script>

<style scoped>
.logs-view {
  @apply px-4 sm:px-0;
}
</style>
