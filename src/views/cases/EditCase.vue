<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore } from '@/stores';
import { router } from '@/router';
import { onMounted, watch } from 'vue';

const alertStore = useAlertStore();
const caseStore = storeToRefs(useCaseStore())
const route = useRoute();

onMounted(async ()=>{
    await useCaseStore().initCase(route.params.id as string)     // update caseStore with current case data
    console.log(caseStore._value.value)
})
watch(()=>route.params.id, async (nv, ov)=>{
    if (nv != ov) {
        await useCaseStore().initCase(nv as string)
        console.log(caseStore._value.value)
    }},
    {deep: true}
)
</script>

<template>
    <div class="container">
        <p>{{ caseStore._value.value.title }}</p>
        <p>{{ caseStore._value.value.brief }}</p>
        <p>{{ caseStore._value.value.plaintiff }}</p>
        <p>{{ caseStore._value.value.defendant }}</p>
        <p>{{ caseStore._value.value.attorney }}</p>
        <p>{{ caseStore._value.value.judge }}</p>
        <form>
            <input>
        </form>
    </div>
    <div>
        <div>chat history</div>
    </div>
</template>