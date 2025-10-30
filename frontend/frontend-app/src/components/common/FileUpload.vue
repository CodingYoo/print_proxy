<template>
  <div class="file-upload-container">
    <!-- 拖拽上传区域 -->
    <n-upload
      ref="uploadRef"
      :action="action"
      :headers="headers"
      :data="data"
      :file-list="fileList"
      :multiple="multiple"
      :accept="accept"
      :max="max"
      :disabled="disabled"
      :show-file-list="showFileList"
      :directory-dnd="directoryDnd"
      :on-before-upload="handleBeforeUpload"
      :on-upload="handleUpload"
      :on-finish="handleFinish"
      :on-error="handleError"
      :on-remove="handleRemove"
      :custom-request="customRequest"
      @change="handleChange"
    >
      <n-upload-dragger v-if="dragger">
        <div class="text-center py-8">
          <n-icon size="48" class="text-gray-400 mb-4">
            <CloudUploadOutlined />
          </n-icon>
          <n-text class="text-lg font-medium block mb-2">
            {{ dragText || '点击或拖拽文件到此区域上传' }}
          </n-text>
          <n-text depth="3" class="text-sm">
            {{ dragHint || '支持单个或批量上传' }}
          </n-text>
          <div v-if="accept" class="mt-2">
            <n-text depth="3" class="text-xs">
              支持格式：{{ accept }}
            </n-text>
          </div>
          <div v-if="maxSize" class="mt-1">
            <n-text depth="3" class="text-xs">
              文件大小限制：{{ formatFileSize(maxSize) }}
            </n-text>
          </div>
        </div>
      </n-upload-dragger>
      
      <n-button v-else :disabled="disabled" :loading="uploading">
        <template #icon>
          <n-icon>
            <UploadOutlined />
          </n-icon>
        </template>
        {{ buttonText || '选择文件' }}
      </n-button>
    </n-upload>

    <!-- 文件预览区域 -->
    <div v-if="showPreview && previewFiles.length > 0" class="mt-4">
      <n-divider title-placement="left">
        <n-text class="text-sm">文件预览</n-text>
      </n-divider>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <n-card
          v-for="file in previewFiles"
          :key="file.id"
          size="small"
          hoverable
          class="file-preview-card"
        >
          <div class="flex items-center space-x-3">
            <!-- 文件图标或缩略图 -->
            <div class="flex-shrink-0">
              <img
                v-if="isImage(file) && file.url"
                :src="file.url"
                :alt="file.name"
                class="w-12 h-12 object-cover rounded"
              />
              <n-icon v-else size="32" class="text-gray-400">
                <FileOutlined />
              </n-icon>
            </div>
            
            <!-- 文件信息 -->
            <div class="flex-1 min-w-0">
              <n-text class="text-sm font-medium truncate block">
                {{ file.name }}
              </n-text>
              <n-text depth="3" class="text-xs">
                {{ formatFileSize(file.file?.size || 0) }}
              </n-text>
              <div class="mt-1">
                <StatusBadge
                  :status="getFileStatus(file.status)"
                  :text="getFileStatusText(file.status)"
                  size="small"
                />
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex-shrink-0">
              <n-button
                size="small"
                quaternary
                circle
                @click="handleRemoveFile(file)"
              >
                <template #icon>
                  <n-icon>
                    <DeleteOutlined />
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
          
          <!-- 上传进度 -->
          <div v-if="file.status === 'uploading'" class="mt-2">
            <n-progress
              type="line"
              :percentage="file.percentage || 0"
              :show-indicator="false"
              size="small"
            />
          </div>
        </n-card>
      </div>
    </div>

    <!-- 上传统计 -->
    <div v-if="showStats && fileList.length > 0" class="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="flex justify-between items-center text-sm">
        <span>总计：{{ fileList.length }} 个文件</span>
        <span>
          成功：{{ successCount }} | 
          失败：{{ errorCount }} | 
          上传中：{{ uploadingCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  NUpload, 
  NUploadDragger, 
  NButton, 
  NIcon, 
  NText, 
  NCard, 
  NDivider,
  NProgress,
  useMessage,
  type UploadFileInfo,
  type UploadCustomRequestOptions
} from 'naive-ui'
import {
  CloudUploadOutlined,
  UploadOutlined,
  FileOutlined,
  DeleteOutlined
} from '@vicons/antd'
import StatusBadge, { type StatusType } from './StatusBadge.vue'

interface Props {
  action?: string
  headers?: Record<string, string>
  data?: Record<string, any>
  multiple?: boolean
  accept?: string
  max?: number
  maxSize?: number // 文件大小限制（字节）
  disabled?: boolean
  dragger?: boolean
  showFileList?: boolean
  showPreview?: boolean
  showStats?: boolean
  directoryDnd?: boolean
  buttonText?: string
  dragText?: string
  dragHint?: string
  customRequest?: (options: UploadCustomRequestOptions) => void
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  showFileList: true,
  showPreview: true,
  showStats: true,
  dragger: true,
  directoryDnd: false
})

