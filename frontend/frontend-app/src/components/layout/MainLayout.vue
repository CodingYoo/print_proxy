<template>
  <n-config-provider :theme="theme">
    <n-layout has-sider class="min-h-screen">
      <!-- 侧边栏 -->
      <n-layout-sider
        :collapsed="collapsed"
        :collapsed-width="64"
        :width="280"
        :show-trigger="!isMobile"
        collapse-mode="width"
        bordered
        class="sidebar-responsive"
      >
        <SidebarMenu :collapsed="collapsed" />
      </n-layout-sider>

      <!-- 移动端抽屉菜单 -->
      <n-drawer
        v-model:show="showMobileMenu"
        :width="280"
        placement="left"
        class="md:hidden"
        :trap-focus="false"
        :block-scroll="true"
      >
        <n-drawer-content 
          title="菜单" 
          :native-scrollbar="false"
          body-content-style="padding: 0;"
        >
          <SidebarMenu 
            :collapsed="false" 
            :is-mobile="true"
            @menu-click="showMobileMenu = false" 
          />
        </n-drawer-content>
      </n-drawer>

      <n-layout>
        <!-- 顶部导航 -->
        <n-layout-header bordered class="h-16 flex items-center px-4">
          <TopNavigation 
            :collapsed="collapsed"
            :is-mobile="isMobile"
            :is-touch-device="isTouchDevice"
            @toggle-sidebar="toggleSidebar"
            @toggle-mobile-menu="toggleMobileMenu"
          />
        </n-layout-header>

        <!-- 主内容区域 -->
        <n-layout-content 
          class="p-3 sm:p-4 md:p-6 lg:p-8"
          :class="{ 'touch-friendly': isTouchDevice }"
        >
          <div class="max-w-7xl mx-auto">
            <router-view />
          </div>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import SidebarMenu from './SidebarMenu.vue'
import TopNavigation from './TopNavigation.vue'
import { useResponsive } from '@/composables/useResponsive'

// 使用响应式组合函数
const { isMobile, isTablet, isDesktop, isTouchDevice } = useResponsive()

// 响应式状态
const collapsed = ref(false)
const showMobileMenu = ref(false)
const theme = computed(() => null) // 可以后续添加主题切换功能

// 切换侧边栏
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

// 切换移动端菜单
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

// 监听设备类型变化，自动调整布局
watch([isMobile, isDesktop], ([mobile, desktop]) => {
  // 移动端自动关闭抽屉菜单
  if (!mobile) {
    showMobileMenu.value = false
  }
  
  // 桌面端自动展开侧边栏
  if (desktop && collapsed.value) {
    collapsed.value = false
  }
  
  // 平板端默认折叠侧边栏
  if (isTablet.value && !collapsed.value) {
    collapsed.value = true
  }
})
</script>

<style scoped>
.sidebar-responsive {
  @apply hidden md:flex md:flex-col;
}

@media (max-width: 768px) {
  .n-layout-sider {
    display: none !important;
  }
}

/* 触摸友好的交互 */
.touch-friendly {
  /* 增加触摸目标的最小尺寸 */
  --min-touch-target: 44px;
}

.touch-friendly :deep(button),
.touch-friendly :deep(.n-button) {
  min-height: var(--min-touch-target);
  min-width: var(--min-touch-target);
}

/* 移动端优化滚动 */
@media (max-width: 768px) {
  .n-layout-content {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
}
</style>