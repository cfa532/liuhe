import { defineStore } from 'pinia';
import { fetchWrapper } from '@/helpers';
import { useAuthStore } from '@/stores';
import llmTemplate from '../assets/template.json'

const baseUrl = `${import.meta.env.VITE_API_URL}/users`;

export const useUsersStore = defineStore({
    id: 'users',
    state: () => ({
        users: {} as any,
        user: {} as any
    }),
    actions: {
        async register(user: any) {
            user.role = "user"
            if (user.username == "admin") user.role = "admin"
            user.subscription = false
            user.family_name = user.familyName
            user.given_name = user.givenName
            user.template = llmTemplate
            delete user.familyName
            delete user.givenName
            user.token_count = {"gpt-3.5": 1000000, "gpt-4-turbo": 100000}
            user.token_usage = {"gpt-3.5": 0, "gpt-4-turbo": 0}
            console.log(user)
            await fetchWrapper.post(`${baseUrl}/register`, user);
        },
        async getAll() {
            try {
                this.users = await fetchWrapper.get(`${baseUrl}/all`);
                this.users.forEach((user: any) => {
                    user.familyName = user.family_name
                    user.givenName  = user.given_name
                    delete user.family_name
                    delete user.given_name
                });
            } catch (error) {
                this.users = { error };
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
            const user = params
            user.family_name = user.familyName
            user.given_name = user.givenName
            user.template = llmTemplate
            delete user.familyName
            delete user.givenName
            await fetchWrapper.put(`${baseUrl}`, user);
        },
        async delete(id: string) {
            if (window.confirm("Are you sure?")) {
                console.log("Deleting user", id)

                // add isDeleting prop to user being deleted
                this.users.find((x: any) => x.username === id).isDeleting = true;
                await fetchWrapper.delete(`${baseUrl}/${id}`);

                // remove user from list after deleted
                this.users = this.users.filter((x: any) => x.username !== id);

                // auto logout if the logged in user deleted their own record
                const authStore = useAuthStore();
                if (id === authStore.user.username) {
                    authStore.logout();
                }
            }
        }
    }
});
