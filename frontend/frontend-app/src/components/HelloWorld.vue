<script setup lang="ts">
import { NCard, NButton, NSpace } from 'naive-ui'

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="p-8">
    <NCard class="max-w-md mx-auto">
      <template #header>
        <h1 class="text-2xl font-bold text-center">{{ msg }}</h1>
      </template>
      
      <div class="text-center space-y-4">
        <p class="text-gray-600">
          Vue 3 + TypeScript + Naive UI + Tailwind CSS 项目初始化完成！
        </p>
        
        <NSpace justify="center">
          <NButton type="primary">主要按钮</NButton>
          <NButton>默认按钮</NButton>
          <NButton type="success">成功按钮</NButton>
        </NSpace>
        
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-800">
            🎉 恭喜！前端重构项目基础配置已完成
          </p>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>