// 通用类型定义

// 分页信息接口
export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// API 响应基础接口
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  items: T[]
  pagination: PaginationInfo
}

// 错误响应接口
export interface ApiError {
  detail: string
  code?: string
  field?: string
}

// 排序参数
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

// 通用查询参数
export interface BaseQueryParams {
  page?: number
  pageSize?: number
  search?: string
  sort?: SortParams
}