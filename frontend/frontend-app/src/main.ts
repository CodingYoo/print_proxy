import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { naive } from './naive-ui'
import { setupApp, initializeAuth } from './utils/app-setup'
import './style.css'

const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(naive)

// 应用设置
setupApp(app)

// 挂载应用
app.mount('#app')

// 初始化认证状态
initializeAuth()
