<template>
  <div class="api-endpoint-list space-y-4">
    <div
      v-for="(endpoint, index) in endpoints"
      :key="index"
      class="endpoint-card border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center space-x-3">
          <n-tag :type="getMethodType(endpoint.method)" size="small">
            {{ endpoint.method }}
          </n-tag>
          <code class="text-sm font-mono text-gray-900 dark:text-gray-100">
            {{ endpoint.path }}
          </code>
        </div>
        <n-button
          size="small"
          quaternary
          @click="toggleExpand(index)"
        >
          {{ expandedItems.has(index) ? '收起' : '展开' }}
        </n-button>
      </div>

      <p class="text-gray-600 dark:text-gray-400 mb-3">
        {{ endpoint.description }}
      </p>

      <div v-if="expandedItems.has(index)" class="space-y-4">
        <!-- 请求参数 -->
        <div v-if="Object.keys(endpoint.request).length > 0">
          <h4 class="font-semibold text-sm mb-2">请求参数</h4>
          <div class="bg-gray-50 dark:bg-gray-800 rounded p-3">
            <pre class="text-xs overflow-x-auto"><code>{{ formatJson(endpoint.request) }}</code></pre>
          </div>
        </div>

        <!-- 响应示例 -->
        <div>
          <h4 class="font-semibold text-sm mb-2">响应示例</h4>
          <div class="bg-gray-50 dark:bg-gray-800 rounded p-3">
            <pre class="text-xs overflow-x-auto"><code>{{ formatJson(endpoint.response) }}</code></pre>
          </div>
        </div>

        <!-- 示例请求 -->
        <div>
          <h4 class="font-semibold text-sm mb-2">cURL 示例</h4>
          <div class="bg-gray-50 dark:bg-gray-800 rounded p-3">
            <pre class="text-xs overflow-x-auto"><code>{{ generateCurlExample(endpoint) }}</code></pre>
          </div>
          <n-button
            size="tiny"
            class="mt-2"
            @click="copyCurl(generateCurlExample(endpoint))"
          >
            复制
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

interface Endpoint {
  method: string
  path: string
  description: string
  request: Record<string, any>
  response: Record<string, any> | string
}

interface Props {
  endpoints: Endpoint[]
}

const props = defineProps<Props>()
const message = useMessage()

const expandedItems = ref(new Set<number>())

const getMethodType = (method: string) => {
  const typeMap: Record<string, any> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error',
    PATCH: 'warning'
  }
  return typeMap[method] || 'default'
}

const formatJson = (obj: any) => {
  if (typeof obj === 'string') return obj
  return JSON.stringify(obj, null, 2)
}

const generateCurlExample = (endpoint: Endpoint) => {
  const baseUrl = window.location.origin + '/api'
  let curl = `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}"`
  
  curl += ` \\\n  -H "Authorization: Bearer <token>"`
  
  if (endpoint.method !== 'GET' && Object.keys(endpoint.request).length > 0) {
    curl += ` \\\n  -H "Content-Type: application/json"`
    curl += ` \\\n  -d '${JSON.stringify(endpoint.request, null, 2)}'`
  }
  
  return curl
}

const toggleExpand = (index: number) => {
  if (expandedItems.value.has(index)) {
    expandedItems.value.delete(index)
  } else {
    expandedItems.value.add(index)
  }
}

const copyCurl = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}
</script>

<style scoped>
.endpoint-card {
  @apply transition-all duration-200;
}

.endpoint-card:hover {
  @apply border-blue-300 dark:border-blue-700;
}

code {
  @apply font-mono;
}

pre {
  @apply whitespace-pre-wrap break-words;
}
</style>
