import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'

// import './assets/main.css'
import App from './App.vue'
// setup fake backend

import { fakeBackend } from './helpers';
fakeBackend();

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
