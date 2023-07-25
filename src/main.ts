import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import { useLeitherStore, useMainStore } from "@/stores"

// import './assets/main.css'
import App from './App.vue'

// setup Leither backend as database
import { leitherBackend } from './helpers';
leitherBackend();

const app = createApp(App)
app.use(createPinia())
app.use(router)

useLeitherStore().login().then((api)=>{
    const mainDBMid = import.meta.env.VITE_MIMEI_DB     // Mimei ID of main database that stores all users information
    useMainStore().init(api, mainDBMid)
    // Main DB is also initiated with a Leither object API
    app.mount('#app')
}, (err)=>{
    console.error(err)
    window.alert(err)
})

