import apiClient from '@/api/client'
import type { PrintJob, JobsQueryParams } from '@/stores/jobs'

// 打印任务相关 API 服务
export const jobsApi = {
  // 获取任务列表
  getList: (params?: JobsQueryParams) => {
    return apiClient.get('/jobs', { params })
  },

  // 获取任务详情
  getById: (id: string) => {
    return apiClient.get(`/jobs/${id}`)
  },

  // 提交打印任务
  submit: (data: {
    file: File
    printerId: string
    copies?: number
    priority?: string
    settings?: Partial<PrintJob['settings']>
  }) => {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('printer_id', data.printerId)
    
    if (data.copies) {
      formData.append('copies', data.copies.toString())
    }
    
    if (data.priority) {
      formData.append('priority', data.priority)
    }
    
    if (data.settings) {
      formData.append('settings', JSON.stringify(data.settings))
    }

    return apiClient.post('/jobs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 取消任务
  cancel: (id: string) => {
    return apiClient.post(`/jobs/${id}/cancel`)
  },

  // 重新提交任务
  resubmit: (id: string) => {
    return apiClient.post(`/jobs/${id}/resubmit`)
  },

  // 删除任务
  delete: (id: string) => {
    return apiClient.delete(`/jobs/${id}`)
  },

  // 暂停任务
  pause: (id: string) => {
    return apiClient.post(`/jobs/${id}/pause`)
  },

  // 恢复任务
  resume: (id: string) => {
    return apiClient.post(`/jobs/${id}/resume`)
  },

  // 获取任务进度
  getProgress: (id: string) => {
    return apiClient.get(`/jobs/${id}/progress`)
  },

  // 获取任务预览
  getPreview: (id: string) => {
    return apiClient.get(`/jobs/${id}/preview`, {
      responseType: 'blob'
    })
  },

  // 下载任务文件
  downloadFile: (id: string) => {
    return apiClient.get(`/jobs/${id}/download`, {
      responseType: 'blob'
    })
  },

  // 批量操作
  batchCancel: (jobIds: string[]) => {
    return apiClient.post('/jobs/batch-cancel', { job_ids: jobIds })
  },

  batchDelete: (jobIds: string[]) => {
    return apiClient.post('/jobs/batch-delete', { job_ids: jobIds })
  },

  batchResubmit: (jobIds: string[]) => {
    return apiClient.post('/jobs/batch-resubmit', { job_ids: jobIds })
  },

  // 获取任务统计信息
  getStats: (params?: Partial<JobsQueryParams>) => {
    return apiClient.get('/jobs/stats', { params })
  },

  // 获取任务历史
  getHistory: (params?: {
    userId?: string
    printerId?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) => {
    return apiClient.get('/jobs/history', { params })
  },

  // 导出任务数据
  export: (params?: JobsQueryParams & { format?: 'csv' | 'excel' }) => {
    return apiClient.get('/jobs/export', {
      params,
      responseType: 'blob'
    })
  }
}
