<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUsersStore } from '@/stores';

const usersStore = useUsersStore();
const { users } = storeToRefs(usersStore);

usersStore.getAll();
</script>

<template>
    <h1>Users</h1>
    <router-link to="/users/add" class="btn btn-sm btn-success mb-2">Add User</router-link>
    <table class="table table-striped">
        <thead>
            <tr>
                <th style="width: 25%">姓氏</th>
                <th style="width: 25%">名</th>
                <th style="width: 20%">用户名</th>
                <th style="width: 20%">类型</th>
                <th style="width: 10%"></th>
            </tr>
        </thead>
        <tbody>
            <template v-if="users.length">
                <tr v-for="user in users" :key="user.username">
                    <td>{{ user.family_name }}</td>
                    <td>{{ user.given_name }}</td>
                    <td>{{ user.username }}</td>
                    <td>{{ user.role }}</td>
                    <td style="white-space: nowrap">
                        <router-link :to="`/users/edit/${user.username}`" class="btn btn-sm btn-primary mr-1">Edit</router-link>&nbsp;
                        <button @click="usersStore.delete(user.username)" class="btn btn-sm btn-danger btn-delete-user" :disabled="user.isDeleting">
                            <span v-if="user.isDeleting" class="spinner-border spinner-border-sm"></span>
                            <span v-else>Delete</span>
                        </button>
                    </td>
                </tr>
            </template>
            <tr v-if="users.loading">
                <td colspan="4" class="text-center">
                    <span class="spinner-border spinner-border-lg align-center"></span>
                </td>
            </tr>
            <tr v-if="users.error">
                <td colspan="4">
                    <div class="text-danger">Error loading users: {{users.error}}</div>
                </td>
            </tr>            
        </tbody>
    </table>
</template>
