<script setup lang="ts">
import { onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, NNotificationProvider, NDialogProvider, NLoadingBarProvider, useMessage } from 'naive-ui'
import { setMessageInstance } from '@/api/client'
import PageTransition from '@/components/transitions/PageTransition.vue'

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
              <!-- 使用页面切换动画包裹路由视图 -->
              <RouterView v-slot="{ Component, route }">
                <PageTransition :name="route.meta.transition || 'fade'" mode="out-in">
                  <component :is="Component" :key="route.path" />
                </PageTransition>
              </RouterView>
            </div>
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped></style>
