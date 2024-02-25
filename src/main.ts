import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import { useLeitherStore } from "@/stores"
import App from './App.vue'

// setup Leither backend as database
import { leitherBackend } from './helpers';

const app = createApp(App)
app.use(createPinia())
leitherBackend();   // init backend after Pinia
app.use(router)
console.warn("main.ts built....on " + __BUILD_TIME__, "ver:"+import.meta.env.VITE_APP_VERSION)
const lapi = useLeitherStore()

try {
    if (lapi.sid) {
        console.log(lapi.$state, "sid="+lapi.sid)
        app.mount('#app')
    } else {
        lapi.login().then(()=>{
            console.log(lapi.$state)
            app.mount('#app')
        })
    }
} catch(err) {
    lapi.logout()
    console.error(err)
    window.alert(err)
    router.push("/account")
}