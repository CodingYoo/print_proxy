import { apiClient } from './client'

export interface LogEntry {
  id: number
  job_id?: number
  category?: string
  level: string
  message: string
  created_at: string
}

export const logsApi = {
  list: async (jobId?: number): Promise<LogEntry[]> => {
    const query = jobId ? `?job_id=${jobId}` : ''
    const response = await apiClient.get<LogEntry[]>(`/logs/${query}`)
    return response.data
  },

  clearAll: async (): Promise<void> => {
    await apiClient.delete('/logs/')
  },
}
