<template>
  <div class="api-docs-view max-w-7xl mx-auto">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">API 文档</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">打印代理服务 RESTful API 接口文档</p>
    </div>

    <!-- API 概览 -->
    <n-card class="mb-6">
      <h2 class="text-lg font-semibold mb-4">API 概览</h2>
      <div class="space-y-2 text-sm">
        <div class="flex">
          <span class="w-24 text-gray-600 dark:text-gray-400">基础 URL:</span>
          <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{ baseUrl }}</code>
        </div>
        <div class="flex">
          <span class="w-24 text-gray-600 dark:text-gray-400">版本:</span>
          <span>v1.0</span>
        </div>
        <div class="flex">
          <span class="w-24 text-gray-600 dark:text-gray-400">认证:</span>
          <span>Bearer Token (JWT)</span>
        </div>
      </div>
    </n-card>

    <!-- API 分类导航 -->
    <n-card class="mb-6">
      <n-tabs type="line" animated>
        <n-tab-pane name="auth" tab="认证">
          <ApiEndpointList :endpoints="authEndpoints" />
        </n-tab-pane>
        <n-tab-pane name="printers" tab="打印机">
          <ApiEndpointList :endpoints="printersEndpoints" />
        </n-tab-pane>
        <n-tab-pane name="jobs" tab="打印任务">
          <ApiEndpointList :endpoints="jobsEndpoints" />
        </n-tab-pane>
        <n-tab-pane name="logs" tab="日志">
          <ApiEndpointList :endpoints="logsEndpoints" />
        </n-tab-pane>
      </n-tabs>
    </n-card>

    <!-- 通用说明 -->
    <n-card title="通用说明">
      <div class="space-y-4">
        <div>
          <h3 class="font-semibold mb-2">请求头</h3>
          <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto"><code>Authorization: Bearer &lt;token&gt;
Content-Type: application/json</code></pre>
        </div>
        <div>
          <h3 class="font-semibold mb-2">响应格式</h3>
          <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto"><code>{
  "data": { ... },
  "message": "Success",
  "status": 200
}</code></pre>
        </div>
        <div>
          <h3 class="font-semibold mb-2">错误响应</h3>
          <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto"><code>{
  "detail": "Error message",
  "status": 400
}</code></pre>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ApiEndpointList from '@/components/api/ApiEndpointList.vue'

const baseUrl = computed(() => {
  return window.location.origin + '/api'
})

const authEndpoints = [
  {
    method: 'POST',
    path: '/auth/login',
    description: '用户登录',
    request: {
      username: 'string',
      password: 'string'
    },
    response: {
      access_token: 'string',
      user: {
        id: 'string',
        username: 'string',
        email: 'string'
      }
    }
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    description: '刷新令牌',
    request: {},
    response: {
      access_token: 'string'
    }
  },
  {
    method: 'GET',
    path: '/auth/me',
    description: '获取当前用户信息',
    request: {},
    response: {
      id: 'string',
      username: 'string',
      email: 'string'
    }
  }
]

const printersEndpoints = [
  {
    method: 'GET',
    path: '/printers',
    description: '获取打印机列表',
    request: {
      status: 'string (optional)',
      page: 'number (optional)',
      pageSize: 'number (optional)'
    },
    response: {
      items: 'Printer[]',
      pagination: {
        page: 'number',
        pageSize: 'number',
        total: 'number'
      }
    }
  },
  {
    method: 'GET',
    path: '/printers/{id}',
    description: '获取打印机详情',
    request: {},
    response: {
      id: 'string',
      name: 'string',
      status: 'string',
      isDefault: 'boolean'
    }
  },
  {
    method: 'POST',
    path: '/printers/{id}/set-default',
    description: '设置默认打印机',
    request: {},
    response: {
      message: 'string'
    }
  },
  {
    method: 'POST',
    path: '/printers/{id}/test',
    description: '测试打印机',
    request: {},
    response: {
      success: 'boolean',
      message: 'string'
    }
  },
  {
    method: 'POST',
    path: '/printers/refresh-all',
    description: '刷新所有打印机状态',
    request: {},
    response: {
      message: 'string'
    }
  }
]

const jobsEndpoints = [
  {
    method: 'GET',
    path: '/jobs',
    description: '获取打印任务列表',
    request: {
      status: 'string (optional)',
      printerId: 'string (optional)',
      page: 'number (optional)',
      pageSize: 'number (optional)'
    },
    response: {
      items: 'Job[]',
      pagination: {
        page: 'number',
        pageSize: 'number',
        total: 'number'
      }
    }
  },
  {
    method: 'GET',
    path: '/jobs/{id}',
    description: '获取任务详情',
    request: {},
    response: {
      id: 'string',
      filename: 'string',
      status: 'string',
      printerId: 'string'
    }
  },
  {
    method: 'POST',
    path: '/jobs',
    description: '创建打印任务',
    request: {
      file: 'File',
      printer_id: 'string',
      copies: 'number',
      settings: 'object'
    },
    response: {
      id: 'string',
      filename: 'string',
      status: 'string'
    }
  },
  {
    method: 'POST',
    path: '/jobs/{id}/cancel',
    description: '取消打印任务',
    request: {},
    response: {
      message: 'string'
    }
  },
  {
    method: 'DELETE',
    path: '/jobs/{id}',
    description: '删除打印任务',
    request: {},
    response: {
      message: 'string'
    }
  },
  {
    method: 'GET',
    path: '/jobs/stats',
    description: '获取任务统计',
    request: {},
    response: {
      total: 'number',
      pending: 'number',
      printing: 'number',
      completed: 'number',
      failed: 'number'
    }
  }
]

const logsEndpoints = [
  {
    method: 'GET',
    path: '/logs',
    description: '获取日志列表',
    request: {
      level: 'string (optional)',
      type: 'string (optional)',
      page: 'number (optional)',
      pageSize: 'number (optional)'
    },
    response: {
      items: 'Log[]',
      pagination: {
        page: 'number',
        pageSize: 'number',
        total: 'number'
      }
    }
  },
  {
    method: 'GET',
    path: '/logs/{id}',
    description: '获取日志详情',
    request: {},
    response: {
      id: 'string',
      timestamp: 'string',
      level: 'string',
      message: 'string'
    }
  },
  {
    method: 'GET',
    path: '/logs/stats',
    description: '获取日志统计',
    request: {},
    response: {
      total: 'number',
      byLevel: 'object',
      byType: 'object'
    }
  },
  {
    method: 'GET',
    path: '/logs/export',
    description: '导出日志',
    request: {
      format: 'string (csv|json)'
    },
    response: 'File'
  }
]
</script>

<style scoped>
.api-docs-view {
  @apply px-4 sm:px-0;
}

code {
  @apply font-mono;
}

pre code {
  @apply text-xs;
}
</style>
