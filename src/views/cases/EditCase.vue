<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useUsersStore, useAlertStore } from '@/stores';
import { router } from '@/router';

const usersStore = useUsersStore();
const alertStore = useAlertStore();
const route = useRoute();
const id = route.params.id;

let title = 'Add User';
let user:any = null;
if (id) {
    // edit mode
    title = '案件';
    ({ user } = storeToRefs(usersStore));
    usersStore.getById(id as string);
}
</script>

<template>
    <div></div>
</template>