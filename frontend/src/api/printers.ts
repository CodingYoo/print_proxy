import { apiClient } from './client'

export interface Printer {
  id: number
  name: string
  status: string
  location?: string
  is_default: boolean
  created_at: string
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

  setDefault: async (id: number): Promise<Printer> => {
    const response = await apiClient.post<Printer>(`/printers/${id}/default`)
    return response.data
  },
}
