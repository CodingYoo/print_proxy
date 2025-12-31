import { apiClient } from './client'

export interface PrintJob {
  id: number
  title: string
  file_type: string
  copies: number
  priority: number
  status: string
  error_message?: string
  printer_name?: string
  media_size?: string
  color_mode?: string
  created_at: string
  updated_at: string
}

export interface CreateJobParams {
  title: string
  file_type: string
  content_base64: string
  copies?: number
  priority?: number
  printer_name?: string
  media_size?: string
  color_mode?: string
  fit_mode?: string
  auto_rotate?: boolean
  enhance_quality?: boolean
}

export const jobsApi = {
  list: async (skip = 0, limit = 100): Promise<PrintJob[]> => {
    const response = await apiClient.get<PrintJob[]>(`/jobs/?skip=${skip}&limit=${limit}`)
    return response.data
  },

  get: async (id: number): Promise<PrintJob> => {
    const response = await apiClient.get<PrintJob>(`/jobs/${id}`)
    return response.data
  },

  create: async (params: CreateJobParams): Promise<PrintJob> => {
    const response = await apiClient.post<PrintJob>('/jobs/', params)
    return response.data
  },

  cancel: async (id: number): Promise<PrintJob> => {
    const response = await apiClient.post<PrintJob>(`/jobs/${id}/cancel`)
    return response.data
  },

  reprint: async (id: number): Promise<PrintJob> => {
    const response = await apiClient.post<PrintJob>(`/jobs/${id}/reprint`)
    return response.data
  },

  getPreview: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/jobs/${id}/preview`, { responseType: 'blob' })
    return response.data
  },

  deleteJob: async (id: number): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`)
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/jobs/')
  },
}