const emit = defineEmits<{
  'update:fileList': [files: UploadFileInfo[]]
  'upload-success': [file: UploadFileInfo, response: any]
  'upload-error': [file: UploadFileInfo, error: any]
  'file-remove': [file: UploadFileInfo]
}>()

const message = useMessage()
const uploadRef = ref()
const fileList = ref<UploadFileInfo[]>([])
const uploading = ref(false)

// 计算属性
const previewFiles = computed(() => fileList.value)

const successCount = computed(() => 
  fileList.value.filter(file => file.status === 'finished').length
)

const errorCount = computed(() => 
  fileList.value.filter(file => file.status === 'error').length
)

const uploadingCount = computed(() => 
  fileList.value.filter(file => file.status === 'uploading').length
)

// 方法
const isImage = (file: UploadFileInfo) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return file.file && imageTypes.includes(file.file.type)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileStatus = (status: string): StatusType => {
  const statusMap: Record<string, StatusType> = {
    'pending': 'pending',
    'uploading': 'processing',
    'finished': 'success',
    'error': 'error',
    'removed': 'cancelled'
  }
  return statusMap[status] || 'info'
}

const getFileStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    'pending': '等待上传',
    'uploading': '上传中',
    'finished': '上传成功',
    'error': '上传失败',
    'removed': '已移除'
  }
  return textMap[status] || status
}

// 事件处理
const handleBeforeUpload = (data: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  const { file } = data
  
  // 检查文件大小
  if (props.maxSize && file.file && file.file.size > props.maxSize) {
    message.error(`文件 ${file.name} 大小超过限制 ${formatFileSize(props.maxSize)}`)
    return false
  }
  
  // 检查文件数量
  if (props.max && fileList.value.length >= props.max) {
    message.error(`最多只能上传 ${props.max} 个文件`)
    return false
  }
  
  return true
}

const handleUpload = (data: { file: UploadFileInfo, event?: ProgressEvent }) => {
  uploading.value = true
}

const handleFinish = (data: { file: UploadFileInfo, event?: ProgressEvent }) => {
  uploading.value = false
  message.success(`文件 ${data.file.name} 上传成功`)
  emit('upload-success', data.file, data.event)
}

const handleError = (data: { file: UploadFileInfo, event?: ProgressEvent }) => {
  uploading.value = false
  message.error(`文件 ${data.file.name} 上传失败`)
  emit('upload-error', data.file, data.event)
}

const handleRemove = (data: { file: UploadFileInfo, fileList: UploadFileInfo[] }) => {
  emit('file-remove', data.file)
  return true
}

const handleRemoveFile = (file: UploadFileInfo) => {
  const index = fileList.value.findIndex(f => f.id === file.id)
  if (index > -1) {
    fileList.value.splice(index, 1)
    emit('file-remove', file)
  }
}

const handleChange = (data: { fileList: UploadFileInfo[], event?: Event }) => {
  fileList.value = data.fileList
  emit('update:fileList', data.fileList)
}

// 暴露方法
defineExpose({
  submit: () => uploadRef.value?.submit(),
  clear: () => {
    fileList.value = []
    uploadRef.value?.clear()
  }
})
</script>

<style scoped>
.file-upload-container {
  @apply w-full;
}

.file-preview-card {
  @apply transition-all duration-200;
}

.file-preview-card:hover {
  @apply shadow-md;
}

:deep(.n-upload-dragger) {
  @apply border-2 border-dashed border-gray-300 dark:border-gray-600;
}

:deep(.n-upload-dragger:hover) {
  @apply border-green-400 dark:border-green-500;
}

:deep(.n-upload-dragger.n-upload-dragger--disabled) {
  @apply border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800;
}
</style>