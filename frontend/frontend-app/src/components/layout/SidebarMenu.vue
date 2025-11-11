<template>
  <div class="h-full flex flex-col sidebar-container">
    <!-- Logo 区域 -->
    <div class="logo-area">
      <div v-if="!collapsed" class="logo-expanded">
        <div class="logo-circle">
          <span class="logo-text">P</span>
        </div>
        <div class="logo-info">
          <h2 class="logo-title">Print Proxy Service</h2>
          <p class="logo-subtitle">Print Proxy Service</p>
        </div>
      </div>
      <div v-else class="logo-collapsed">
        <div class="logo-circle-small">
          <span class="logo-text-small">P</span>
        </div>
      </div>
    </div>

    <!-- 菜单项 -->
    <div class="flex-1 py-4 overflow-y-auto menu-container">
      <n-menu
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        :options="menuOptions"
        :value="activeKey"
        :indent="isMobile ? 16 : 24"
        @update:value="handleMenuSelect"
      />
    </div>

    <!-- 底部信息 -->
    <div v-if="!collapsed" class="sidebar-footer">
      <div class="footer-user">
        <div class="user-avatar">
          <n-icon size="16" color="#ffffff">
            <UserIcon />
          </n-icon>
        </div>
        <div class="user-info">
          <p class="user-name">{{ currentUser }}</p>
          <n-button text size="tiny" class="logout-btn" @click="handleLogout">
            logout 退出登录
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon, useMessage } from 'naive-ui'
import {
  DashboardOutlined as DashboardIcon,
  PrinterOutlined as PrinterIcon,
  FileTextOutlined as JobsIcon,
  UnorderedListOutlined as LogsIcon,
  ApiOutlined as ApiIcon,
  UserOutlined as UserIcon
} from '@vicons/antd'
import { useAuthStore } from '@/stores/auth'

interface Props {
  collapsed: boolean
  isMobile?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMobile: false
})

const emit = defineEmits<{
  menuClick: []
}>()

const router = useRouter()
const route = useRoute()
const message = useMessage()
const authStore = useAuthStore()

// 当前激活的菜单项
const activeKey = computed(() => route.name as string)

// 当前用户
const currentUser = computed(() => authStore.user?.username || 'System Administrator')

// 渲染图标的辅助函数
const renderIcon = (icon: any) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 菜单选项
const menuOptions = computed(() => [
  {
    label: '总览',
    key: 'dashboard',
    icon: renderIcon(DashboardIcon)
  },
  {
    label: '打印机管理',
    key: 'printers',
    icon: renderIcon(PrinterIcon)
  },
  {
    label: '打印任务',
    key: 'jobs',
    icon: renderIcon(JobsIcon)
  },
  {
    label: '日志中心',
    key: 'logs',
    icon: renderIcon(LogsIcon)
  },
  {
    label: 'API 接口',
    key: 'api-docs',
    icon: renderIcon(ApiIcon)
  }
])

// 处理菜单选择
const handleMenuSelect = (key: string) => {
  router.push({ name: key })
  emit('menuClick')
}

// 处理登出
const handleLogout = async () => {
  try {
    await authStore.logout()
    message.success('已退出登录')
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Logout error:', error)
    message.error('退出登录失败')
  }
}
</script>

<style scoped>
.sidebar-container {
  background: #0f1419;
  background: linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%);
}

/* Logo 区域样式 */
.logo-area {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.logo-expanded {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 0 8px;
}

.logo-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #4285f4;
  line-height: 1;
}

.logo-circle-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text-small {
  font-size: 18px;
  font-weight: 600;
  color: #4285f4;
  line-height: 1;
}

.logo-info {
  flex: 1;
  min-width: 0;
}

.logo-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaed;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.3px;
}

.logo-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin: 3px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 菜单容器 */
.menu-container {
  background: transparent;
  padding-top: 8px;
}

/* 底部用户信息 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.footer-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4285f4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #e8eaed;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  padding: 0;
  height: auto;
  margin: 0;
  font-weight: 400;
}

.logout-btn:hover {
  color: #4285f4;
  text-decoration: underline;
}

/* 菜单项样式 */
:deep(.n-menu) {
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
}

:deep(.n-menu-item-content) {
  @apply transition-all duration-200;
  min-height: 48px;
  color: rgba(255, 255, 255, 0.75);
  border-radius: 0;
  margin: 0;
  padding-left: 24px !important;
  padding-right: 24px !important;
  font-size: 14px;
}

:deep(.n-menu-item-content:hover) {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

:deep(.n-menu-item-content--selected) {
  background: rgba(66, 133, 244, 0.15);
  color: #4285f4;
  font-weight: 500;
}

:deep(.n-menu-item-content--selected::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #4285f4;
}

:deep(.n-menu-item-content__icon) {
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
}

:deep(.n-menu-item-content--selected .n-menu-item-content__icon) {
  color: #4285f4;
}

:deep(.n-menu-item-content:hover .n-menu-item-content__icon) {
  color: rgba(255, 255, 255, 0.9);
}

:deep(.n-menu-divider) {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 移动端菜单项优化 */
@media (max-width: 768px) {
  :deep(.n-menu-item-content) {
    padding: 12px 16px;
    font-size: 16px;
  }
  
  :deep(.n-menu-item-content__icon) {
    font-size: 20px;
  }
}
</style>