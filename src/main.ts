import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
console.warn("main.ts built....on " + __BUILD_TIME__, "ver:"+import.meta.env.VITE_APP_VERSION)
app.mount('#app')

