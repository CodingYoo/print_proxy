<template>
  <div class="h-full flex flex-col">
    <!-- Logo 区域 -->
    <div class="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
      <div v-if="!collapsed" class="flex items-center space-x-2">
        <n-icon size="24" color="#18a058">
          <PrinterIcon />
        </n-icon>
        <span class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          打印代理
        </span>
      </div>
      <div v-else class="flex items-center justify-center">
        <n-icon size="24" color="#18a058">
          <PrinterIcon />
        </n-icon>
      </div>
    </div>

    <!-- 菜单项 -->
    <div class="flex-1 py-4 overflow-y-auto">
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
    <div v-if="!collapsed" class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center">
        版本 v1.0.0
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon } from 'naive-ui'
import {
  DashboardOutlined as DashboardIcon,
  PrinterOutlined as PrinterIcon,
  FileTextOutlined as JobsIcon,
  UnorderedListOutlined as LogsIcon,
  ApiOutlined as ApiIcon,
  SettingOutlined as SettingsIcon
} from '@vicons/antd'

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

// 当前激活的菜单项
const activeKey = computed(() => route.name as string)

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
    label: '日志查看',
    key: 'logs',
    icon: renderIcon(LogsIcon)
  },
  {
    label: 'API 文档',
    key: 'api-docs',
    icon: renderIcon(ApiIcon)
  },
  {
    type: 'divider'
  },
  {
    label: '设置',
    key: 'settings',
    icon: renderIcon(SettingsIcon)
  }
])

// 处理菜单选择
const handleMenuSelect = (key: string) => {
  router.push({ name: key })
  emit('menuClick')
}
</script>

<style scoped>
:deep(.n-menu-item-content) {
  @apply transition-colors duration-200;
  /* 移动端增加触摸目标尺寸 */
  min-height: 44px;
}

:deep(.n-menu-item-content:hover) {
  @apply bg-gray-100 dark:bg-gray-800;
}

:deep(.n-menu-item-content--selected) {
  @apply bg-green-50 dark:bg-green-900/20;
}

:deep(.n-menu-item-content--selected .n-menu-item-content__icon) {
  @apply text-green-600 dark:text-green-400;
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