import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import { Permission, UserRole } from '@/types/permission'
import * as LazyRoutes from './lazy-routes'

// 定义应用路由结构 - 使用懒加载优化
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LazyRoutes.LoginView,
    meta: {
      title: '登录',
      hideInMenu: true
    }
  },
  {
    path: '/',
    redirect: () => {
      // 根据登录状态重定向
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      return token ? '/dashboard' : '/login'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: LazyRoutes.DashboardView,
    meta: {
      title: '总览',
      icon: 'dashboard',
      requiresAuth: true,
      permissions: [] // 所有登录用户都可以访问
    }
  },
  {
    path: '/printers',
    name: 'printers',
    component: LazyRoutes.PrintersView,
    meta: {
      title: '打印机管理',
      icon: 'printer',
      requiresAuth: true,
      permissions: [Permission.PRINTER_VIEW]
    }
  },
  {
    path: '/jobs',
    name: 'jobs',
    component: LazyRoutes.JobsView,
    meta: {
      title: '打印任务',
      icon: 'tasks',
      requiresAuth: true,
      permissions: [Permission.JOB_VIEW]
    }
  },
  {
    path: '/logs',
    name: 'logs',
    component: LazyRoutes.LogsView,
    meta: {
      title: '日志查看',
      icon: 'logs',
      requiresAuth: true,
      permissions: [Permission.LOG_VIEW]
    }
  },
  {
    path: '/api-docs',
    name: 'api-docs',
    component: LazyRoutes.ApiDocsView,
    meta: {
      title: 'API 文档',
      icon: 'api',
      requiresAuth: true,
      permissions: [Permission.API_DOCS_VIEW]
    }
  },
  {
    path: '/demo',
    name: 'demo',
    component: LazyRoutes.ComponentDemo,
    meta: {
      title: '组件演示',
      icon: 'demo',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: LazyRoutes.HomeView,
    meta: {
      title: '页面未找到',
      hideInMenu: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 路由守卫和权限控制
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const { hasAnyPermission } = usePermission()
  
  // 检查是否需要认证
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) {
      // 未登录，重定向到登录页
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }
    
    // 检查权限
    const permissions = to.meta.permissions as Permission[] | undefined
    if (permissions && permissions.length > 0) {
      // 需要特定权限
      if (!hasAnyPermission(permissions)) {
        // 没有权限，显示403页面或重定向
        console.warn(`Access denied to ${to.path}: missing required permissions`)
        next({
          name: 'dashboard',
          query: { error: 'no_permission' }
        })
        return
      }
    }
  }

  // 如果已登录用户访问登录页，重定向到首页
  if (to.name === 'login') {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (token) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

// 路由后置守卫，设置页面标题
router.afterEach((to) => {
  const title = to.meta?.title
  if (title) {
    document.title = `${title} - 打印代理服务`
  } else {
    document.title = '打印代理服务'
  }
})

// 路由准备就绪后预加载关键路由
router.isReady().then(() => {
  LazyRoutes.preloadCriticalRoutes()
})

export default router
