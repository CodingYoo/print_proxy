<template>
  <div class="flex items-center justify-center min-h-96">
    <div class="text-center">
      <h2 class="text-2xl font-semibold text-gray-600 mb-4">{{ title }}</h2>
      <p class="text-gray-500">此页面正在开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

defineProps<Props>()
</script>