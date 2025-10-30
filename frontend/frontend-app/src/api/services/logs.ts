import apiClient from '@/api/client'
import type { LogsQueryParams } from '@/stores/logs'

// 日志相关 API 服务
export const logsApi = {
    // 获取日志列表
    getList: (params?: LogsQueryParams) => {
        return apiClient.get('/api/logs', { params })
    },

    // 获取日志详情
    getById: (id: string) => {
        return apiClient.get(`/api/logs/${id}`)
    },

    // 获取日志统计信息
    getStats: (params?: Partial<LogsQueryParams>) => {
        return apiClient.get('/api/logs/stats', { params })
    },

    // 搜索日志
    search: (query: string, filters?: Partial<LogsQueryParams>) => {
        return apiClient.get('/api/logs/search', {
            params: { q: query, ...filters }
        })
    },

    // 导出日志
    export: (params?: LogsQueryParams & { format?: 'csv' | 'json' | 'txt' }) => {
        return apiClient.get('/api/logs/export', {
            params,
            responseType: 'blob'
        })
    },

    // 清理日志
    clear: (params?: {
        olderThan?: string
        level?: string
        type?: string
    }) => {
        return apiClient.post('/api/logs/clear', params)
    },

    // 获取实时日志流
    getStream: (params?: {
        level?: string
        type?: string
        follow?: boolean
    }) => {
        return apiClient.get('/api/logs/stream', {
            params,
            responseType: 'stream'
        })
    },

    // 获取日志级别配置
    getLevels: () => {
        return apiClient.get('/api/logs/levels')
    },

    // 更新日志级别配置
    updateLevels: (levels: Record<string, string>) => {
        return apiClient.put('/api/logs/levels', levels)
    },

    // 获取日志源列表
    getSources: () => {
        return apiClient.get('/api/logs/sources')
    },

    // 获取系统健康状态
    getHealthStatus: () => {
        return apiClient.get('/api/logs/health')
    },

    // 获取错误趋势
    getErrorTrends: (params?: {
        period?: 'hour' | 'day' | 'week' | 'month'
        startDate?: string
        endDate?: string
    }) => {
        return apiClient.get('/api/logs/trends/errors', { params })
    },

    // 获取性能指标
    getPerformanceMetrics: (params?: {
        period?: 'hour' | 'day' | 'week' | 'month'
        startDate?: string
        endDate?: string
    }) => {
        return apiClient.get('/api/logs/metrics/performance', { params })
    }
}
