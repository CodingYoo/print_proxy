/**
 * 路由懒加载配置
 * 集中管理所有路由的懒加载逻辑
 */

import type { Component } from 'vue'

// 视图组件懒加载
export const LoginView = () => import('@/views/LoginView.vue')
export const HomeView = () => import('@/views/HomeView.vue')
export const DashboardView = () => import('@/views/DashboardView.vue')
export const PrintersView = () => import('@/views/PrintersView.vue')
export const JobsView = () => import('@/views/JobsView.vue')
export const LogsView = () => import('@/views/LogsView.vue')
export const ApiDocsView = () => import('@/views/ApiDocsView.vue')
export const ComponentDemo = () => import('@/views/ComponentDemo.vue')

// 预加载关键路由
export function preloadCriticalRoutes(): void {
  // 在应用启动后预加载常用页面
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      DashboardView()
      PrintersView()
      JobsView()
    })
  } else {
    setTimeout(() => {
      DashboardView()
      PrintersView()
      JobsView()
    }, 2000)
  }
}

// 根据用户权限预加载路由
export function preloadRoutesByPermissions(permissions: string[]): void {
  const routeLoaders: Array<() => Promise<Component>> = []

  if (permissions.includes('printer:view')) {
    routeLoaders.push(PrintersView)
  }
  if (permissions.includes('job:view')) {
    routeLoaders.push(JobsView)
  }
  if (permissions.includes('log:view')) {
    routeLoaders.push(LogsView)
  }
  if (permissions.includes('api_docs:view')) {
    routeLoaders.push(ApiDocsView)
  }

  // 批量预加载
  if ('requestIdleCallback' in window) {
    routeLoaders.forEach((loader) => {
      requestIdleCallback(() => loader())
    })
  }
}
