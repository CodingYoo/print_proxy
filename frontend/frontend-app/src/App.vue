<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NNotificationProvider, NDialogProvider, NLoadingBarProvider } from 'naive-ui'
import PageTransition from '@/components/transitions/PageTransition.vue'
import MessageSetup from '@/components/MessageSetup.vue'
</script>

<template>
  <NConfigProvider>
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <MessageSetup>
              <div id="app" class="min-h-screen bg-gray-50">
                <!-- 使用页面切换动画包裹路由视图 -->
                <RouterView v-slot="{ Component, route }">
                  <PageTransition :name="(route.meta.transition as any) || 'fade'" mode="out-in">
                    <component :is="Component" :key="route.path" />
                  </PageTransition>
                </RouterView>
              </div>
            </MessageSetup>
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>

<style scoped></style>
