<template>
    <div class="printers-view">
        <!-- 页面标题和操作 -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    打印机管理
                </h1>
                <p class="text-gray-600 dark:text-gray-400 mt-1">
                    管理和监控所有打印机设备
                </p>
            </div>
            <div class="flex items-center space-x-3 mt-4 sm:mt-0">
                <n-button type="primary" @click="syncPrinters" :loading="syncing">
                    <template #icon>
                        <n-icon>
                            <SyncIcon />
                        </n-icon>
                    </template>
                    同步打印机
                </n-button>
                <n-button @click="refreshPrinters" :loading="refreshing">
                    <template #icon>
                        <n-icon>
                            <RefreshIcon />
                        </n-icon>
                    </template>
                    刷新
                </n-button>
            </div>
        </div>

        <!-- 统计卡片 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <n-card class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            总计
                        </p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {{ totalPrinters }}
                        </p>
                    </div>
                    <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <n-icon size="20" color="#3b82f6">
                            <PrinterIcon />
                        </n-icon>
                    </div>
                </div>
            </n-card>

            <n-card class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            在线
                        </p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                            {{ onlinePrinters }}
                        </p>
                    </div>
                    <div
                        class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                        <n-icon size="20" color="#10b981">
                            <CheckCircleIcon />
                        </n-icon>
                    </div>
                </div>
            </n-card>

            <n-card class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            离线
                        </p>
                        <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                            {{ offlinePrinters }}
                        </p>
                    </div>
                    <div class="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <n-icon size="20" color="#ef4444">
                            <CloseCircleIcon />
                        </n-icon>
                    </div>
                </div>
            </n-card>

            <n-card class="stat-card">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                            忙碌
                        </p>
                        <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {{ busyPrinters }}
                        </p>
                    </div>
                    <div
                        class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                        <n-icon size="20" color="#f59e0b">
                            <WarningIcon />
                        </n-icon>
                    </div>
                </div>
            </n-card>
        </div>

        <!-- 筛选和搜索 -->
        <n-card class="mb-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex items-center space-x-4">
                    <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="筛选状态" clearable
                        class="w-32" @update:value="handleFilterChange" />
                    <n-input v-model:value="searchQuery" placeholder="搜索打印机名称或位置" clearable class="w-64"
                        @update:value="handleSearch">
                        <template #prefix>
                            <n-icon>
                                <SearchIcon />
                            </n-icon>
                        </template>
                    </n-input>
                </div>
                <div class="flex items-center space-x-2">
                    <n-button text @click="toggleViewMode" :type="viewMode === 'table' ? 'primary' : 'default'">
                        <template #icon>
                            <n-icon>
                                <TableIcon v-if="viewMode === 'card'" />
                                <AppstoreIcon v-else />
                            </n-icon>
                        </template>
                        {{ viewMode === 'table' ? '表格视图' : '卡片视图' }}
                    </n-button>
                </div>
            </div>
        </n-card>

        <!-- 打印机列表 - 桌面端表格视图 -->
        <n-card v-if="viewMode === 'table'" class="hidden md:block">
            <DataTable :data="filteredPrinters" :columns="tableColumns" :loading="loading" :pagination="pagination"
                @update:page="handlePageChange" @update:page-size="handlePageSizeChange" />
        </n-card>

        <!-- 打印机列表 - 移动端卡片视图 -->
        <div v-else class="space-y-4">
            <div v-if="loading" class="flex justify-center py-8">
                <n-spin size="large" />
            </div>

            <div v-else-if="filteredPrinters.length === 0" class="text-center py-8">
                <n-empty description="暂无打印机数据" />
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <n-card v-for="printer in paginatedPrinters" :key="printer.id"
                    class="printer-card hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div
                                class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <n-icon size="24" color="#6b7280">
                                    <PrinterIcon />
                                </n-icon>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-gray-100">
                                    {{ printer.name }}
                                    <n-tag v-if="printer.isDefault" size="tiny" type="success" class="ml-2">
                                        默认
                                    </n-tag>
                                </h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ printer.location || '未设置位置' }}
                                </p>
                            </div>
                        </div>
                        <StatusBadge :status="printer.status" />
                    </div>

                    <div class="space-y-2 mb-4">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">驱动程序:</span>
                            <span class="text-gray-900 dark:text-gray-100">{{ printer.driver || '未知' }}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">彩色打印:</span>
                            <span class="text-gray-900 dark:text-gray-100">
                                {{ printer.capabilities?.color ? '支持' : '不支持' }}
                            </span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">双面打印:</span>
                            <span class="text-gray-900 dark:text-gray-100">
                                {{ printer.capabilities?.duplex ? '支持' : '不支持' }}
                            </span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-400">最后在线:</span>
                            <span class="text-gray-900 dark:text-gray-100">
                                {{ formatTime(printer.lastSeen) }}
                            </span>
                        </div>
                    </div>

                    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-2">
                            <n-button size="small" @click="testPrinter(printer.id)"
                                :loading="testingPrinters.has(printer.id)">
                                <template #icon>
                                    <n-icon size="14">
                                        <TestIcon />
                                    </n-icon>
                                </template>
                                测试
                            </n-button>
                            <n-button size="small" @click="refreshPrinter(printer.id)"
                                :loading="refreshingPrinters.has(printer.id)">
                                <template #icon>
                                    <n-icon size="14">
                                        <RefreshIcon />
                                    </n-icon>
                                </template>
                                刷新
                            </n-button>
                        </div>
                        <n-dropdown :options="getActionOptions(printer)"
                            @select="(key: string) => handleAction(key, printer)">
                            <n-button size="small" quaternary circle>
                                <template #icon>
                                    <n-icon size="16">
                                        <MoreIcon />
                                    </n-icon>
                                </template>
                            </n-button>
                        </n-dropdown>
                    </div>
                </n-card>
            </div>

            <!-- 分页 -->
            <div v-if="filteredPrinters.length > 0" class="flex justify-center mt-6">
                <n-pagination v-model:page="currentPage" :page-count="totalPages" :page-size="pageSize"
                    :show-size-picker="true" :page-sizes="[12, 24, 48]" @update:page="handlePageChange"
                    @update:page-size="handlePageSizeChange" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, NIcon } from 'naive-ui'
