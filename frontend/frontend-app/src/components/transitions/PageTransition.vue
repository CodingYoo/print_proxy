<template>
  <transition
    :name="transitionName"
    :mode="mode"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  name?: 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom'
  mode?: 'in-out' | 'out-in' | 'default'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  name: 'fade',
  mode: 'out-in',
  duration: 300
})

const emit = defineEmits<{
  beforeEnter: []
  enter: []
  afterEnter: []
  beforeLeave: []
  leave: []
  afterLeave: []
}>()

const route = useRoute()
const transitionName = ref(props.name)

// 根据路由变化动态调整过渡效果
watch(
  () => route.path,
  (to, from) => {
    // 可以根据路由深度或其他逻辑动态改变过渡方向
    if (from && to) {
      const toDepth = to.split('/').length
      const fromDepth = from.split('/').length
      transitionName.value = toDepth > fromDepth ? 'slide-left' : 'slide-right'
    }
  }
)

const onBeforeEnter = () => emit('beforeEnter')
const onEnter = () => emit('enter')
const onAfterEnter = () => emit('afterEnter')
const onBeforeLeave = () => emit('beforeLeave')
const onLeave = () => emit('leave')
const onAfterLeave = () => emit('afterLeave')
</script>

<style scoped>
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 左滑 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 右滑 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 上滑 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* 下滑 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* 缩放 */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.3s ease;
}

.zoom-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.zoom-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
