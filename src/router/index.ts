// export { router } from './router'

import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore, useAlertStore } from '@/stores';
import accountRoutes from '@/router/account';
import usersRoutes from '@/router/users';
import caseRoutes from '@/router/case'
import { Home, IPs } from '@/views';

export const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    linkActiveClass: 'active',
    routes: [
        { path: '/', component: Home },
        { path: '/IPs', component: IPs},
        { ...caseRoutes },
        { ...accountRoutes },
        { ...usersRoutes },
        // catch all redirect to home page
        { path: '/:pathMatch(.*)*', redirect: '/' }
    ]
});

router.beforeEach((to) => {
    // console.log("to:", to, window.location)
    // clear alert on route change
    const alertStore = useAlertStore();
    alertStore.clear();

    // redirect to login page if not logged in and trying to access a restricted page 
    const publicPages = ['/account/login', '/account/register'];
    const authRequired = !publicPages.includes(to.path);
    const authStore = useAuthStore();
    if (authRequired && !authStore.user) {
        authStore.returnUrl = to.fullPath;
        return '/account/login';
    }
});
