<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore } from '@/stores';
import { router } from '@/router';
import { onMounted, ref } from 'vue';

const alertStore = useAlertStore();
const route = useRoute();

onMounted(async ()=>{
    const caseStore = useCaseStore()
    caseStore.init()
    console.log(caseStore)
    await caseStore.initCase(route.params.id as string)
    console.log(caseStore._value)
})
</script>

<template>
    <div>
    </div>
</template>