import { defineStore } from 'pinia'
// import { fetchWrapper } from '@/helpers';
import { router } from '@/router'
import { useAlertStore, useCaseStore, useCaseListStore, useLeitherStore } from '@/stores'
const baseUrl = `${import.meta.env.VITE_API_URL}`

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        returnUrl: '/',
        mid: localStorage.getItem('mid')!,
        token: localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')!) : {},
        ppt: localStorage.getItem('ppt'),
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : '' // user is used as indicator of login status.
    }),
    getters: {},
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
                if (!resp.ok) throw new Error((await resp.json())['detail'])

                // problem when using fetchWrapper, incorrect Content-Type
                // const resp = await fetchWrapper.post(`${baseUrl}/token`, { username, password });
                const result = await resp.json()
                console.log(result)

                // update pinia state
                this.user = result.user
                this.token = result.token
                this.ppt = result.ppt // PPT signed by server Leither
                // this.mid = result.user.mid
                this.mid = await lapi.getMid(this.ppt as string)

                // store user details and jwt in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(result.user))
                localStorage.setItem('token', JSON.stringify(result.token))
                localStorage.setItem('ppt', result.ppt) // PPT string
                localStorage.setItem('mid', this.mid)

                // lapi.sid() must be run after user get its ppt from server. It gets PPT from localStorage
                lapi.client.MiMeiSync(await lapi.sid(), '', this.mid)
                router.push(this.returnUrl || '/')
            } catch (error) {
                const alertStore = useAlertStore()
                console.error(error)
                alertStore.error(error)
                this.logout()
            }
        },
        logout() {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            localStorage.removeItem('ppt')
            localStorage.removeItem('activeId')
            localStorage.removeItem('mid')
            this.user = null
            this.token = null
            this.ppt = null
            this.mid = ''
            useCaseStore().$reset()
            useCaseListStore().$reset()
            router.push('/account/login')
        },
        hasPPTExpired() {
            // PPT receieved from Authentication server upon login.
            //'CertFor=Self;EndTime=20240608150543UTC;NodeId=5nE6CTAgEhR696x-ZpmRzFUZbkk;SignTime=20240607150543UTC;'
            const endTime = stringToDictionary(JSON.parse(this.ppt!).Data).EndTime
            const now = new Date()
            const year = now.getFullYear().toString().padStart(4, '0')
            const month = (now.getMonth() + 1).toString().padStart(2, '0') // Months are 0-indexed
            const day = now.getDate().toString().padStart(2, '0')
            const hours = now.getHours().toString().padStart(2, '0')
            const minutes = now.getMinutes().toString().padStart(2, '0')
            const seconds = now.getSeconds().toString().padStart(2, '0')
            const nowTime = `${year}${month}${day}${hours}${minutes}${seconds}UTC`
            if (endTime < nowTime) {
                console.warn('PPT expired', nowTime, endTime)
                return true
            }
            return false
        },
        hasTokenExpired() {
            return false    // not used
            // Token received from Authentication server upon login.
            const arrayToken = this.token.access_token.split('.')
            const tokenPayload = JSON.parse(atob(arrayToken[1]))
            if (Date.now() / 1000 >= tokenPayload?.exp) {
                console.warn('Token expired', tokenPayload?.exp)
                return true
            }
            return false
        }
    }
})

interface Dictionary {
    [key: string]: string
}

function stringToDictionary(str: string): Dictionary {
    const dictionary: Dictionary = {}
    const pairs: string[] = str.split(';')

    pairs.forEach((pair) => {
        if (pair) {
            const [key, value] = pair.split('=')
            dictionary[key] = value
        }
    })
    return dictionary
}
