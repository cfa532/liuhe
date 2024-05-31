import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/router'
import { useAlertStore } from "@/stores"
import App from './App.vue'

// setup Leither backend as database
// import { leitherBackend } from './helpers';

const app = createApp(App)
app.use(createPinia())

// leitherBackend();   // init customize backend fetch with Leither function

app.use(router)
app.config.errorHandler = async (err, instance, info) => {
    // Handle the error globally. It will hinder the display of some error message.
    // but it is useful to show alert on front end.
    console.error("Global error:", err);
    console.log("Vue instance:", instance);
    console.log("Error info:", info);
    useAlertStore().error(err + ". Try reload.")
}
console.warn("main.ts built....on " + __BUILD_TIME__, "ver:"+import.meta.env.VITE_APP_VERSION)
// const lapi = useLeitherStore()
app.mount('#app')

// try {
//     if (await lapi.sid) {
//         console.log(lapi.$state, "sid=" + await lapi.sid)
//         app.mount('#app')
//     } else {
//         lapi.login().then(()=>{
//             console.log(lapi.$state)
//             app.mount('#app')
//         })
//     }
// } catch(err) {
//     lapi.logout()
//     console.error(err)
//     window.alert(err)
//     router.push("/account")
// }