<template>
  <div v-if="show" class="loading-indicator" :class="[`loading-${type}`, `loading-${size}`]">
    <n-spin v-if="type === 'spinner'" :size="spinSize" :description="description" />
    
    <div v-else-if="type === 'bar'" class="loading-bar">
      <n-progress
        type="line"
        :percentage="percentage"
        :show-indicator="showPercentage"
        :status="status"
      />
      <p v-if="description" class="loading-description">{{ description }}</p>
    </div>
    
    <div v-else-if="type === 'dots'" class="loading-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
      <p v-if="description" class="loading-description">{{ description }}</p>
    </div>
    
    <div v-else-if="type === 'pulse'" class="loading-pulse">
      <div class="pulse-circle"></div>
      <p v-if="description" class="loading-description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NSpin, NProgress } from 'naive-ui'

interface Props {
  show?: boolean
  type?: 'spinner' | 'bar' | 'dots' | 'pulse'
  size?: 'small' | 'medium' | 'large'
  description?: string
  percentage?: number
  showPercentage?: boolean
  status?: 'default' | 'success' | 'error' | 'warning' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  type: 'spinner',
  size: 'medium',
  percentage: 0,
  showPercentage: false,
  status: 'default'
})

const spinSize = computed(() => {
  const sizeMap = {
    small: 'small',
    medium: 'medium',
    large: 'large'
  }
  return sizeMap[props.size] as 'small' | 'medium' | 'large'
})
</script>

<style scoped>
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-small {
  padding: 10px;
}

.loading-large {
  padding: 40px;
}

.loading-description {
  margin-top: 12px;
  color: var(--n-text-color-2);
  font-size: 14px;
  text-align: center;
}

/* 进度条样式 */
.loading-bar {
  width: 100%;
  max-width: 400px;
}

/* 点状加载动画 */
.loading-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--n-color-primary);
  animation: dot-pulse 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes dot-pulse {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 脉冲加载动画 */
.loading-pulse {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pulse-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: var(--n-color-primary);
  animation: pulse 1.5s infinite ease-in-out;
}

.loading-small .pulse-circle {
  width: 40px;
  height: 40px;
}

.loading-large .pulse-circle {
  width: 80px;
  height: 80px;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
}
</style>
