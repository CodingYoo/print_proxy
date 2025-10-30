// API 服务统一入口
export { default as apiClient, setMessageInstance, getRequestCount, cancelAllRequests, cancelRequest } from './client'
export { authApi } from './services/auth'
export { printersApi } from './services/printers'
export { jobsApi } from './services/jobs'
export { logsApi } from './services/logs'

// 导出类型
export type { RequestConfig } from './client'