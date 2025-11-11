import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import apiClient from '@/api/client'
import type { PaginationInfo } from '@/types/common'

// 定义打印机接口
export interface Printer {
  id: number
  name: string
  status: string
  is_default: boolean
  location?: string
  created_at: string
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
    printers.value.find(printer => printer.is_default)
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
      printers.value = response.data || []
      
      if (response.data && Array.isArray(response.data)) {
        pagination.value.total = response.data.length
      }
    } catch (err: any) {
      error.value = err.response?.data?.detail || '获取打印机列表失败'
      console.error('Failed to fetch printers:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取单个打印机详情
  const fetchPrinter = async (id: number) => {
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
  const updatePrinter = async (id: number, printerData: Partial<Printer>) => {
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
  const deletePrinter = async (id: number) => {
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
  const setDefaultPrinter = async (id: number) => {
    try {
      await apiClient.post(`/printers/${id}/default`)
      
      // 更新本地状态
      printers.value.forEach(printer => {
        printer.is_default = printer.id === id
      })
    } catch (err: any) {
      error.value = err.response?.data?.detail || '设置默认打印机失败'
      throw err
    }
  }

  // 测试打印机连接
  const testPrinter = async (id: number) => {
    try {
      const response = await apiClient.post(`/printers/${id}/test`)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.detail || '测试打印机失败'
      throw err
    }
  }

  // 刷新打印机状态
  const refreshPrinterStatus = async (id?: number) => {
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
        await apiClient.post('/printers/sync')
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