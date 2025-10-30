<template>
  <div class="skeleton-loader" :class="{ 'skeleton-animated': animated }">
    <!-- 预定义的骨架屏类型 -->
    <template v-if="type === 'card'">
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'list'">
      <div v-for="i in count" :key="i" class="skeleton-list-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-list-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table-header">
          <div v-for="i in columns" :key="i" class="skeleton-table-cell"></div>
        </div>
        <div v-for="i in rows" :key="i" class="skeleton-table-row">
          <div v-for="j in columns" :key="j" class="skeleton-table-cell"></div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'form'">
      <div class="skeleton-form">
        <div v-for="i in count" :key="i" class="skeleton-form-item">
          <div class="skeleton-label"></div>
          <div class="skeleton-input"></div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'text'">
      <div class="skeleton-text-block">
        <div v-for="i in count" :key="i" class="skeleton-text" :class="{ short: i === count }"></div>
      </div>
    </template>

    <!-- 自定义骨架屏 -->
    <template v-else-if="type === 'custom'">
      <slot />
    </template>

    <!-- 使用 Naive UI 的骨架屏 -->
    <template v-else>
      <n-skeleton :text="text" :round="round" :sharp="sharp" :height="height" :width="width" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { NSkeleton } from 'naive-ui'

interface Props {
  type?: 'card' | 'list' | 'table' | 'form' | 'text' | 'custom' | 'default'
  animated?: boolean
  count?: number
  rows?: number
  columns?: number
  text?: boolean
  round?: boolean
  sharp?: boolean
  height?: string
  width?: string
}

withDefaults(defineProps<Props>(), {
  type: 'default',
  animated: true,
  count: 3,
  rows: 5,
  columns: 4,
  text: true,
  round: false,
  sharp: false
})
</script>

<style scoped>
.skeleton-loader {
  width: 100%;
}

.skeleton-animated .skeleton-image,
.skeleton-animated .skeleton-title,
.skeleton-animated .skeleton-text,
.skeleton-animated .skeleton-avatar,
.skeleton-animated .skeleton-table-cell,
.skeleton-animated .skeleton-label,
.skeleton-animated .skeleton-input {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 卡片骨架屏 */
.skeleton-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background-color: #f0f0f0;
}

.skeleton-content {
  padding: 16px;
}

.skeleton-title {
  height: 24px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 12px;
}

.skeleton-text {
  height: 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-text.short {
  width: 60%;
}

/* 列表骨架屏 */
.skeleton-list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f0f0f0;
  margin-right: 16px;
  flex-shrink: 0;
}

.skeleton-list-content {
  flex: 1;
}

/* 表格骨架屏 */
.skeleton-table {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-table-header,
.skeleton-table-row {
  display: flex;
  gap: 8px;
  padding: 12px;
}

.skeleton-table-header {
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
}

.skeleton-table-row {
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-table-cell {
  flex: 1;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

/* 表单骨架屏 */
.skeleton-form {
  padding: 16px;
}

.skeleton-form-item {
  margin-bottom: 24px;
}

.skeleton-label {
  width: 100px;
  height: 16px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-input {
  width: 100%;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

/* 文本骨架屏 */
.skeleton-text-block {
  padding: 16px;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .skeleton-animated .skeleton-image,
  .skeleton-animated .skeleton-title,
  .skeleton-animated .skeleton-text,
  .skeleton-animated .skeleton-avatar,
  .skeleton-animated .skeleton-table-cell,
  .skeleton-animated .skeleton-label,
  .skeleton-animated .skeleton-input {
    background: linear-gradient(
      90deg,
      #2a2a2a 25%,
      #3a3a3a 50%,
      #2a2a2a 75%
    );
  }

  .skeleton-image,
  .skeleton-title,
  .skeleton-text,
  .skeleton-avatar,
  .skeleton-table-cell,
  .skeleton-label,
  .skeleton-input {
    background-color: #2a2a2a;
  }

  .skeleton-card,
  .skeleton-table {
    border-color: #3a3a3a;
  }

  .skeleton-list-item {
    border-bottom-color: #3a3a3a;
  }

  .skeleton-table-header {
    background-color: #1a1a1a;
    border-bottom-color: #3a3a3a;
  }

  .skeleton-table-row {
    border-bottom-color: #2a2a2a;
  }
}
</style>
