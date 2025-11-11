import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { PaginationInfo } from '@/types/common'

// 定义打印任务接口
export interface PrintJob {
  id: number
  title: string
  file_type: string
  status: string
  copies: number
  priority: number
  printer_name?: string
  media_size?: string
  color_mode?: string
  duplex?: string
  dpi?: number
  fit_mode?: string
  auto_rotate?: boolean
  enhance_quality?: boolean
  error_message?: string
  created_at: string
  updated_at: string
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
      const response = await apiClient.get('/jobs', { 
        params: {
          skip: params.page ? (params.page - 1) * (params.pageSize || 20) : 0,
          limit: params.pageSize || 20
        }
      })
      jobs.value = response.data || []
      
      if (response.data && Array.isArray(response.data)) {
        pagination.value.total = response.data.length
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取打印任务列表失败'
      console.error('Failed to fetch jobs:', err)
    } finally {
      loading.value = false
    }
  }


  // 获取单个任务详情
  const fetchJob = async (id: number) => {
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
  const cancelJob = async (id: number) => {
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
  const resubmitJob = async (id: number) => {
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
  const deleteJob = async (id: number) => {
    try {
      await apiClient.delete(`/jobs/${id}`)
      jobs.value = jobs.value.filter(job => job.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.detail || '删除任务失败'
      throw err
    }
  }

  // 批量操作
  const batchCancelJobs = async (jobIds: number[]) => {
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

  const batchDeleteJobs = async (jobIds: number[]) => {
    try {
      await apiClient.post('/jobs/batch-delete', { job_ids: jobIds })
      jobs.value = jobs.value.filter(job => !jobIds.includes(job.id))
    } catch (err: any) {
      error.value = err.response?.data?.detail || '批量删除任务失败'
      throw err
    }
  }

  // 实时更新任务状态
  const updateJobStatus = (jobId: number, status: string, progress?: number) => {
    const job = jobs.value.find(job => job.id === jobId)
    if (job) {
      job.status = status
    }
  }

  return {
    // 状态
    jobs,
    loading,
    error,
    pagination,
    // 计算属性
    activeJobs,
    completedJobs,
    failedJobs,
    jobsByStatus,
    jobsByPrinter,
    // 方法
    fetchJobs,
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