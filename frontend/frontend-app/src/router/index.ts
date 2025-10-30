import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 定义应用路由结构
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
    meta: {
      title: '登录',
      hideInMenu: true
    }
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
    meta: {
      title: '总览',
      icon: 'dashboard',
      requiresAuth: true
    }
  },
  {
    path: '/printers',
    name: 'printers',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
    meta: {
      title: '打印机管理',
      icon: 'printer',
      requiresAuth: true
    }
  },
  {
    path: '/jobs',
    name: 'jobs',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
    meta: {
      title: '打印任务',
      icon: 'tasks',
      requiresAuth: true
    }
  },
  {
    path: '/logs',
    name: 'logs',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
    meta: {
      title: '日志查看',
      icon: 'logs',
      requiresAuth: true
    }
  },
  {
    path: '/api-docs',
    name: 'api-docs',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
    meta: {
      title: 'API 文档',
      icon: 'api',
      requiresAuth: true
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/HomeView.vue'), // 暂时使用现有组件
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
router.beforeEach((to, from, next) => {
  // 检查是否需要认证
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      // 未登录，重定向到登录页
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 如果已登录用户访问登录页，重定向到首页
  if (to.name === 'login') {
    const token = localStorage.getItem('auth_token')
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

export default router
