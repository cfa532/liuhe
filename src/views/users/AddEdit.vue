<script setup lang="ts">
import { ref } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';

import { useUsersStore, useAlertStore, useAuthStore } from '@/stores';
import { router } from '@/router';

const usersStore = useUsersStore();
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;
const user = ref()
let title = 'Add User';

if (id) {
    // edit mode
    title = 'Edit User';
    user.value = usersStore.users.find((e: any)=>e.username==id)
    // user.value = useAuthStore().user;
    // usersStore.getById(id as string);
}

const schema = Yup.object().shape({
    family_name: Yup.string()
        .required('姓氏必填'),
    given_name: Yup.string()
        .required('名字必填'),
    username: Yup.string()
        .required('用户名必填'),
    password: Yup.string()
        .transform(x => x === '' ? undefined : x)
        // password optional in edit mode
        .concat(user.value? null : Yup.string().required('Password is required') as any)
        .min(6, 'Password must be at least 6 characters')
});

async function onSubmit(values:any) {
    try {
        let message;
        if (user.value) {
            await usersStore.update(user.value.username, values)
            message = 'User updated';
        } else {
            await usersStore.register(values);
            message = 'User added';
        }
        await router.push('/users');
        alertStore.success(message);
    } catch (error) {
        alertStore.error(error);
    }
}
</script>

<template>
    <h1>{{title}}</h1>
    <template v-if="!(user?.loading || user?.error)">
        <Form @submit="onSubmit" :validation-schema="schema" :initial-values="user" v-slot="{ errors, isSubmitting }">
            <div class="form-row">
                <div class="form-group col">
                    <label>姓</label>
                    <Field name="family_name" type="text" class="form-control" :class="{ 'is-invalid': errors.family_name }" />
                    <div class="invalid-feedback">{{ errors.family_name }}</div>
                </div>
                <div class="form-group col">
                    <label>名</label>
                    <Field name="given_name" type="text" class="form-control" :class="{ 'is-invalid': errors.given_name }" />
                    <div class="invalid-feedback">{{ errors.given_name }}</div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group col">
                    <label>用户名</label>
                    <Field name="username" type="text" class="form-control" :class="{ 'is-invalid': errors.username }" />
                    <div class="invalid-feedback">{{ errors.username }}</div>
                </div>
                <div class="form-group col">
                    <label>
                        密码
                        <em v-if="user">(Leave blank to keep the same password)</em>
                    </label>
                    <Field name="password" type="password" class="form-control" :class="{ 'is-invalid': errors.password }" />
                    <div class="invalid-feedback">{{ errors.password }}</div>
                </div>
            </div>
            <div class="form-group">
                <button class="btn btn-primary" :disabled="isSubmitting">
                    <span v-show="isSubmitting" class="spinner-border spinner-border-sm mr-1"></span>
                    Save
                </button>
                <router-link to="/users" class="btn btn-link">Cancel</router-link>
            </div>
        </Form>
    </template>
    <template v-if="user?.loading">
        <div class="text-center m-5">
            <span class="spinner-border spinner-border-lg align-center"></span>
        </div>
    </template>
    <template v-if="user?.error">
        <div class="text-center m-5">
            <div class="text-danger">Error loading user: {{user.error}}</div>
        </div>
    </template>
</template>
