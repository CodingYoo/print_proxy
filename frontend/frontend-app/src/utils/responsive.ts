/**
 * 响应式工具函数
 * 提供响应式设计相关的辅助功能
 */

import { BREAKPOINTS } from '@/composables/useResponsive'

/**
 * 获取当前设备类型
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.mobile) {
    return 'mobile'
  } else if (width < BREAKPOINTS.desktop) {
    return 'tablet'
  } else {
    return 'desktop'
  }
}

/**
 * 判断是否为移动设备
 */
export function isMobileDevice(): boolean {
  return window.innerWidth < BREAKPOINTS.mobile
}

/**
 * 判断是否为平板设备
 */
export function isTabletDevice(): boolean {
  const width = window.innerWidth
  return width >= BREAKPOINTS.mobile && width < BREAKPOINTS.desktop
}

/**
 * 判断是否为桌面设备
 */
export function isDesktopDevice(): boolean {
  return window.innerWidth >= BREAKPOINTS.desktop
}

/**
 * 判断是否为触摸设备
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * 获取响应式列数
 * @param mobile 移动端列数
 * @param tablet 平板端列数
 * @param desktop 桌面端列数
 */
export function getResponsiveColumns(
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 4
): number {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return mobile
    case 'tablet':
      return tablet
    case 'desktop':
      return desktop
    default:
      return desktop
  }
}

/**
 * 获取响应式间距
 * @param mobile 移动端间距
 * @param tablet 平板端间距
 * @param desktop 桌面端间距
 */
export function getResponsiveSpacing(
  mobile: number = 12,
  tablet: number = 16,
  desktop: number = 24
): number {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return mobile
    case 'tablet':
      return tablet
    case 'desktop':
      return desktop
    default:
      return desktop
  }
}

/**
 * 获取响应式字体大小
 * @param mobile 移动端字体大小
 * @param tablet 平板端字体大小
 * @param desktop 桌面端字体大小
 */
export function getResponsiveFontSize(
  mobile: number = 14,
  tablet: number = 15,
  desktop: number = 16
): number {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return mobile
    case 'tablet':
      return tablet
    case 'desktop':
      return desktop
    default:
      return desktop
  }
}

/**
 * 获取响应式按钮尺寸
 */
export function getResponsiveButtonSize(): 'small' | 'medium' | 'large' {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return isTouchDevice() ? 'large' : 'medium'
    case 'tablet':
      return 'medium'
    case 'desktop':
      return 'medium'
    default:
      return 'medium'
  }
}

/**
 * 获取响应式表格分页大小
 */
export function getResponsivePageSize(): number {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return 10
    case 'tablet':
      return 15
    case 'desktop':
      return 20
    default:
      return 20
  }
}

/**
 * 获取响应式模态框宽度
 */
export function getResponsiveModalWidth(): string | number {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return '90vw'
    case 'tablet':
      return '80vw'
    case 'desktop':
      return 800
    default:
      return 800
  }
}

/**
 * 根据设备类型执行不同的回调
 */
export function executeByDevice<T>(callbacks: {
  mobile?: () => T
  tablet?: () => T
  desktop?: () => T
  default?: () => T
}): T | undefined {
  const deviceType = getDeviceType()
  
  const callback = callbacks[deviceType] || callbacks.default
  return callback?.()
}

/**
 * 防抖函数（用于窗口大小变化事件）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 150
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    const context = this
    
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

/**
 * 节流函数（用于滚动事件）
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 150
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function (this: any, ...args: Parameters<T>) {
    const context = this
    
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * 媒体查询监听器
 */
export class MediaQueryListener {
  private listeners: Map<string, ((matches: boolean) => void)[]> = new Map()
  private mediaQueries: Map<string, MediaQueryList> = new Map()
  
  /**
   * 添加媒体查询监听
   */
  addListener(query: string, callback: (matches: boolean) => void): void {
    if (!this.mediaQueries.has(query)) {
      const mq = window.matchMedia(query)
      this.mediaQueries.set(query, mq)
      
      const handler = (e: MediaQueryListEvent) => {
        const callbacks = this.listeners.get(query) || []
        callbacks.forEach(cb => cb(e.matches))
      }
      
      mq.addEventListener('change', handler)
    }
    
    const callbacks = this.listeners.get(query) || []
    callbacks.push(callback)
    this.listeners.set(query, callbacks)
    
    // 立即执行一次回调
    const mq = this.mediaQueries.get(query)!
    callback(mq.matches)
  }
  
  /**
   * 移除媒体查询监听
   */
  removeListener(query: string, callback: (matches: boolean) => void): void {
    const callbacks = this.listeners.get(query) || []
    const index = callbacks.indexOf(callback)
    
    if (index > -1) {
      callbacks.splice(index, 1)
      this.listeners.set(query, callbacks)
    }
  }
  
  /**
   * 清除所有监听
   */
  clear(): void {
    this.listeners.clear()
    this.mediaQueries.clear()
  }
}

/**
 * 创建媒体查询监听器实例
 */
export const mediaQueryListener = new MediaQueryListener()
