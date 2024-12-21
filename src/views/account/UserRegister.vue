<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';

import { useUsersStore, useAlertStore } from '@/stores';
import { router } from '@/router';

const schema = Yup.object().shape({
    family_name: Yup.string()
        .required('Family Name is required'),
    given_name: Yup.string()
        .required('Given Name is required'),
    username: Yup.string()
        .required('Username is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
});

async function onSubmit(values: any) {
    const usersStore = useUsersStore();
    const alertStore = useAlertStore();
    try {
        await usersStore.register(values);
        await router.push('/account/login');
        alertStore.success('Registration successful');
    } catch (error) {
        alertStore.error("Registration error: "+ error);
    }
}
</script>

<template>
    <div class="card m-3">
        <h4 class="card-header">注册</h4>
        <div class="card-body">
            <Form @submit="onSubmit" :validation-schema="schema" v-slot="{ errors, isSubmitting }">
                <div class="form-group" style="margin-top: 0px;">
                    <label>姓氏</label>
                    <Field name="family_name" type="text" class="form-control" :class="{ 'is-invalid': errors.family_name }" />
                    <div class="invalid-feedback">{{ errors.family_name }}</div>
                </div>
                <div class="form-group">
                    <label>名</label>
                    <Field name="given_name" type="text" class="form-control" :class="{ 'is-invalid': errors.given_name }" />
                    <div class="invalid-feedback">{{ errors.given_name }}</div>
                </div>
                <div class="form-group">
                    <label>用户名</label>
                    <Field name="username" type="text" class="form-control" :class="{ 'is-invalid': errors.username }" />
                    <div class="invalid-feedback">{{ errors.username }}</div>
                </div>
                <div class="form-group">
                    <label>密码</label>
                    <Field name="password" type="password" class="form-control" :class="{ 'is-invalid': errors.password }" />
                    <div class="invalid-feedback">{{ errors.password }}</div>
                </div>
                <div class="form-group">
                    <button class="btn btn-primary" :disabled="isSubmitting">
                        <span v-show="isSubmitting" class="spinner-border spinner-border-sm mr-1"></span>
                        注册
                    </button>
                    <router-link to="login" class="btn btn-link">取消</router-link>
                </div>
            </Form>
        </div>
    </div>
</template>
