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
      >
        <n-drawer-content title="菜单" :native-scrollbar="false">
          <SidebarMenu :collapsed="false" @menu-click="showMobileMenu = false" />
        </n-drawer-content>
      </n-drawer>

      <n-layout>
        <!-- 顶部导航 -->
        <n-layout-header bordered class="h-16 flex items-center px-4">
          <TopNavigation 
            :collapsed="collapsed"
            :is-mobile="isMobile"
            @toggle-sidebar="toggleSidebar"
            @toggle-mobile-menu="showMobileMenu = !showMobileMenu"
          />
        </n-layout-header>

        <!-- 主内容区域 -->
        <n-layout-content class="p-4 md:p-6">
          <div class="max-w-7xl mx-auto">
            <router-view />
          </div>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { darkTheme } from 'naive-ui'
import SidebarMenu from './SidebarMenu.vue'
import TopNavigation from './TopNavigation.vue'

// 响应式状态
const collapsed = ref(false)
const showMobileMenu = ref(false)
const windowWidth = ref(window.innerWidth)

// 计算属性
const isMobile = computed(() => windowWidth.value < 768)
const theme = computed(() => null) // 可以后续添加主题切换功能

// 切换侧边栏
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
}

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
  
  // 移动端自动关闭抽屉菜单
  if (!isMobile.value) {
    showMobileMenu.value = false
  }
  
  // 桌面端自动展开侧边栏
  if (windowWidth.value > 1024 && collapsed.value) {
    collapsed.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // 初始化
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
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
</style>