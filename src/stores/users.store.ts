import { defineStore } from 'pinia';
import { fetchWrapper } from '@/helpers';
import { useAuthStore } from '@/stores';


// const baseUrl = `${import.meta.env.VITE_API_URL}/users`;
const baseUrl = '/users'
export const useUsersStore = defineStore({
    id: 'users',
    state: () => ({
        users: {} as any,
        user: {} as any
    }),
    actions: {
        async register(user: any) {
            await fetchWrapper.post(`${baseUrl}/register`, user);
        },
        async getAll() {
            try {
                this.users = await fetchWrapper.get(baseUrl);
            } catch (error) {
                this.users = { error };
            }
        },
        async getById(id:string) {
            this.user = { loading: true };
            try {
                this.user = await fetchWrapper.get(`${baseUrl}/${id}`);
            } catch (error) {
                this.user = { error };
            }
        },
        async update(id:string, params:[]) {
            await fetchWrapper.put(`${baseUrl}/${id}`, params);

            // update stored user if the logged in user updated their own record
            const authStore = useAuthStore();
            if (id === authStore.user!.username) {
                // update local storage
                const user = { ...authStore.user, ...params } as UserAccount;
                localStorage.setItem('user', JSON.stringify(user));

                // update auth user in pinia state
                authStore.user = user;
            }
        },
        // depreciated
        async delete(id:string) {
            console.log(id)
            return 
            
            // // add isDeleting prop to user being deleted
            // this.users.find((x:any) => x.id === id).isDeleting = true;

            // await fetchWrapper.delete(`${baseUrl}/${id}`);

            // // remove user from list after deleted
            // this.users = this.users.filter((x:any) => x.id !== id);

            // // auto logout if the logged in user deleted their own record
            // const authStore = useAuthStore();
            // if (id === authStore.user.id) {
            //     authStore.logout();
            // }
        }
    }
});
