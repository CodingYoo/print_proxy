import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * 响应式断点定义
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const

/**
 * 响应式设计组合式函数
 * 提供屏幕尺寸检测和响应式状态管理
 */
export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  // 设备类型判断
  const isMobile = computed(() => windowWidth.value < BREAKPOINTS.mobile)
  const isTablet = computed(() => 
    windowWidth.value >= BREAKPOINTS.mobile && 
    windowWidth.value < BREAKPOINTS.desktop
  )
  const isDesktop = computed(() => windowWidth.value >= BREAKPOINTS.desktop)

  // 更细粒度的断点
  const isSmallMobile = computed(() => windowWidth.value < 640)
  const isLargeMobile = computed(() => 
    windowWidth.value >= 640 && 
    windowWidth.value < BREAKPOINTS.mobile
  )
  const isSmallTablet = computed(() => 
    windowWidth.value >= BREAKPOINTS.mobile && 
    windowWidth.value < BREAKPOINTS.tablet
  )
  const isLargeTablet = computed(() => 
    windowWidth.value >= BREAKPOINTS.tablet && 
    windowWidth.value < BREAKPOINTS.desktop
  )

  // 屏幕方向
  const isPortrait = computed(() => windowHeight.value > windowWidth.value)
  const isLandscape = computed(() => windowWidth.value >= windowHeight.value)

  // 触摸设备检测
  const isTouchDevice = computed(() => 
    'ontouchstart' in window || navigator.maxTouchPoints > 0
  )

  // 窗口大小变化处理
  const handleResize = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  // 生命周期管理
  onMounted(() => {
    window.addEventListener('resize', handleResize)
    handleResize() // 初始化
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    // 窗口尺寸
    windowWidth,
    windowHeight,
    
    // 设备类型
    isMobile,
    isTablet,
    isDesktop,
    
    // 细粒度断点
    isSmallMobile,
    isLargeMobile,
    isSmallTablet,
    isLargeTablet,
    
    // 屏幕方向
    isPortrait,
    isLandscape,
    
    // 触摸设备
    isTouchDevice,
    
    // 断点常量
    breakpoints: BREAKPOINTS
  }
}
