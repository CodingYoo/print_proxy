<template>
  <slot v-if="hasAccess" />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { Permission, UserRole } from '@/types/permission'

interface Props {
  // 需要的权限（单个或多个）
  permission?: Permission | Permission[]
  // 需要的角色（单个或多个）
  role?: UserRole | UserRole[]
  // 是否需要所有权限（默认为 false，即任意一个即可）
  requireAll?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: false
})

const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = usePermission()

// 计算是否有访问权限
const hasAccess = computed(() => {
  // 如果指定了权限
  if (props.permission) {
    if (Array.isArray(props.permission)) {
      // 多个权限
      return props.requireAll
        ? hasAllPermissions(props.permission)
        : hasAnyPermission(props.permission)
    } else {
      // 单个权限
      return hasPermission(props.permission)
    }
  }

  // 如果指定了角色
  if (props.role) {
    if (Array.isArray(props.role)) {
      // 多个角色
      return hasAnyRole(props.role)
    } else {
      // 单个角色
      return hasRole(props.role)
    }
  }

  // 如果没有指定权限或角色，默认允许访问
  return true
})
</script>
