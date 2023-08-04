<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore } from '@/stores';
import { router } from '@/router';
import { onMounted, ref } from 'vue';

const alertStore = useAlertStore();
const caseStore = useCaseStore()
const route = useRoute();

onMounted(async ()=>{
    await caseStore.initCase(route.params.id as string)     // update caseStore with current case data
    console.log(caseStore._value)
})
</script>

<template>
    <div class="container">
        <p>{{ caseStore._value.title }}</p>
        <p>{{ caseStore._value.brief }}</p>
        <p>{{ caseStore._value.plaintiff }}</p>
        <p>{{ caseStore._value.defendant }}</p>
        <p>{{ caseStore._value.attorney }}</p>
        <p>{{ caseStore._value.judge }}</p>
    </div>
</template>