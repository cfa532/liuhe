import { defineStore } from 'pinia';

import { fetchWrapper } from '@/helpers';
import { router } from '@/router';
import { useAlertStore, useCaseStore, useCaseListStore } from '@/stores';

// const baseUrl = `${import.meta.env.VITE_API_URL}/users`;
const baseUrl = '/users'

export const useAuthStore = defineStore({
    id: 'auth',
    state: () => ({
        // initialize state from local storage to enable user to stay logged in
        user: JSON.parse(localStorage.getItem('user')!),
        returnUrl: '/',
    }),
    getters: {
        mid: function(state) { return state.user.mid },
    },
    actions: {
        async login(username:string, password:string) {
            try {
                const user = await fetchWrapper.post(`${baseUrl}/authenticate`, { username, password });    
                console.log(user)
                // update pinia state
                this.user = user;

                // store user details and jwt in local storage to keep user logged in between page refreshes
                localStorage.setItem('user', JSON.stringify(user));

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
            router.push('/account/login');
            this.user = null as any;
        }
    }
});

function deepParse(u: UserAccount) {
    if (u) {
        console.log(u)
        // u.template = JSON.parse(u.template)
        return JSON.parse(JSON.stringify(u))
    }
    return u
}