# 权限控制系统使用指南

## 概述

本项目实现了基于角色的权限控制系统（RBAC），支持以下功能：
- 基于角色的权限管理
- 路由级别的权限守卫
- 组件级别的权限控制
- 指令级别的权限控制

## 角色定义

系统定义了三种用户角色：

- `ADMIN`: 管理员，拥有所有权限
- `USER`: 普通用户，拥有基本操作权限
- `GUEST`: 访客，只有只读权限

## 权限定义

权限按功能模块划分：

### 打印机管理
- `PRINTER_VIEW`: 查看打印机
- `PRINTER_MANAGE`: 管理打印机
- `PRINTER_SYNC`: 同步打印机
- `PRINTER_SET_DEFAULT`: 设置默认打印机

### 打印任务
- `JOB_VIEW`: 查看任务
- `JOB_CREATE`: 创建任务
- `JOB_CANCEL`: 取消任务
- `JOB_PREVIEW`: 预览任务

### 日志
- `LOG_VIEW`: 查看日志
- `LOG_EXPORT`: 导出日志

### API 文档
- `API_DOCS_VIEW`: 查看 API 文档

### 系统管理
- `SYSTEM_MANAGE`: 系统管理
- `USER_MANAGE`: 用户管理

## 使用方法

### 1. 在路由中使用

```typescript
{
  path: '/printers',
  name: 'printers',
  component: () => import('@/views/PrintersView.vue'),
  meta: {
    title: '打印机管理',
    requiresAuth: true,
    permissions: [Permission.PRINTER_VIEW] // 需要的权限
  }
}
```

### 2. 在组件中使用 Composable

```vue
<script setup lang="ts">
import { usePermission } from '@/composables/usePermission'
import { Permission } from '@/types/permission'

const { hasPermission, isAdmin } = usePermission()

// 检查单个权限
const canManagePrinters = hasPermission(Permission.PRINTER_MANAGE)

// 检查是否为管理员
if (isAdmin.value) {
  // 管理员特有逻辑
}
</script>
```

### 3. 使用权限指令

```vue
<template>
  <!-- 单个权限 -->
  <n-button v-permission="Permission.PRINTER_MANAGE">
    管理打印机
  </n-button>

  <!-- 多个权限（任意一个） -->
  <n-button v-permission="[Permission.PRINTER_MANAGE, Permission.PRINTER_SYNC]">
    操作
  </n-button>

  <!-- 多个权限（全部） -->
  <n-button v-permission:all="[Permission.PRINTER_MANAGE, Permission.PRINTER_SYNC]">
    高级操作
  </n-button>

  <!-- 角色指令 -->
  <n-button v-role="UserRole.ADMIN">
    管理员功能
  </n-button>
</template>
```

### 4. 使用权限组件

```vue
<template>
  <!-- 基于权限显示内容 -->
  <PermissionGuard :permission="Permission.PRINTER_MANAGE">
    <n-button>管理打印机</n-button>
    <template #fallback>
      <n-text type="warning">您没有权限执行此操作</n-text>
    </template>
  </PermissionGuard>

  <!-- 基于角色显示内容 -->
  <PermissionGuard :role="UserRole.ADMIN">
    <AdminPanel />
  </PermissionGuard>

  <!-- 需要多个权限 -->
  <PermissionGuard 
    :permission="[Permission.PRINTER_MANAGE, Permission.JOB_CREATE]"
    :require-all="true"
  >
    <AdvancedFeature />
  </PermissionGuard>
</template>

<script setup lang="ts">
import PermissionGuard from '@/components/common/PermissionGuard.vue'
import { Permission, UserRole } from '@/types/permission'
</script>
```

### 5. 在业务逻辑中使用

```typescript
import { usePermission } from '@/composables/usePermission'
import { Permission } from '@/types/permission'

const { checkPermission, hasAnyPermission } = usePermission()

// 检查权限并获取详细结果
const result = checkPermission(Permission.PRINTER_MANAGE)
if (!result.hasPermission) {
  console.log(result.reason) // "没有权限执行此操作"
  return
}

// 检查多个权限
if (hasAnyPermission([Permission.PRINTER_MANAGE, Permission.PRINTER_SYNC])) {
  // 执行操作
}
```

## 最佳实践

1. **路由级别控制**: 对于整个页面的访问控制，使用路由 meta 中的 `permissions` 字段
2. **组件级别控制**: 对于页面内的功能模块，使用 `PermissionGuard` 组件
3. **元素级别控制**: 对于单个按钮或元素，使用 `v-permission` 指令
4. **业务逻辑控制**: 在 TypeScript 代码中，使用 `usePermission` composable

## 注意事项

1. 权限检查只在前端进行，后端 API 也必须进行权限验证
2. 未登录用户没有任何权限
3. 权限指令会隐藏元素（`display: none`），而不是从 DOM 中移除
4. 路由守卫会在用户没有权限时重定向到 dashboard 页面
