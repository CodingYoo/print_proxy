import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 代码分割优化
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 细粒度的代码分割策略
        manualChunks: (id) => {
          // Vue 核心库
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vue-core'
          }
          // Vue Router
          if (id.includes('node_modules/vue-router/')) {
            return 'vue-router'
          }
          // Pinia 状态管理
          if (id.includes('node_modules/pinia/')) {
            return 'pinia'
          }
          // Naive UI 组件库
          if (id.includes('node_modules/naive-ui/')) {
            return 'naive-ui'
          }
          // Vicons 图标库
          if (id.includes('node_modules/@vicons/')) {
            return 'vicons'
          }
          // Axios 和网络请求相关
          if (id.includes('node_modules/axios/')) {
            return 'axios'
          }
          // 日期处理库
          if (id.includes('node_modules/date-fns')) {
            return 'date-fns'
          }
          // 其他第三方库
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
        },
        // 优化文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 优化依赖预构建
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'naive-ui',
      'date-fns'
    ],
    exclude: ['@vicons/ionicons5']
  }
})
