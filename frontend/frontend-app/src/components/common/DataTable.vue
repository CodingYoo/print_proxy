<template>
  <div class="data-table-container">
    <!-- 表格工具栏 -->
    <div v-if="showToolbar" class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <!-- 左侧：搜索和筛选 -->
      <div class="flex flex-col sm:flex-row gap-2">
        <n-input
          v-if="searchable"
          v-model:value="searchValue"
          placeholder="搜索..."
          clearable
          class="w-full sm:w-64"
          @input="handleSearch"
        >
          <template #prefix>
            <n-icon>
              <SearchOutlined />
            </n-icon>
          </template>
        </n-input>
        
        <slot name="filters" />
      </div>
      
      <!-- 右侧：操作按钮 -->
      <div class="flex gap-2">
        <slot name="actions" />
        
        <n-button
          v-if="refreshable"
          quaternary
          circle
          :loading="loading"
          @click="$emit('refresh')"
        >
          <template #icon>
            <n-icon>
              <ReloadOutlined />
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      :columns="computedColumns"
      :data="filteredData"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="rowKey as any"
      :checked-row-keys="checkedRowKeys as any"
      :single-line="false"
      :bordered="bordered"
      :size="size"
      :scroll-x="scrollX"
      :max-height="maxHeight"
      @update:checked-row-keys="handleCheckedRowKeysChange as any"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- 移动端卡片视图 -->
    <div v-if="showMobileCards && isMobile" class="md:hidden space-y-3">
      <n-card
        v-for="item in paginatedData"
        :key="getRowKey(item)"
        size="small"
        hoverable
        class="mobile-card"
      >
        <slot name="mobile-card" :item="item">
          <div class="space-y-3">
            <div
              v-for="column in mobileColumns"
              :key="column.key"
              class="flex justify-between items-start gap-3"
            >
              <span class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                {{ column.title }}:
              </span>
              <span class="text-sm font-medium text-gray-900 dark:text-gray-100 text-right flex-1">
                <component
                  v-if="column.render"
                  :is="column.render"
                  :row="item"
                  :index="filteredData.indexOf(item)"
                />
                <span v-else>{{ item[column.key] }}</span>
              </span>
            </div>
          </div>
        </slot>
      </n-card>
      
      <!-- 移动端分页 -->
      <div v-if="pagination && pageCount > 1" class="flex justify-center pt-2">
        <n-pagination
          v-model:page="currentPage"
          :page-count="pageCount"
          :page-size="pageSize"
          size="small"
          :show-quick-jumper="false"
          :show-size-picker="false"
          simple
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && (!data || data.length === 0)" class="text-center py-12">
      <n-empty description="暂无数据">
        <template #extra>
          <slot name="empty-actions" />
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NDataTable, NInput, NButton, NIcon, NCard, NPagination, NEmpty } from 'naive-ui'
import { SearchOutlined, ReloadOutlined } from '@vicons/antd'

export interface TableColumn {
  key: string
  title: string
  width?: number
  minWidth?: number
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  ellipsis?: boolean
  sortable?: boolean
  filterable?: boolean
  render?: (row: any, index: number) => any
  sorter?: (row1: any, row2: any) => number
  filter?: (value: any, row: any) => boolean
}

interface Props {
  data: any[]
  columns: TableColumn[]
  loading?: boolean
  pagination?: boolean | object
  rowKey?: string | ((row: any) => string)
  checkedRowKeys?: string[]
  searchable?: boolean
  refreshable?: boolean
  showToolbar?: boolean
  showMobileCards?: boolean
  bordered?: boolean
  size?: 'small' | 'medium' | 'large'
  scrollX?: number
  maxHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pagination: true,
  rowKey: 'id',
  checkedRowKeys: () => [],
  searchable: true,
  refreshable: true,
  showToolbar: true,
  showMobileCards: true,
  bordered: false,
  size: 'medium'
})

const emit = defineEmits<{
  refresh: []
  'update:checkedRowKeys': [keys: string[]]
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

// 响应式状态
const searchValue = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const windowWidth = ref(window.innerWidth)

// 计算属性
const isMobile = computed(() => windowWidth.value < 768)

const computedColumns = computed(() => {
  return props.columns.map(column => ({
    ...column,
    render: column.render ? (row: any, index: number) => column.render!(row, index) : undefined
  }))
})

const filteredData = computed(() => {
  if (!searchValue.value) return props.data
  
  return props.data.filter(item => {
    return props.columns.some(column => {
      const value = item[column.key]
      return value && value.toString().toLowerCase().includes(searchValue.value.toLowerCase())
    })
  })
})

const paginatedData = computed(() => {
  if (!props.pagination) return filteredData.value
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const pageCount = computed(() => {
  return Math.ceil(filteredData.value.length / pageSize.value)
})

const paginationConfig = computed(() => {
  if (!props.pagination) return false
  
  if (typeof props.pagination === 'object') {
    return props.pagination
  }
  
  return {
    page: currentPage.value,
    pageSize: pageSize.value,
    itemCount: filteredData.value.length,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    showQuickJumper: true,
    prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`
  }
})

const mobileColumns = computed(() => {
  // 移动端只显示前3个重要列
  return props.columns.slice(0, 3)
})

// 方法
const getRowKey = (row: any) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row[props.rowKey]
}

const handleSearch = () => {
  currentPage.value = 1 // 搜索时重置到第一页
}

const handleCheckedRowKeysChange = (keys: string[]) => {
  emit('update:checkedRowKeys', keys)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  emit('update:page', page)
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  emit('update:pageSize', size)
}

const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听数据变化，重置分页
watch(() => props.data, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.data-table-container {
  @apply w-full;
}

:deep(.n-data-table-th) {
  @apply bg-gray-50 dark:bg-gray-800;
}

:deep(.n-data-table-td) {
  @apply border-b border-gray-100 dark:border-gray-700;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  @apply bg-gray-50 dark:bg-gray-800;
}

/* 移动端隐藏表格，显示卡片 */
@media (max-width: 768px) {
  :deep(.n-data-table) {
    display: none;
  }
  
  .mobile-card {
    @apply shadow-sm;
    transition: all 0.2s ease;
  }
  
  .mobile-card:active {
    @apply shadow-md transform scale-[0.98];
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .mobile-card {
    /* 增加卡片内边距以适应触摸 */
    padding: 16px;
  }
  
  :deep(.n-button) {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>