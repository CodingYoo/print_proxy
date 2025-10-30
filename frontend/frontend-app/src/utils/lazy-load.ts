/**
 * 懒加载工具函数
 * 用于优化组件和模块的按需加载
 */

import type { Component } from 'vue'

/**
 * 延迟加载组件，带有加载状态
 * @param loader 组件加载函数
 * @param delay 延迟时间（毫秒）
 */
export function lazyLoadComponent(
  loader: () => Promise<Component>,
  delay = 200
): () => Promise<Component> {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        loader().then(resolve)
      }, delay)
    })
}

/**
 * 预加载组件
 * @param loader 组件加载函数
 */
export function preloadComponent(loader: () => Promise<Component>): void {
  loader()
}

/**
 * 批量预加载组件
 * @param loaders 组件加载函数数组
 */
export function preloadComponents(loaders: Array<() => Promise<Component>>): void {
  loaders.forEach((loader) => {
    // 使用 requestIdleCallback 在浏览器空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loader())
    } else {
      // 降级方案：使用 setTimeout
      setTimeout(() => loader(), 1)
    }
  })
}

/**
 * 动态导入第三方库
 * @param moduleName 模块名称
 */
export async function lazyLoadModule<T = any>(moduleName: string): Promise<T> {
  try {
    const module = await import(/* @vite-ignore */ moduleName)
    return module.default || module
  } catch (error) {
    console.error(`Failed to load module: ${moduleName}`, error)
    throw error
  }
}

/**
 * 条件懒加载：根据条件决定是否加载组件
 * @param condition 条件函数
 * @param loader 组件加载函数
 */
export function conditionalLazyLoad(
  condition: () => boolean,
  loader: () => Promise<Component>
): () => Promise<Component> {
  return () => {
    if (condition()) {
      return loader()
    }
    // 返回一个空组件
    return Promise.resolve({
      template: '<div></div>'
    } as Component)
  }
}
