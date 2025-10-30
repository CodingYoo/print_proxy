import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserRole, Permission, RolePermissions, type PermissionCheckResult } from '@/types/permission'

/**
 * 权限管理 Composable
 * 提供基于角色的权限控制功能
 */
export function usePermission() {
  const authStore = useAuthStore()

  // 获取当前用户角色
  const userRole = computed<UserRole>(() => {
    const role = authStore.user?.role
    if (!role) return UserRole.GUEST
    
    // 确保角色值有效
    if (Object.values(UserRole).includes(role as UserRole)) {
      return role as UserRole
    }
    
    return UserRole.GUEST
  })

  // 获取当前用户的所有权限
  const userPermissions = computed<Permission[]>(() => {
    return RolePermissions[userRole.value] || []
  })

  /**
   * 检查用户是否拥有指定权限
   * @param permission 权限标识
   * @returns 是否拥有权限
   */
  const hasPermission = (permission: Permission): boolean => {
    // 未登录用户没有任何权限
    if (!authStore.isAuthenticated) {
      return false
    }

    // 检查用户权限列表
    return userPermissions.value.includes(permission)
  }

  /**
   * 检查用户是否拥有任意一个权限
   * @param permissions 权限列表
   * @returns 是否拥有任意权限
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!authStore.isAuthenticated) {
      return false
    }

    return permissions.some(permission => hasPermission(permission))
  }

  /**
   * 检查用户是否拥有所有权限
   * @param permissions 权限列表
   * @returns 是否拥有所有权限
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!authStore.isAuthenticated) {
      return false
    }

    return permissions.every(permission => hasPermission(permission))
  }

  /**
   * 检查用户是否拥有指定角色
   * @param role 角色
   * @returns 是否拥有角色
   */
  const hasRole = (role: UserRole): boolean => {
    if (!authStore.isAuthenticated) {
      return false
    }

    return userRole.value === role
  }

  /**
   * 检查用户是否拥有任意一个角色
   * @param roles 角色列表
   * @returns 是否拥有任意角色
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!authStore.isAuthenticated) {
      return false
    }

    return roles.includes(userRole.value)
  }

  /**
   * 检查权限并返回详细结果
   * @param permission 权限标识
   * @returns 权限检查结果
   */
  const checkPermission = (permission: Permission): PermissionCheckResult => {
    if (!authStore.isAuthenticated) {
      return {
        hasPermission: false,
        reason: '用户未登录'
      }
    }

    const hasAccess = hasPermission(permission)
    
    return {
      hasPermission: hasAccess,
      reason: hasAccess ? undefined : '没有权限执行此操作'
    }
  }

  /**
   * 是否为管理员
   */
  const isAdmin = computed(() => hasRole(UserRole.ADMIN))

  /**
   * 是否为普通用户
   */
  const isUser = computed(() => hasRole(UserRole.USER))

  /**
   * 是否为访客
   */
  const isGuest = computed(() => hasRole(UserRole.GUEST))

  return {
    // 状态
    userRole,
    userPermissions,
    isAdmin,
    isUser,
    isGuest,
    
    // 方法
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    checkPermission
  }
}
