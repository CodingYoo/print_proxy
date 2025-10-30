import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [
      vue(),
      // 仅在开发环境启用 DevTools
      mode === 'development' && vueDevTools(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // 生产环境禁用 sourcemap，开发环境可选启用
      sourcemap: mode === 'development',
      // 代码分割优化
      chunkSizeWarningLimit: 1000,
      // 启用压缩
      minify: 'esbuild',
      // esbuild 压缩选项
      esbuildOptions: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      // 目标浏览器
      target: 'es2015',
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
          // 优化文件命名 - 使用内容哈希以支持长期缓存
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // 根据文件类型组织目录结构
            const info = assetInfo.name?.split('.') || []
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash].[ext]`
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `fonts/[name]-[hash].[ext]`
            }
            return `assets/[name]-[hash].[ext]`
          }
        }
      },
      // 启用 CSS 代码分割
      cssCodeSplit: true,
      // CSS 压缩
      cssMinify: true,
      // 优化依赖预构建
      commonjsOptions: {
        include: [/node_modules/]
      },
      // 资源内联阈值 (4kb)
      assetsInlineLimit: 4096,
      // 清空输出目录
      emptyOutDir: true,
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
    },
    // 定义全局常量替换
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    }
  }
})
