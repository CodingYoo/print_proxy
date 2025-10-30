import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { PaginationInfo } from '@/types/common'

// 定义打印任务接口
export interface PrintJob {
  id: string
  filename: string
  status: 'pending' | 'printing' | 'completed' | 'failed' | 'cancelled'
  printerId: string
  printerName?: string
  userId?: string
  username?: string
  pages: number
  copies: number
  priority: 'low' | 'normal' | 'high'
  settings: {
    paperSize?: string
    orientation?: 'portrait' | 'landscape'
    color?: boolean
    duplex?: boolean
    quality?: 'draft' | 'normal' | 'high'
  }
  progress?: number
  errorMessage?: string
  submittedAt: string
  startedAt?: string
  completedAt?: string
  estimatedDuration?: number
  actualDuration?: number
}

// 定义任务查询参数
export interface JobsQueryParams {
  status?: string
  printerId?: string
  userId?: string
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 定义任务统计信息
export interface JobStats {
  total: number
  pending: number
  printing: number
  completed: number
  failed: number
  cancelled: number
}

// 定义打印任务状态 store
export const useJobsStore = defineStore('jobs', () => {
  // 状态
  const jobs = ref<PrintJob[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  })
  const stats = ref<JobStats>({
    total: 0,
    pending: 0,
    printing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0
  })

  // 计算属性
  const activeJobs = computed(() => 
    jobs.value.filter(job => ['pending', 'printing'].includes(job.status))
  )

  const completedJobs = computed(() => 
    jobs.value.filter(job => job.status === 'completed')
  )

  const failedJobs = computed(() => 
    jobs.value.filter(job => job.status === 'failed')
  )

  const jobsByStatus = computed(() => {
    const grouped: Record<string, PrintJob[]> = {}
    jobs.value.forEach(job => {
      const status = job.status
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status]!.push(job)
    })
    return grouped
  })

  const jobsByPrinter = computed(() => {
    const grouped: Record<string, PrintJob[]> = {}
    jobs.value.forEach(job => {
      const printerId = job.printerId
      if (!grouped[printerId]) {
        grouped[printerId] = []
      }
      grouped[printerId]!.push(job)
    })
    return grouped
  })

  // 获取打印任务列表
  const fetchJobs = async (params: JobsQueryParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/jobs', { params })
      jobs.value = response.data.items || response.data
      
      if (response.data?.pagination) {
        pagination.value = response.data.pagination
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取打印任务列表失败'
      console.error('Failed to fetch jobs:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取任务统计信息
  const fetchJobStats = async (params: Partial<JobsQueryParams> = {}) => {
    try {
      const response = await apiClient.get('/jobs/stats', { params })
      stats.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch job stats:', err)
    }
  }

  // 获取单个任务详情
  const fetchJob = async (id: string) => {
    try {
      const response = await apiClient.get(`/jobs/${id}`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取任务详情失败'
      throw err
    }
  }

  // 提交打印任务
  const submitJob = async (jobData: {
    file: File
    printerId: string
    copies?: number
    priority?: string
    settings?: Partial<PrintJob['settings']>
  }) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', jobData.file)
      formData.append('printer_id', jobData.printerId)
      
      if (jobData.copies) {
        formData.append('copies', jobData.copies.toString())
      }
      
      if (jobData.priority) {
        formData.append('priority', jobData.priority)
      }
      
      if (jobData.settings) {
        formData.append('settings', JSON.stringify(jobData.settings))
      }

      const response = await apiClient.post('/jobs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const newJob = response.data
      jobs.value.unshift(newJob)
      
      return newJob
    } catch (err: any) {
      error.value = err.response?.data?.detail || '提交打印任务失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 取消打印任务
  const cancelJob = async (id: string) => {
    try {
      await apiClient.post(`/jobs/${id}/cancel`)
      
      const job = jobs.value.find(job => job.id === id)
      if (job) {
        job.status = 'cancelled'
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '取消任务失败'
      throw err
    }
  }

  // 重新提交任务
  const resubmitJob = async (id: string) => {
    try {
      const response = await apiClient.post(`/jobs/${id}/resubmit`)
      const updatedJob = response.data
      
      const index = jobs.value.findIndex(job => job.id === id)
      if (index !== -1) {
        jobs.value[index] = updatedJob
      }
      
      return updatedJob
    } catch (err: any) {
      error.value = err.response?.data?.detail || '重新提交任务失败'
      throw err
    }
  }

  // 删除任务
  const deleteJob = async (id: string) => {
    try {
      await apiClient.delete(`/jobs/${id}`)
      jobs.value = jobs.value.filter(job => job.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.detail || '删除任务失败'
      throw err
    }
  }

  // 批量操作
  const batchCancelJobs = async (jobIds: string[]) => {
    try {
      await apiClient.post('/jobs/batch-cancel', { job_ids: jobIds })
      
      jobIds.forEach(id => {
        const job = jobs.value.find(job => job.id === id)
        if (job) {
          job.status = 'cancelled'
        }
      })
    } catch (err: any) {
      error.value = err.response?.data?.detail || '批量取消任务失败'
      throw err
    }
  }

  const batchDeleteJobs = async (jobIds: string[]) => {
    try {
      await apiClient.post('/jobs/batch-delete', { job_ids: jobIds })
      jobs.value = jobs.value.filter(job => !jobIds.includes(job.id))
    } catch (err: any) {
      error.value = err.response?.data?.detail || '批量删除任务失败'
      throw err
    }
  }

  // 实时更新任务状态
  const updateJobStatus = (jobId: string, status: PrintJob['status'], progress?: number) => {
    const job = jobs.value.find(job => job.id === jobId)
    if (job) {
      job.status = status
      if (progress !== undefined) {
        job.progress = progress
      }
      if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date().toISOString()
      }
    }
  }

  return {
    // 状态
    jobs,
    loading,
    error,
    pagination,
    stats,
    // 计算属性
    activeJobs,
    completedJobs,
    failedJobs,
    jobsByStatus,
    jobsByPrinter,
    // 方法
    fetchJobs,
    fetchJobStats,
    fetchJob,
    submitJob,
    cancelJob,
    resubmitJob,
    deleteJob,
    batchCancelJobs,
    batchDeleteJobs,
    updateJobStatus
  }
})