import apiClient from '@/api/client'
import type { Printer, PrintersQueryParams } from '@/stores/printers'

// 打印机相关 API 服务
export const printersApi = {
  // 获取打印机列表
  getList: (params?: PrintersQueryParams) => {
    return apiClient.get('/printers', { params })
  },

  // 获取打印机详情
  getById: (id: string) => {
    return apiClient.get(`/printers/${id}`)
  },

  // 添加打印机
  create: (data: Partial<Printer>) => {
    return apiClient.post('/printers', data)
  },

  // 更新打印机
  update: (id: string, data: Partial<Printer>) => {
    return apiClient.put(`/printers/${id}`, data)
  },

  // 删除打印机
  delete: (id: string) => {
    return apiClient.delete(`/printers/${id}`)
  },

  // 设置默认打印机
  setDefault: (id: string) => {
    return apiClient.post(`/printers/${id}/set-default`)
  },

  // 测试打印机连接
  test: (id: string) => {
    return apiClient.post(`/printers/${id}/test`)
  },

  // 刷新打印机状态
  refreshStatus: (id: string) => {
    return apiClient.post(`/printers/${id}/refresh`)
  },

  // 刷新所有打印机状态
  refreshAllStatus: () => {
    return apiClient.post('/printers/refresh-all')
  },

  // 获取打印机能力
  getCapabilities: (id: string) => {
    return apiClient.get(`/printers/${id}/capabilities`)
  },

  // 获取打印机队列
  getQueue: (id: string) => {
    return apiClient.get(`/printers/${id}/queue`)
  },

  // 清空打印机队列
  clearQueue: (id: string) => {
    return apiClient.post(`/printers/${id}/clear-queue`)
  },

  // 暂停打印机
  pause: (id: string) => {
    return apiClient.post(`/printers/${id}/pause`)
  },

  // 恢复打印机
  resume: (id: string) => {
    return apiClient.post(`/printers/${id}/resume`)
  },

  // 获取打印机统计信息
  getStats: (id: string, params?: { startDate?: string; endDate?: string }) => {
    return apiClient.get(`/printers/${id}/stats`, { params })
  }
}