import { usePrintersStore } from '@/stores/printers'
import type { Printer } from '@/stores/printers'
import StatusBadge from '@/components/common/StatusBadge.vue'
import DataTable from '@/components/common/DataTable.vue'
import {
    PrinterOutlined as PrinterIcon,
    SyncOutlined as SyncIcon,
    ReloadOutlined as RefreshIcon,
    CheckCircleOutlined as CheckCircleIcon,
    CloseCircleOutlined as CloseCircleIcon,
    WarningOutlined as WarningIcon,
    SearchOutlined as SearchIcon,
    TableOutlined as TableIcon,
    AppstoreOutlined as AppstoreIcon,
    PlayCircleOutlined as TestIcon,
    MoreOutlined as MoreIcon,
    StarOutlined as StarIcon,
    EditOutlined as EditIcon,
    DeleteOutlined as DeleteIcon
} from '@vicons/antd'

const router = useRouter()
const message = useMessage()
const printersStore = usePrintersStore()

// 响应式状态
const loading = computed(() => printersStore.loading)
const printers = computed(() => printersStore.printers)
const syncing = ref(false)
const refreshing = ref(false)
const refreshingPrinters = ref(new Set<string>())
const testingPrinters = ref(new Set<string>())

// 视图模式
const viewMode = ref<'table' | 'card'>('card')

// 筛选和搜索
const statusFilter = ref<string | null>(null)
const searchQuery = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(12)

// 计算属性
const totalPrinters = computed(() => printers.value.length)
const onlinePrinters = computed(() => printers.value.filter(p => p.status === 'online').length)
const offlinePrinters = computed(() => printers.value.filter(p => p.status === 'offline').length)
const busyPrinters = computed(() => printers.value.filter(p => p.status === 'busy').length)

const statusOptions = [
    { label: '全部', value: null },
    { label: '在线', value: 'online' },
    { label: '离线', value: 'offline' },
    { label: '忙碌', value: 'busy' },
    { label: '错误', value: 'error' }
]

const filteredPrinters = computed(() => {
    let filtered = printers.value

    // 状态筛选
    if (statusFilter.value) {
        filtered = filtered.filter(printer => printer.status === statusFilter.value)
    }

    // 搜索筛选
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(printer =>
            printer.name.toLowerCase().includes(query) ||
            (printer.location && printer.location.toLowerCase().includes(query))
        )
    }

    return filtered
})

const totalPages = computed(() => Math.ceil(filteredPrinters.value.length / pageSize.value))

const paginatedPrinters = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredPrinters.value.slice(start, end)
})

const pagination = computed(() => ({
    page: currentPage.value,
    pageSize: pageSize.value,
    total: filteredPrinters.value.length,
    totalPages: totalPages.value
}))

