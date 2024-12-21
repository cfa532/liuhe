import { defineStore } from 'pinia'
// import { fetchWrapper } from '@/helpers';
import { router } from '@/router'
import { useAlertStore, useLeitherStore, useCaseListStore } from '@/stores'
const baseUrl = `${import.meta.env.VITE_API_URL}`

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        returnUrl: '/',
        token: localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')!) : {},
        // user object is used as indicator of login status.
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : '',
    }),
    getters: {
        userMid: (state)=> state.user.mid,
    },
    actions: {
        async login(username: string, password: string) {
            try {
                const lapi = useLeitherStore()
                const formData = new FormData()
                formData.append('username', username)
                formData.append('password', password)
                formData.append('client_id', await lapi.hostId)

                // login to the FastAPI server and get a security token.
                const resp = await window.fetch(`${baseUrl}/token`, { method: 'POST', body: formData })
                if (!resp.ok) throw new Error((await resp.json())['detail']) // assigned at server

                // problem when using fetchWrapper, incorrect Content-Type
                // const resp = await fetchWrapper.post(`${baseUrl}/token`, { username, password });
                const result = await resp.json()
                console.log(result)

                // update pinia state
                this.user = result.user
                this.token = result.token
                const userMid = await lapi.client.RunMApp("update_user", {aid: lapi.appId, ver: "last",
                    user: JSON.stringify(this.user)
                })
                // userMid is different from user's mid returned by authentication server.
                // Data node uses its own userMid to store chat data. Authentication server uses its
                // version of user mid to store user credentials. 
                result.user.mid = userMid

                // store user details and jwt in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(result.user))
                localStorage.setItem('token', JSON.stringify(result.token))
                localStorage.setItem("userMid", userMid)

                router.push(this.returnUrl || '/')
            } catch (error) {
                const alertStore = useAlertStore()
                console.error(error)
                alertStore.error(error)
                await this.logout()
            }
        },
        async logout() {
            try {
                const lapi = useLeitherStore()
                lapi.client.RunMApp("logout", {aid: lapi.appId, ver: "last", userid: this.userMid})  // do NOT wait for logout which will take a while.
                useCaseListStore().$reset()
                localStorage.clear()
                this.user = null
                this.token = null
                router.push('/account/login')
            } catch(e) {
                console.error(e)
                localStorage.clear()
                this.user = null
                this.token = null
            }
        },
    }
})
