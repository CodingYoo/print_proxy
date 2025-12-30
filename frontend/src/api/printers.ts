import { apiClient } from './client'

export interface Printer {
  id: number
  name: string
  status: string
  location?: string
  alias?: string
  description?: string
  is_default: boolean
  created_at: string
}

export interface PrinterStatus {
  code: number
  messages: string[]
  jobs_count?: number
}

export interface PrinterJob {
  id: number
  document: string
  user: string
  status: number
  status_string: string
  submitted: string
  pages: number
  size: number
}

export const printersApi = {
  list: async (): Promise<Printer[]> => {
    const response = await apiClient.get<Printer[]>('/printers/')
    return response.data
  },

  sync: async (): Promise<Printer[]> => {
    const response = await apiClient.post<Printer[]>('/printers/sync')
    return response.data
  },

  update: async (id: number, data: Partial<Printer>): Promise<Printer> => {
    const response = await apiClient.put<Printer>(`/printers/${id}`, data)
    return response.data
  },

  setDefault: async (id: number): Promise<Printer> => {
    const response = await apiClient.post<Printer>(`/printers/${id}/default`)
    return response.data
  },

  getStatus: async (id: number): Promise<PrinterStatus> => {
    const response = await apiClient.get<PrinterStatus>(`/printers/${id}/status`)
    return response.data
  },

  testPage: async (id: number): Promise<void> => {
    await apiClient.post(`/printers/${id}/test-page`)
  },

  getJobs: async (id: number): Promise<PrinterJob[]> => {
    const response = await apiClient.get<PrinterJob[]>(`/printers/${id}/jobs`)
    return response.data
  },

  clearQueue: async (id: number): Promise<void> => {
    await apiClient.delete(`/printers/${id}/jobs`)
  },
}
