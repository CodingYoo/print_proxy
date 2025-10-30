/**
 * 状态转换 Composable
 * 提供平滑的状态转换和动画效果
 */

import { ref, watch, onMounted, nextTick } from 'vue'

export interface TransitionOptions {
  duration?: number
  delay?: number
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  onStart?: () => void
  onEnd?: () => void
}

/**
 * 数值平滑过渡
 * @param initialValue 初始值
 * @param options 配置选项
 */
export function useNumberTransition(initialValue = 0, options: TransitionOptions = {}) {
  const { duration = 1000, easing = 'ease-out' } = options

  const currentValue = ref(initialValue)
  const targetValue = ref(initialValue)
  const isTransitioning = ref(false)

  const easingFunctions = {
    linear: (t: number) => t,
    ease: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'ease-in': (t: number) => t * t,
    'ease-out': (t: number) => t * (2 - t),
    'ease-in-out': (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
  }

  const easingFn = easingFunctions[easing]

  const transitionTo = (newValue: number) => {
    if (isTransitioning.value) return

    targetValue.value = newValue
    isTransitioning.value = true

    const startValue = currentValue.value
    const difference = newValue - startValue
    const startTime = Date.now()

    options.onStart?.()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easingFn(progress)

      currentValue.value = startValue + difference * easedProgress

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isTransitioning.value = false
        options.onEnd?.()
      }
    }

    requestAnimationFrame(animate)
  }

  return {
    currentValue,
    targetValue,
    isTransitioning,
    transitionTo
  }
}

/**
 * 淡入淡出效果
 */
export function useFadeTransition(initialVisible = false) {
  const isVisible = ref(initialVisible)
  const opacity = ref(initialVisible ? 1 : 0)
  const isTransitioning = ref(false)

  const fadeIn = async (duration = 300) => {
    if (isVisible.value) return

    isVisible.value = true
    isTransitioning.value = true

    await nextTick()

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      opacity.value = progress

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isTransitioning.value = false
      }
    }

    requestAnimationFrame(animate)
  }

  const fadeOut = async (duration = 300) => {
    if (!isVisible.value) return

    isTransitioning.value = true

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      opacity.value = 1 - progress

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isVisible.value = false
        isTransitioning.value = false
      }
    }

    requestAnimationFrame(animate)
  }

  const toggle = (duration = 300) => {
    if (isVisible.value) {
      fadeOut(duration)
    } else {
      fadeIn(duration)
    }
  }

  return {
    isVisible,
    opacity,
    isTransitioning,
    fadeIn,
    fadeOut,
    toggle
  }
}

/**
 * 滑动效果
 */
export function useSlideTransition(initialVisible = false, direction: 'up' | 'down' | 'left' | 'right' = 'down') {
  const isVisible = ref(initialVisible)
  const transform = ref(initialVisible ? 'translate(0, 0)' : getInitialTransform())
  const isTransitioning = ref(false)

  function getInitialTransform() {
    switch (direction) {
      case 'up':
        return 'translateY(100%)'
      case 'down':
        return 'translateY(-100%)'
      case 'left':
        return 'translateX(100%)'
      case 'right':
        return 'translateX(-100%)'
    }
  }

  const slideIn = async (duration = 300) => {
    if (isVisible.value) return

    isVisible.value = true
    isTransitioning.value = true

    await nextTick()

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = progress * (2 - progress) // ease-out

      const offset = (1 - easedProgress) * 100

      switch (direction) {
        case 'up':
          transform.value = `translateY(${offset}%)`
          break
        case 'down':
          transform.value = `translateY(-${offset}%)`
          break
        case 'left':
          transform.value = `translateX(${offset}%)`
          break
        case 'right':
          transform.value = `translateX(-${offset}%)`
          break
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        transform.value = 'translate(0, 0)'
        isTransitioning.value = false
      }
    }

    requestAnimationFrame(animate)
  }

  const slideOut = async (duration = 300) => {
    if (!isVisible.value) return

    isTransitioning.value = true

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = progress * progress // ease-in

      const offset = easedProgress * 100

      switch (direction) {
        case 'up':
          transform.value = `translateY(${offset}%)`
          break
        case 'down':
          transform.value = `translateY(-${offset}%)`
          break
        case 'left':
          transform.value = `translateX(${offset}%)`
          break
        case 'right':
          transform.value = `translateX(-${offset}%)`
          break
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isVisible.value = false
        isTransitioning.value = false
      }
    }

    requestAnimationFrame(animate)
  }

  return {
    isVisible,
    transform,
    isTransitioning,
    slideIn,
    slideOut
  }
}

/**
 * 延迟显示（防止闪烁）
 */
export function useDelayedShow(delay = 200) {
  const shouldShow = ref(false)
  const isDelaying = ref(false)
  let timeoutId: number | null = null

  const show = () => {
    if (shouldShow.value) return

    isDelaying.value = true
    timeoutId = window.setTimeout(() => {
      shouldShow.value = true
      isDelaying.value = false
    }, delay)
  }

  const hide = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    shouldShow.value = false
    isDelaying.value = false
  }

  const reset = () => {
    hide()
  }

  return {
    shouldShow,
    isDelaying,
    show,
    hide,
    reset
  }
}

/**
 * 交错动画（列表项依次出现）
 */
export function useStaggeredTransition(itemCount: number, staggerDelay = 50) {
  const visibleItems = ref<Set<number>>(new Set())
  const isAnimating = ref(false)

  const showAll = async () => {
    if (isAnimating.value) return

    isAnimating.value = true
    visibleItems.value.clear()

    for (let i = 0; i < itemCount; i++) {
      await new Promise((resolve) => setTimeout(resolve, staggerDelay))
      visibleItems.value.add(i)
    }

    isAnimating.value = false
  }

  const hideAll = () => {
    visibleItems.value.clear()
    isAnimating.value = false
  }

  const isItemVisible = (index: number) => {
    return visibleItems.value.has(index)
  }

  // 自动开始动画
  onMounted(() => {
    showAll()
  })

  return {
    visibleItems,
    isAnimating,
    showAll,
    hideAll,
    isItemVisible
  }
}
