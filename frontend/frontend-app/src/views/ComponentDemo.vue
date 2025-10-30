<template>
  <MainLayout>
    <div class="space-y-8">
      <n-card title="基础组件演示" size="large">
        <n-tabs type="line" animated>
          <n-tab-pane name="status-badge" tab="状态标签">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">StatusBadge 组件</h3>
              <div class="flex flex-wrap gap-4">
                <StatusBadge status="success" text="成功" />
                <StatusBadge status="warning" text="警告" />
                <StatusBadge status="error" text="错误" />
                <StatusBadge status="info" text="信息" />
                <StatusBadge status="processing" text="处理中" />
                <StatusBadge status="pending" text="等待中" />
                <StatusBadge status="paused" text="已暂停" />
                <StatusBadge status="cancelled" text="已取消" />
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="data-table" tab="数据表格">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">DataTable 组件</h3>
              <DataTable
                :data="tableData"
                :columns="tableColumns"
                :loading="false"
                searchable
                refreshable
                @refresh="handleRefresh"
              />
            </div>
          </n-tab-pane>

          <n-tab-pane name="file-upload" tab="文件上传">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">FileUpload 组件</h3>
              <FileUpload
                :multiple="true"
                accept=".pdf,.doc,.docx,.txt"
                :max-size="10 * 1024 * 1024"
                drag-text="拖拽文件到此处上传"
                drag-hint="支持 PDF、DOC、DOCX、TXT 格式"
              />
            </div>
          </n-tab-pane>

          <n-tab-pane name="error-boundary" tab="错误边界">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold">ErrorBoundary 组件</h3>
              <ErrorBoundary>
                <n-button @click="triggerError" type="error">
                  触发错误测试
                </n-button>
                <div v-if="showError">
                  {{ errorComponent }}
                </div>
              </ErrorBoundary>
            </div>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { NCard, NTabs, NTabPane, NButton, useMessage } from 'naive-ui'
import { MainLayout } from '@/components/layout'
import { StatusBadge, DataTable, FileUpload, ErrorBoundary } from '@/components/common'
import type { TableColumn } from '@/components/common'

const message = useMessage()
const showError = ref(false)

// 表格数据
const tableData = ref([
  {
    id: '1',
    name: '打印任务 1',
    status: 'success',
    printer: 'HP LaserJet Pro',
    createdAt: '2024-01-15 10:30:00',
    pages: 5
  },
  {
    id: '2',
    name: '打印任务 2',
    status: 'processing',
    printer: 'Canon PIXMA',
    createdAt: '2024-01-15 11:15:00',
    pages: 12
  },
  {
    id: '3',
    name: '打印任务 3',
    status: 'error',
    printer: 'Epson EcoTank',
    createdAt: '2024-01-15 12:00:00',
    pages: 3
  }
])

// 表格列配置
const tableColumns: TableColumn[] = [
  {
    key: 'name',
    title: '任务名称',
    width: 200
  },
  {
    key: 'status',
    title: '状态',
    width: 120,
    render: (row: any) => {
      return h(StatusBadge, {
        status: row.status,
        size: 'small'
      })
    }
  },
  {
    key: 'printer',
    title: '打印机',
    width: 180
  },
  {
    key: 'pages',
    title: '页数',
    width: 80,
    align: 'center'
  },
  {
    key: 'createdAt',
    title: '创建时间',
    width: 160
  }
]

// 错误组件
const errorComponent = computed(() => {
  if (showError.value) {
    throw new Error('这是一个测试错误')
  }
  return null
})

// 方法
const handleRefresh = () => {
  message.success('表格已刷新')
}

const triggerError = () => {
  showError.value = true
}
</script>

<style scoped>
:deep(.n-tabs-nav) {
  @apply mb-6;
}
</style>