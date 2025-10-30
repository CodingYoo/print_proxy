/// <reference types="vite/client" />

/**
 * 环境变量类型定义
 * 为 import.meta.env 提供类型支持
 */
interface ImportMetaEnv {
  /** API 基础 URL */
  readonly VITE_API_BASE_URL: string
  /** 应用标题 */
  readonly VITE_APP_TITLE: string
  /** 应用版本 (自动注入) */
  readonly __APP_VERSION__: string
  /** 构建时间 (自动注入) */
  readonly __BUILD_TIME__: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * 全局常量定义
 */
declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string
