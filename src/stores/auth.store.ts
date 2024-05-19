import { defineStore } from 'pinia';
import { fetchWrapper } from '@/helpers';
import { router } from '@/router';
import { useAlertStore, useCaseStore, useCaseListStore } from '@/stores';
const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        user: JSON.parse(localStorage.getItem('user')!),
        returnUrl: '/',
        token: JSON.parse(localStorage.getItem('token')!)
    }),
    getters: {
        mid: state => state.user.mid,
    },
    actions: {
        async login(username:string, password:string) {
            try {
                const formData = new FormData();
                formData.append("username", username);
                formData.append("password", password);
                const resp = await window.fetch(`${baseUrl}/token`, {method: "POST", body: formData})
                // const resp = await fetchWrapper.post(`${baseUrl}/token`, { username, password });
                const result = await resp.json()
                // update pinia state
                this.user = result.user;
                this.token = result.token

                // store user details and jwt in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem("token", JSON.stringify(result.token))

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
            localStorage.removeItem('activeId');
            localStorage.removeItem("token")
            sessionStorage.removeItem("sid")
            router.push('/account/login');
            this.user = null as any;
        }
    }
});
