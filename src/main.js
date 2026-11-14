import { createApp } from 'vue'

// 补全动态弹窗和消息提示的样式
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
