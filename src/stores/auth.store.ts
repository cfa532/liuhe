import { defineStore } from 'pinia';
// import { fetchWrapper } from '@/helpers';
import { router } from '@/router';
import { useAlertStore, useCaseStore, useCaseListStore, useLeitherStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        returnUrl: '/',
        mid: localStorage.getItem('mid')!,
        token: localStorage.getItem('token') ? JSON.parse(localStorage.getItem('token')!) : {},
        ppt: localStorage.getItem('session') ? JSON.parse(localStorage.getItem('session')!) : {},
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : "",    // user is used as indicator of login status.
    }),
    getters: {
    },
    actions: {
        async login(username:string, password:string) {
            try {
                const formData = new FormData();
                formData.append("username", username);
                formData.append("password", password);
                formData.append("client_id", "1234567890");
                const resp = await window.fetch(`${baseUrl}/token`, {method: "POST", body: formData})   
                
                // problem when using fetchWrapper, incorrect Content-Type
                // const resp = await fetchWrapper.post(`${baseUrl}/token`, { username, password });
                const result = await resp.json()

                // update pinia state
                this.user = result.user;
                this.token = result.token
                this.ppt = result.session

                // store user details and jwt in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem("token", JSON.stringify(result.token))
                localStorage.setItem("session", JSON.stringify(result.session))

                const lapi = useLeitherStore()
                this.mid = await lapi.client.MMCreate(await lapi.sid, '5KF-zeJy-KUQVFukKla8vKWuSoT', 'USER_MM', import.meta.env.VITE_USER_ACCOUNTS_KEY+'_'+this.user.username, 2, 0x07276704);
                localStorage.setItem("mid", this.mid)
                console.log("user mid", this.mid)

                // redirect to previous url or default to home page
                router.push(this.returnUrl || '/');
            } catch (error) {
                const alertStore = useAlertStore();
                alertStore.error(error);                
            }
        },

        logout() {
            useCaseStore().$reset()
            useCaseListStore().$reset()
            localStorage.removeItem('user');
            localStorage.removeItem("token")
            localStorage.removeItem("session")
            localStorage.removeItem('activeId');
            localStorage.removeItem('mid');
            this.user = null
            this.token = null
            this.ppt = null
            this.mid = ""
            router.push('/account/login');
        }
    }
});
