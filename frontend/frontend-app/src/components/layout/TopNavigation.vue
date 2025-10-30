<template>
  <div class="w-full flex items-center justify-between">
    <!-- 左侧：菜单切换按钮 -->
    <div class="flex items-center space-x-4">
      <!-- 移动端菜单按钮 -->
      <n-button
        v-if="isMobile"
        quaternary
        :circle="!isTouchDevice"
        :size="isTouchDevice ? 'large' : 'medium'"
        class="mobile-menu-btn"
        @click="$emit('toggleMobileMenu')"
      >
        <template #icon>
          <n-icon :size="isTouchDevice ? 24 : 20">
            <MenuOutlined />
          </n-icon>
        </template>
      </n-button>

      <!-- 桌面端侧边栏切换按钮 -->
      <n-button
        v-else
        quaternary
        circle
        @click="$emit('toggleSidebar')"
      >
        <template #icon>
          <n-icon size="20">
            <MenuFoldOutlined v-if="!collapsed" />
            <MenuUnfoldOutlined v-else />
          </n-icon>
        </template>
      </n-button>

      <!-- 面包屑导航 -->
      <n-breadcrumb v-if="!isMobile">
        <n-breadcrumb-item
          v-for="item in breadcrumbItems"
          :key="item.name"
          :clickable="item.clickable"
          @click="item.clickable && $router.push({ name: item.name })"
        >
          {{ item.label }}
        </n-breadcrumb-item>
      </n-breadcrumb>
    </div>

    <!-- 右侧：用户信息和操作 -->
    <div class="flex items-center space-x-3">
      <!-- 刷新按钮 -->
      <n-button
        v-if="!isMobile"
        quaternary
        circle
        :loading="refreshing"
        @click="handleRefresh"
      >
        <template #icon>
          <n-icon size="18">
            <ReloadOutlined />
          </n-icon>
        </template>
      </n-button>

      <!-- 通知按钮 -->
      <n-badge v-if="!isMobile" :value="notificationCount" :max="99">
        <n-button quaternary circle>
          <template #icon>
            <n-icon size="18">
              <BellOutlined />
            </n-icon>
          </template>
        </n-button>
      </n-badge>

      <!-- 用户下拉菜单 -->
      <n-dropdown
        :options="userMenuOptions"
        :trigger="isTouchDevice ? 'click' : 'hover'"
        @select="handleUserMenuSelect"
      >
        <div 
          class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          :class="isTouchDevice ? 'px-2 py-2' : 'px-3 py-2'"
        >
          <n-avatar
            round
            :size="isMobile ? 'medium' : 'small'"
            :src="(userInfo as any)?.avatar"
            :fallback-src="defaultAvatar"
          >
            {{ (userInfo as any)?.name?.charAt(0) || userInfo?.username?.charAt(0) || 'U' }}
          </n-avatar>
          <span v-if="!isMobile" class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ (userInfo as any)?.name || userInfo?.username || '用户' }}
          </span>
          <n-icon v-if="!isMobile" size="14" class="text-gray-500">
            <DownOutlined />
          </n-icon>
        </div>
      </n-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage, NIcon } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'
import {
  MenuOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  BellOutlined,
  DownOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@vicons/antd'

interface Props {
  collapsed: boolean
  isMobile: boolean
  isTouchDevice?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTouchDevice: false
})
const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileMenu: []
}>()

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

// 状态
const refreshing = ref(false)
const notificationCount = ref(0)
const defaultAvatar = '/default-avatar.png'

// 用户信息
const userInfo = computed(() => authStore.user)

// 面包屑导航
const breadcrumbItems = computed(() => {
  const items = []
  
  // 根据当前路由生成面包屑
  switch (route.name) {
    case 'dashboard':
      items.push({ name: 'dashboard', label: '总览', clickable: false })
      break
    case 'printers':
      items.push({ name: 'printers', label: '打印机管理', clickable: false })
      break
    case 'jobs':
      items.push({ name: 'jobs', label: '打印任务', clickable: false })
      break
    case 'logs':
      items.push({ name: 'logs', label: '日志查看', clickable: false })
      break
    case 'api-docs':
      items.push({ name: 'api-docs', label: 'API 文档', clickable: false })
      break
    case 'settings':
      items.push({ name: 'settings', label: '设置', clickable: false })
      break
    default:
      items.push({ name: 'dashboard', label: '总览', clickable: true })
  }
  
  return items
})

// 用户菜单选项
const userMenuOptions = computed(() => [
  {
    label: '个人资料',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(UserOutlined) })
  },
  {
    label: '设置',
    key: 'settings',
    icon: () => h(NIcon, null, { default: () => h(SettingOutlined) })
  },
  {
    type: 'divider'
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogoutOutlined) })
  }
])

// 刷新页面
const handleRefresh = async () => {
  refreshing.value = true
  try {
    // 这里可以添加刷新当前页面数据的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟刷新
    message.success('刷新成功')
  } catch (error) {
    message.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// 处理用户菜单选择
const handleUserMenuSelect = (key: string) => {
  switch (key) {
    case 'profile':
      // 跳转到个人资料页面
      message.info('个人资料功能开发中')
      break
    case 'settings':
      router.push({ name: 'settings' })
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await authStore.logout()
    message.success('已退出登录')
    router.push({ name: 'login' })
  } catch (error) {
    message.error('退出登录失败')
  }
}
</script>

<style scoped>
.n-breadcrumb {
  @apply text-sm;
}

:deep(.n-breadcrumb-item__link) {
  @apply text-gray-600 dark:text-gray-400;
}

:deep(.n-breadcrumb-item__link:hover) {
  @apply text-green-600 dark:text-green-400;
}

/* 移动端菜单按钮优化 */
.mobile-menu-btn {
  min-width: 44px;
  min-height: 44px;
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 增加触摸目标尺寸 */
  :deep(.n-button) {
    min-width: 44px;
    min-height: 44px;
  }
  
  /* 增加下拉菜单项的触摸目标 */
  :deep(.n-dropdown-option) {
    min-height: 44px;
    padding: 12px 16px;
  }
}
</style>