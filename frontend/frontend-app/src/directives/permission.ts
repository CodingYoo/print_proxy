import type { Directive, DirectiveBinding } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { Permission, UserRole } from '@/types/permission'

/**
 * 权限指令
 * 用法：
 * v-permission="Permission.PRINTER_MANAGE" - 检查单个权限
 * v-permission="[Permission.PRINTER_MANAGE, Permission.JOB_CREATE]" - 检查多个权限（任意一个）
 * v-permission:all="[Permission.PRINTER_MANAGE, Permission.JOB_CREATE]" - 检查多个权限（全部）
 */
export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()
    
    const value = binding.value
    const modifier = binding.modifiers
    
    let hasAccess = false
    
    if (Array.isArray(value)) {
      // 多个权限
      if (modifier.all) {
        // 需要拥有所有权限
        hasAccess = hasAllPermissions(value as Permission[])
      } else {
        // 拥有任意一个权限即可
        hasAccess = hasAnyPermission(value as Permission[])
      }
    } else if (typeof value === 'string') {
      // 单个权限
      hasAccess = hasPermission(value as Permission)
    }
    
    // 如果没有权限，隐藏元素
    if (!hasAccess) {
      el.style.display = 'none'
      // 添加标记，方便调试
      el.setAttribute('data-permission-hidden', 'true')
    }
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission()
    
    const value = binding.value
    const modifier = binding.modifiers
    
    let hasAccess = false
    
    if (Array.isArray(value)) {
      if (modifier.all) {
        hasAccess = hasAllPermissions(value as Permission[])
      } else {
        hasAccess = hasAnyPermission(value as Permission[])
      }
    } else if (typeof value === 'string') {
      hasAccess = hasPermission(value as Permission)
    }
    
    // 根据权限显示或隐藏元素
    if (hasAccess) {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    } else {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  }
}

/**
 * 角色指令
 * 用法：
 * v-role="UserRole.ADMIN" - 检查单个角色
 * v-role="[UserRole.ADMIN, UserRole.USER]" - 检查多个角色（任意一个）
 */
export const roleDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { hasRole, hasAnyRole } = usePermission()
    
    const value = binding.value
    let hasAccess = false
    
    if (Array.isArray(value)) {
      // 多个角色
      hasAccess = hasAnyRole(value as UserRole[])
    } else if (typeof value === 'string') {
      // 单个角色
      hasAccess = hasRole(value as UserRole)
    }
    
    // 如果没有角色，隐藏元素
    if (!hasAccess) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    }
  },
  
  updated(el: HTMLElement, binding: DirectiveBinding) {
    const { hasRole, hasAnyRole } = usePermission()
    
    const value = binding.value
    let hasAccess = false
    
    if (Array.isArray(value)) {
      hasAccess = hasAnyRole(value as UserRole[])
    } else if (typeof value === 'string') {
      hasAccess = hasRole(value as UserRole)
    }
    
    // 根据角色显示或隐藏元素
    if (hasAccess) {
      el.style.display = ''
      el.removeAttribute('data-role-hidden')
    } else {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    }
  }
}
