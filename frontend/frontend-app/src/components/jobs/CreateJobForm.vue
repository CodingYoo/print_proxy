<template>
  <div class="create-job-form">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="top"
      require-mark-placement="right-hanging"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 文件上传 -->
        <div class="md:col-span-2">
          <n-form-item label="选择文件" path="file">
            <FileUpload
              v-model:file="formData.file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              :max-size="50 * 1024 * 1024"
              @change="handleFileChange"
            />
          </n-form-item>
        </div>

        <!-- 打印机选择 -->
        <n-form-item label="选择打印机" path="printerId">
          <n-select
            v-model:value="formData.printerId"
            :options="printerOptions"
            placeholder="请选择打印机"
            @update:value="handlePrinterChange"
          />
        </n-form-item>

        <!-- 份数 -->
        <n-form-item label="打印份数" path="copies">
          <n-input-number
            v-model:value="formData.copies"
            :min="1"
            :max="99"
            placeholder="1"
          />
        </n-form-item>

        <!-- 优先级 -->
        <n-form-item label="优先级" path="priority">
          <n-select
            v-model:value="formData.priority"
            :options="priorityOptions"
            placeholder="请选择优先级"
          />
        </n-form-item>

        <!-- 纸张大小 -->
        <n-form-item label="纸张大小" path="settings.paperSize">
          <n-select
            v-model:value="formData.settings.paperSize"
            :options="paperSizeOptions"
            placeholder="请选择纸张大小"
          />
        </n-form-item>

        <!-- 打印方向 -->
        <n-form-item label="打印方向" path="settings.orientation">
          <n-radio-group v-model:value="formData.settings.orientation">
            <n-radio value="portrait">纵向</n-radio>
            <n-radio value="landscape">横向</n-radio>
          </n-radio-group>
        </n-form-item>

        <!-- 打印质量 -->
        <n-form-item label="打印质量" path="settings.quality">
          <n-select
            v-model:value="formData.settings.quality"
            :options="qualityOptions"
            placeholder="请选择打印质量"
          />
        </n-form-item>

        <!-- 彩色打印 -->
        <n-form-item label="彩色打印" path="settings.color">
          <n-switch
            v-model:value="formData.settings.color"
            :disabled="!selectedPrinterSupportsColor"
          />
          <span v-if="!selectedPrinterSupportsColor" class="text-sm text-gray-500 ml-2">
            所选打印机不支持彩色打印
          </span>
        </n-form-item>

        <!-- 双面打印 -->
        <n-form-item label="双面打印" path="settings.duplex">
          <n-switch
            v-model:value="formData.settings.duplex"
            :disabled="!selectedPrinterSupportsDuplex"
          />
          <span v-if="!selectedPrinterSupportsDuplex" class="text-sm text-gray-500 ml-2">
            所选打印机不支持双面打印
          </span>
        </n-form-item>
      </div>

      <!-- 文件预览 -->
      <div v-if="formData.file" class="mt-6">
        <n-divider title-placement="left">文件预览</n-divider>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <n-icon size="24" color="#3b82f6">
                <FileIcon />
              </n-icon>
            </div>
            <div class="flex-1">
              <h4 class="font-medium text-gray-900 dark:text-gray-100">
                {{ formData.file.name }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                大小: {{ formatFileSize(formData.file.size) }} | 
                类型: {{ formData.file.type || '未知' }}
              </p>
              <p v-if="estimatedPages" class="text-sm text-green-600 dark:text-green-400">
                预计页数: {{ estimatedPages }} 页
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 打印预览和成本估算 -->
      <div v-if="formData.printerId && formData.file" class="mt-6">
        <n-divider title-placement="left">打印预览</n-divider>
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">打印设置</h5>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">打印机:</span>
                  <span class="text-gray-900 dark:text-gray-100">{{ selectedPrinterName }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">份数:</span>
                  <span class="text-gray-900 dark:text-gray-100">{{ formData.copies }} 份</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">总页数:</span>
                  <span class="text-gray-900 dark:text-gray-100">
                    {{ (estimatedPages || 0) * formData.copies }} 页
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">彩色:</span>
                  <span class="text-gray-900 dark:text-gray-100">
                    {{ formData.settings.color ? '是' : '否' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">双面:</span>
                  <span class="text-gray-900 dark:text-gray-100">
                    {{ formData.settings.duplex ? '是' : '否' }}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 class="font-medium text-gray-900 dark:text-gray-100 mb-2">预计时间</h5>
              <div class="space-y-1 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">预计用时:</span>
                  <span class="text-gray-900 dark:text-gray-100">{{ estimatedDuration }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">队列位置:</span>
                  <span class="text-gray-900 dark:text-gray-100">{{ queuePosition }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-form>

    <!-- 操作按钮 -->
    <div class="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <n-button @click="$emit('cancel')">
        取消
      </n-button>
      <n-button
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        提交打印任务
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { useJobsStore } from '@/stores/jobs'
import { usePrintersStore } from '@/stores/printers'
import FileUpload from '@/components/common/FileUpload.vue'
import { FileTextOutlined as FileIcon } from '@vicons/antd'

interface FormData {
  file: File | null
  printerId: string
  copies: number
  priority: string
  settings: {
    paperSize: string
    orientation: string
    quality: string
    color: boolean
    duplex: boolean
  }
}

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const message = useMessage()
const jobsStore = useJobsStore()
const printersStore = usePrintersStore()

// 表单引用和数据
const formRef = ref()
const submitting = ref(false)
const estimatedPages = ref<number | null>(null)

const formData = ref<FormData>({
  file: null,
  printerId: '',
  copies: 1,
  priority: 'normal',
  settings: {
    paperSize: 'A4',
    orientation: 'portrait',
    quality: 'normal',
    color: false,
    duplex: false
  }
})

// 表单验证规则
const formRules = {
  file: {
    required: true,
    message: '请选择要打印的文件',
    trigger: 'change'
  },
  printerId: {
    required: true,
    message: '请选择打印机',
    trigger: 'change'
  },
  copies: {
    required: true,
    type: 'number',
    min: 1,
    max: 99,
    message: '份数必须在1-99之间',
    trigger: 'blur'
  }
}

// 计算属性
const printerOptions = computed(() => 
  printersStore.printers
    .filter(printer => printer.status === 'online')
    .map(printer => ({
      label: `${printer.name}${printer.isDefault ? ' (默认)' : ''}`,
      value: printer.id
    }))
)

const priorityOptions = [
  { label: '低优先级', value: 'low' },
  { label: '普通优先级', value: 'normal' },
  { label: '高优先级', value: 'high' }
]

const paperSizeOptions = [
  { label: 'A4', value: 'A4' },
  { label: 'A3', value: 'A3' },
  { label: 'A5', value: 'A5' },
  { label: 'Letter', value: 'Letter' },
  { label: 'Legal', value: 'Legal' }
]

const qualityOptions = [
  { label: '草稿', value: 'draft' },
  { label: '普通', value: 'normal' },
  { label: '高质量', value: 'high' }
]

const selectedPrinter = computed(() => 
  printersStore.printers.find(p => p.id === formData.value.printerId)
)

const selectedPrinterName = computed(() => 
  selectedPrinter.value?.name || ''
)

const selectedPrinterSupportsColor = computed(() => 
  selectedPrinter.value?.capabilities?.color || false
)

const selectedPrinterSupportsDuplex = computed(() => 
  selectedPrinter.value?.capabilities?.duplex || false
)

const canSubmit = computed(() => 
  formData.value.file && 
  formData.value.printerId && 
  formData.value.copies > 0 &&
  !submitting.value
)

const estimatedDuration = computed(() => {
  if (!estimatedPages.value || !formData.value.copies) return '未知'
  
  const totalPages = estimatedPages.value * formData.value.copies
  const pagesPerMinute = formData.value.settings.color ? 5 : 10 // 假设的打印速度
  const minutes = Math.ceil(totalPages / pagesPerMinute)
  
  if (minutes < 1) return '< 1分钟'
  if (minutes < 60) return `${minutes}分钟`
  return `${Math.ceil(minutes / 60)}小时`
})

const queuePosition = computed(() => {
  const activeJobs = jobsStore.activeJobs.length
  return activeJobs > 0 ? `第 ${activeJobs + 1} 位` : '立即开始'
})

// 方法
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileChange = (file: File | null) => {
  if (file) {
    // 简单的页数估算逻辑
    const sizeInMB = file.size / (1024 * 1024)
    if (file.type.includes('pdf')) {
      estimatedPages.value = Math.max(1, Math.ceil(sizeInMB * 2)) // PDF大约每MB 2页
    } else if (file.type.includes('image')) {
      estimatedPages.value = 1 // 图片通常是1页
    } else {
      estimatedPages.value = Math.max(1, Math.ceil(sizeInMB * 10)) // 文档大约每MB 10页
    }
  } else {
    estimatedPages.value = null
  }
}

const handlePrinterChange = () => {
  // 根据打印机能力调整设置
  if (!selectedPrinterSupportsColor.value) {
    formData.value.settings.color = false
  }
  if (!selectedPrinterSupportsDuplex.value) {
    formData.value.settings.duplex = false
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    
    if (!formData.value.file) {
      message.error('请选择要打印的文件')
      return
    }

    submitting.value = true

    const jobData = {
      file: formData.value.file,
      printerId: formData.value.printerId,
      copies: formData.value.copies,
      priority: formData.value.priority,
      settings: formData.value.settings
    }

    await jobsStore.submitJob(jobData)
    emit('success')
  } catch (error: any) {
    if (error?.length) {
      // 表单验证错误
      return
    }
    message.error('提交打印任务失败')
  } finally {
    submitting.value = false
  }
}

// 监听打印机变化，自动调整设置
watch(() => formData.value.printerId, handlePrinterChange)
</script>

<style scoped>
.create-job-form {
  @apply max-w-4xl mx-auto;
}
</style>