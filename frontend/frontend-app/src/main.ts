import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { naive } from './naive-ui'
import { setupApp, initializeAuth } from './utils/app-setup'
import { permissionDirective, roleDirective } from './directives/permission'
import './style.css'

const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(naive)

// 注册全局指令
app.directive('permission', permissionDirective)
app.directive('role', roleDirective)

// 应用设置
setupApp(app)

// 挂载应用
app.mount('#app')

// 初始化认证状态
initializeAuth()
