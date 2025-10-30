<script setup lang="ts">
import { onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, NNotificationProvider, NDialogProvider, NLoadingBarProvider, useMessage } from 'naive-ui'
import { setMessageInstance } from '@/api/client'

// 在组件挂载后设置消息实例
onMounted(() => {
  const message = useMessage()
  setMessageInstance(message)
})
</script>

<template>
  <NConfigProvider>
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <div id="app" class="min-h-screen bg-gray-50">
              <RouterView />
            </div>
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped></style>
