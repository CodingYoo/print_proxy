import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { PaginationInfo } from '@/types/common'

// 定义日志级别
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'

// 定义日志类型
export type LogType = 'system' | 'printer' | 'job' | 'auth' | 'api'

// 定义日志接口
export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  type: LogType
  source: string
  message: string
  details?: Record<string, any>
  userId?: string
  username?: string
  printerId?: string
  printerName?: string
  jobId?: string
  requestId?: string
  duration?: number
  statusCode?: number
}

// 定义日志查询参数
export interface LogsQueryParams {
  level?: LogLevel
  type?: LogType
  source?: string
  search?: string
  startDate?: string
  endDate?: string
  userId?: string
  printerId?: string
  jobId?: string
  page?: number
  pageSize?: number
}

// 定义日志统计信息
export interface LogStats {
  total: number
  byLevel: Record<LogLevel, number>
  byType: Record<LogType, number>
  recentErrors: number
  systemHealth: 'healthy' | 'warning' | 'critical'
}

// 定义日志状态 store
export const useLogsStore = defineStore('logs', () => {
  // 状态
  const logs = ref<LogEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  })
  const stats = ref<LogStats>({
    total: 0,
    byLevel: {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    },
    byType: {
      system: 0,
      printer: 0,
      job: 0,
      auth: 0,
      api: 0
    },
    recentErrors: 0,
    systemHealth: 'healthy'
  })

  // 实时日志开关
  const realTimeEnabled = ref(false)
  const autoRefreshInterval = ref<number | null>(null)

  // 计算属性
  const errorLogs = computed(() => 
    logs.value.filter(log => ['error', 'critical'].includes(log.level))
  )

  const warningLogs = computed(() => 
    logs.value.filter(log => log.level === 'warning')
  )

  const recentLogs = computed(() => 
    logs.value.slice(0, 20)
  )

  const logsByLevel = computed(() => {
    const grouped: Record<LogLevel, LogEntry[]> = {
      debug: [],
      info: [],
      warning: [],
      error: [],
      critical: []
    }
    logs.value.forEach(log => {
      grouped[log.level].push(log)
    })
    return grouped
  })

  const logsByType = computed(() => {
    const grouped: Record<LogType, LogEntry[]> = {
      system: [],
      printer: [],
      job: [],
      auth: [],
      api: []
    }
    logs.value.forEach(log => {
      grouped[log.type].push(log)
    })
    return grouped
  })

  // 获取日志列表
  const fetchLogs = async (params: LogsQueryParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/logs', { params })
      logs.value = response.data.items || response.data
      
      if (response.data?.pagination) {
        pagination.value = response.data.pagination
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取日志列表失败'
      console.error('Failed to fetch logs:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取日志统计信息
  const fetchLogStats = async (params: Partial<LogsQueryParams> = {}) => {
    try {
      const response = await apiClient.get('/logs/stats', { params })
      stats.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch log stats:', err)
    }
  }

  // 获取单个日志详情
  const fetchLog = async (id: string) => {
    try {
      const response = await apiClient.get(`/logs/${id}`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取日志详情失败'
      throw err
    }
  }

  // 导出日志
  const exportLogs = async (params: LogsQueryParams = {}, format: 'csv' | 'json' = 'csv') => {
    try {
      const response = await apiClient.get('/logs/export', {
        params: { ...params, format },
        responseType: 'blob'
      })
      
      // 创建下载链接
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `logs_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      error.value = err.response?.data?.detail || '导出日志失败'
      throw err
    }
  }

  // 清理日志
  const clearLogs = async (params: {
    olderThan?: string
    level?: LogLevel
    type?: LogType
  } = {}) => {
    try {
      await apiClient.post('/logs/clear', params)
      await fetchLogs() // 重新获取日志列表
    } catch (err: any) {
      error.value = err.response?.data?.detail || '清理日志失败'
      throw err
    }
  }

  // 搜索日志
  const searchLogs = async (query: string, filters: Partial<LogsQueryParams> = {}) => {
    return await fetchLogs({
      ...filters,
      search: query
    })
  }

  // 实时日志功能
  const enableRealTime = () => {
    if (realTimeEnabled.value) return

    realTimeEnabled.value = true
    autoRefreshInterval.value = window.setInterval(async () => {
      try {
        // 获取最新的日志（只获取第一页）
        const response = await apiClient.get('/logs', {
          params: { page: 1, pageSize: 20 }
        })
        const newLogs = response.data.items || response.data
        
        // 合并新日志，避免重复
        const existingIds = new Set(logs.value.map(log => log.id))
        const uniqueNewLogs = newLogs.filter((log: LogEntry) => !existingIds.has(log.id))
        
        if (uniqueNewLogs.length > 0) {
          logs.value = [...uniqueNewLogs, ...logs.value].slice(0, 200) // 保持最多200条日志
        }
      } catch (err) {
        console.error('Failed to fetch real-time logs:', err)
      }
    }, 5000) // 每5秒刷新一次
  }

  const disableRealTime = () => {
    if (!realTimeEnabled.value) return

    realTimeEnabled.value = false
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
    }
  }

  // 添加新日志（用于实时推送）
  const addLog = (log: LogEntry) => {
    logs.value.unshift(log)
    // 保持最多200条日志
    if (logs.value.length > 200) {
      logs.value = logs.value.slice(0, 200)
    }
  }

  // 获取系统健康状态
  const getSystemHealth = computed(() => {
    const recentErrorCount = errorLogs.value.filter(log => {
      const logTime = new Date(log.timestamp)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return logTime > oneHourAgo
    }).length

    if (recentErrorCount >= 10) return 'critical'
    if (recentErrorCount >= 3) return 'warning'
    return 'healthy'
  })

  return {
    // 状态
    logs,
    loading,
    error,
    pagination,
    stats,
    realTimeEnabled,
    // 计算属性
    errorLogs,
    warningLogs,
    recentLogs,
    logsByLevel,
    logsByType,
    getSystemHealth,
    // 方法
    fetchLogs,
    fetchLogStats,
    fetchLog,
    exportLogs,
    clearLogs,
    searchLogs,
    enableRealTime,
    disableRealTime,
    addLog
  }
})