// 表格列定义
const tableColumns = computed(() => [
    {
        title: '打印机名称',
        key: 'name',
        render: (row: Printer) => h('div', { class: 'flex items-center space-x-2' }, [
            h('span', { class: 'font-medium' }, row.name),
            row.isDefault ? h('n-tag', { size: 'tiny', type: 'success' }, '默认') : null
        ])
    },
    {
        title: '状态',
        key: 'status',
        render: (row: Printer) => h(StatusBadge, { status: row.status })
    },
    {
        title: '位置',
        key: 'location',
        render: (row: Printer) => row.location || '未设置'
    },
    {
        title: '驱动程序',
        key: 'driver',
        render: (row: Printer) => row.driver || '未知'
    },
    {
        title: '功能',
        key: 'capabilities',
        render: (row: Printer) => {
            const capabilities = []
            if (row.capabilities?.color) capabilities.push('彩色')
            if (row.capabilities?.duplex) capabilities.push('双面')
            return capabilities.join(', ') || '基本'
        }
    },
    {
        title: '最后在线',
        key: 'lastSeen',
        render: (row: Printer) => formatTime(row.lastSeen)
    },
    {
        title: '操作',
        key: 'actions',
        render: (row: Printer) => h('div', { class: 'flex items-center space-x-2' }, [
            h('n-button', {
                size: 'small',
                onClick: () => testPrinter(row.id),
                loading: testingPrinters.value.has(row.id)
            }, { default: () => '测试' }),
            h('n-button', {
                size: 'small',
                onClick: () => refreshPrinter(row.id),
                loading: refreshingPrinters.value.has(row.id)
            }, { default: () => '刷新' }),
            h('n-dropdown', {
                options: getActionOptions(row),
                onSelect: (key: string) => handleAction(key, row)
            }, {
                default: () => h('n-button', { size: 'small', quaternary: true, circle: true }, {
                    icon: () => h(NIcon, null, { default: () => h(MoreIcon) })
                })
            })
        ])
    }
])

// 方法
const formatTime = (timestamp?: string) => {
    if (!timestamp) return '从未'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return date.toLocaleDateString()
}

const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'table' ? 'card' : 'table'
}

const handleFilterChange = () => {
    currentPage.value = 1
}

const handleSearch = () => {
    currentPage.value = 1
}

const handlePageChange = (page: number) => {
    currentPage.value = page
}

const handlePageSizeChange = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
}

const syncPrinters = async () => {
    syncing.value = true
    try {
        await printersStore.refreshPrinterStatus()
        message.success('打印机同步成功')
    } catch (error) {
        message.error('打印机同步失败')
    } finally {
        syncing.value = false
    }
}

const refreshPrinters = async () => {
    refreshing.value = true
    try {
        await printersStore.fetchPrinters()
        message.success('打印机列表已刷新')
    } catch (error) {
        message.error('刷新打印机列表失败')
    } finally {
        refreshing.value = false
    }
}

const refreshPrinter = async (printerId: string) => {
    refreshingPrinters.value.add(printerId)
    try {
        await printersStore.refreshPrinterStatus(printerId)
        message.success('打印机状态已刷新')
    } catch (error) {
        message.error('刷新打印机状态失败')
    } finally {
        refreshingPrinters.value.delete(printerId)
    }
}

const testPrinter = async (printerId: string) => {
    testingPrinters.value.add(printerId)
    try {
        await printersStore.testPrinter(printerId)
        message.success('打印机测试成功')
    } catch (error) {
        message.error('打印机测试失败')
    } finally {
        testingPrinters.value.delete(printerId)
    }
}

const getActionOptions = (printer: Printer) => [
    {
        label: printer.isDefault ? '取消默认' : '设为默认',
        key: 'setDefault',
        icon: () => h(NIcon, null, { default: () => h(StarIcon) })
    },
    {
        label: '编辑',
        key: 'edit',
        icon: () => h(NIcon, null, { default: () => h(EditIcon) })
    },
    {
        type: 'divider'
    },
    {
        label: '删除',
        key: 'delete',
        icon: () => h(NIcon, null, { default: () => h(DeleteIcon) })
    }
]

const handleAction = async (key: string, printer: Printer) => {
    switch (key) {
        case 'setDefault':
            try {
                if (printer.isDefault) {
                    message.info('该打印机已是默认打印机')
                } else {
                    await printersStore.setDefaultPrinter(printer.id)
                    message.success(`已将 ${printer.name} 设为默认打印机`)
                }
            } catch (error) {
                message.error('设置默认打印机失败')
            }
            break
        case 'edit':
            message.info('编辑功能开发中')
            break
        case 'delete':
            message.info('删除功能开发中')
            break
    }
}

// 生命周期
onMounted(() => {
    printersStore.fetchPrinters()
})
</script>

<style scoped>
.printers-view {
    @apply max-w-7xl mx-auto;
}

.stat-card {
    @apply transition-all duration-200 hover:shadow-md;
}

.printer-card {
    @apply transition-all duration-200;
}

.printer-card:hover {
    @apply transform -translate-y-1;
}

/* 移动端适配 */
@media (max-width: 640px) {
    .printers-view {
        @apply px-4;
    }
}
</style>