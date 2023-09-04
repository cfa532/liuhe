<script setup lang="ts">
import { useAuthStore } from '@/stores';

const authStore = useAuthStore();
</script>

<template>
    <nav v-show="authStore.user" class="navbar navbar-expand navbar-dark bg-dark">
        <div class="navbar-nav">
            <router-link to="/" class="nav-item nav-link">首页</router-link>
            <router-link to="/users" class="nav-item nav-link">用户</router-link>
            <button style="position: absolute; right: 20px" @click="authStore.logout()" class="btn btn-link nav-item nav-link">退出</button>
        </div>
    </nav>
</template>