import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import { useLeitherStore, useMainStore } from "@/stores"
import App from './App.vue'

// setup Leither backend as database
import { leitherBackend } from './helpers';
leitherBackend();

const app = createApp(App)
app.use(createPinia())
app.use(router)
// app.use(VueAxios, axios)
// app.provide('axios', app.config.globalProperties.axios)

useLeitherStore().login().then((api)=>{
    window.lapi = api
    // Main DB is also initiated with a Leither object API
    useMainStore().init(api, import.meta.env.VITE_MIMEI_DB)
    app.mount('#app')
}, (err)=>{
    console.error(err)
    window.alert(err)
})

