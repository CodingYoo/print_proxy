<script setup lang="ts">
import { onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { setMessageInstance } from '@/api/client'

// 在 NMessageProvider 内部设置消息实例
onMounted(() => {
  const message = useMessage()
  setMessageInstance(message)
})
</script>

<template>
  <slot />
</template>
