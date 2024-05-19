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
            console.log(user)
            await fetchWrapper.post(`${baseUrl}/register`, user);
        },
        async getAll() {
            try {
                this.users = await fetchWrapper.get(baseUrl);
            } catch (error) {
                this.users = { error };
            }
        },
        async getById(id: string) {
            this.user = { loading: true };
            try {
                this.user = await fetchWrapper.get(`${baseUrl}/${id}`);
            } catch (error) {
                this.user = { error };
            }
        },
        async update(id: string, params: any) {
            console.log(id, params)
            await fetchWrapper.put(`${baseUrl}/${id}`, params);

            // update stored user if the logged in user updated their own record
            // const authStore = useAuthStore();
            // if (id === authStore.user!.username) {
            //     // update local storage
            //     const user = { ...authStore.user, ...params } as UserAccount;
            //     console.log(params, authStore.user, user)
            //     localStorage.setItem('user', JSON.stringify(user));

            //     // update auth user in pinia state
            //     authStore.user = user;
            // }
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
