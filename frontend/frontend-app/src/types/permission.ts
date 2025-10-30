// 权限类型定义

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 权限枚举
export enum Permission {
  // 打印机管理权限
  PRINTER_VIEW = 'printer:view',
  PRINTER_MANAGE = 'printer:manage',
  PRINTER_SYNC = 'printer:sync',
  PRINTER_SET_DEFAULT = 'printer:set_default',

  // 打印任务权限
  JOB_VIEW = 'job:view',
  JOB_CREATE = 'job:create',
  JOB_CANCEL = 'job:cancel',
  JOB_PREVIEW = 'job:preview',

  // 日志查看权限
  LOG_VIEW = 'log:view',
  LOG_EXPORT = 'log:export',

  // API 文档权限
  API_DOCS_VIEW = 'api_docs:view',

  // 系统管理权限
  SYSTEM_MANAGE = 'system:manage',
  USER_MANAGE = 'user:manage'
}

// 角色权限映射
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 管理员拥有所有权限
    Permission.PRINTER_VIEW,
    Permission.PRINTER_MANAGE,
    Permission.PRINTER_SYNC,
    Permission.PRINTER_SET_DEFAULT,
    Permission.JOB_VIEW,
    Permission.JOB_CREATE,
    Permission.JOB_CANCEL,
    Permission.JOB_PREVIEW,
    Permission.LOG_VIEW,
    Permission.LOG_EXPORT,
    Permission.API_DOCS_VIEW,
    Permission.SYSTEM_MANAGE,
    Permission.USER_MANAGE
  ],
  [UserRole.USER]: [
    // 普通用户权限
    Permission.PRINTER_VIEW,
    Permission.JOB_VIEW,
    Permission.JOB_CREATE,
    Permission.JOB_CANCEL,
    Permission.JOB_PREVIEW,
    Permission.LOG_VIEW,
    Permission.API_DOCS_VIEW
  ],
  [UserRole.GUEST]: [
    // 访客权限（只读）
    Permission.PRINTER_VIEW,
    Permission.JOB_VIEW,
    Permission.LOG_VIEW,
    Permission.API_DOCS_VIEW
  ]
}

// 权限检查结果
export interface PermissionCheckResult {
  hasPermission: boolean
  reason?: string
}
