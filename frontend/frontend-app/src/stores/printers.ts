import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { PaginationInfo } from '@/types/common'

// 定义打印机接口
export interface Printer {
  id: string
  name: string
  status: 'online' | 'offline' | 'error' | 'busy'
  isDefault: boolean
  driver?: string
  location?: string
  description?: string
  paperSizes?: string[]
  capabilities?: {
    color: boolean
    duplex: boolean
    maxResolution?: string
  }
  lastSeen?: string
  createdAt?: string
  updatedAt?: string
}

// 定义打印机查询参数
export interface PrintersQueryParams {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}



// 定义打印机状态 store
export const usePrintersStore = defineStore('printers', () => {
  // 状态
  const printers = ref<Printer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  // 计算属性
  const onlinePrinters = computed(() => 
    printers.value.filter(printer => printer.status === 'online')
  )

  const defaultPrinter = computed(() => 
    printers.value.find(printer => printer.isDefault)
  )

  const printersByStatus = computed(() => {
    const grouped: Record<string, Printer[]> = {}
    printers.value.forEach(printer => {
      const status = printer.status
      if (!grouped[status]) {
        grouped[status] = []
      }
      grouped[status]!.push(printer)
    })
    return grouped
  })

  // 获取打印机列表
  const fetchPrinters = async (params: PrintersQueryParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/printers', { params })
      printers.value = response.data.items || response.data
      
      if (response.data.pagination) {
        pagination.value = response.data.pagination
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取打印机列表失败'
      console.error('Failed to fetch printers:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取单个打印机详情
  const fetchPrinter = async (id: string) => {
    try {
      const response = await apiClient.get(`/printers/${id}`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取打印机详情失败'
      throw err
    }
  }

  // 添加打印机
  const addPrinter = async (printerData: Partial<Printer>) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.post('/printers', printerData)
      const newPrinter = response.data
      printers.value.push(newPrinter)
      return newPrinter
    } catch (err: any) {
      error.value = err.response?.data?.detail || '添加打印机失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新打印机
  const updatePrinter = async (id: string, printerData: Partial<Printer>) => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.put(`/printers/${id}`, printerData)
      const updatedPrinter = response.data
      
      const index = printers.value.findIndex(p => p.id === id)
      if (index !== -1) {
        printers.value[index] = updatedPrinter
      }
      
      return updatedPrinter
    } catch (err: any) {
      error.value = err.response?.data?.detail || '更新打印机失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 删除打印机
  const deletePrinter = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await apiClient.delete(`/printers/${id}`)
      printers.value = printers.value.filter(p => p.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.detail || '删除打印机失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 设置默认打印机
  const setDefaultPrinter = async (id: string) => {
    try {
      await apiClient.post(`/printers/${id}/set-default`)
      
      // 更新本地状态
      printers.value.forEach(printer => {
        printer.isDefault = printer.id === id
      })
    } catch (err: any) {
      error.value = err.response?.data?.detail || '设置默认打印机失败'
      throw err
    }
  }

  // 测试打印机连接
  const testPrinter = async (id: string) => {
    try {
      const response = await apiClient.post(`/printers/${id}/test`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || '测试打印机失败'
      throw err
    }
  }

  // 刷新打印机状态
  const refreshPrinterStatus = async (id?: string) => {
    try {
      if (id) {
        const response = await apiClient.post(`/printers/${id}/refresh`)
        const updatedPrinter = response.data
        
        const index = printers.value.findIndex(p => p.id === id)
        if (index !== -1) {
          printers.value[index] = updatedPrinter
        }
        
        return updatedPrinter
      } else {
        // 刷新所有打印机状态
        await apiClient.post('/printers/refresh-all')
        await fetchPrinters()
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '刷新打印机状态失败'
      throw err
    }
  }

  return {
    // 状态
    printers,
    loading,
    error,
    pagination,
    // 计算属性
    onlinePrinters,
    defaultPrinter,
    printersByStatus,
    // 方法
    fetchPrinters,
    fetchPrinter,
    addPrinter,
    updatePrinter,
    deletePrinter,
    setDefaultPrinter,
    testPrinter,
    refreshPrinterStatus
  }
})