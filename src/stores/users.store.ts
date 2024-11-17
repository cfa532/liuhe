import { defineStore } from 'pinia';
import { fetchWrapper } from '@/helpers';
import { useAuthStore, useAlertStore } from '@/stores';
import llmTemplate from '../assets/template.json'

const baseUrl = `${import.meta.env.VITE_API_URL}/users`;

export const useUsersStore = defineStore({
    id: 'users',
    state: () => ({
        users: {} as any,
        user: {} as any,
        alertStore: useAlertStore()
    }),
    actions: {
        async register(user: any) {
            user.role = "user"
            if (user.username == "admin")
                user.role = "admin"
            user.subscription = false
            user.template = llmTemplate
            user.token_count = { "gpt-3.5-turbo": 1000000, "gpt-4-turbo": 100000, "gpt-4": 100000 }
            user.token_usage = { "gpt-3.5-turbo": 0, "gpt-4-turbo": 0, "gpt-4": 0 }
            await fetchWrapper.post(`${baseUrl}/register`, user)
        },
        async getAll() {
            try {
                this.users = await fetchWrapper.get(`${baseUrl}/all`);
            } catch (error) {
                this.users = { error };
                // this.alertStore.error(error)
            }
        },
        async getById(id: string) {
            this.user = { loading: true };
            try {
                this.user = await fetchWrapper.get(`${baseUrl}?id=${id}`);
            } catch (error) {
                this.user = { error };
            }
        },
        async update(id: string, params: any) {
            console.log(id, params)
            this.user = await fetchWrapper.put(`${baseUrl}`, params);   // update settings in server.
            localStorage.setItem("user", JSON.stringify(this.user))     // update settings in memory.
        },
        async delete(id: string) {
            if (window.confirm("Are you sure?")) {
                try {
                    // add isDeleting prop to user being deleted
                    this.users.find((x: any) => x.username === id).isDeleting = true;
                    await fetchWrapper.delete(`${baseUrl}/${id}`);

                    // remove user from list after deleted
                    this.users = this.users.filter((x: any) => x.username !== id);

                    // auto logout if the logged in user deleted their own record
                    const authStore = useAuthStore();
                    if (id === authStore.user.username) {
                        await authStore.logout();
                    }
                } catch (e) {
                    this.alertStore.error(e)
                }
            }
        }
    }
});
