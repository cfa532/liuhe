<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore } from '@/stores';
import { onMounted, watch } from 'vue';

const alertStore = useAlertStore();
const caseStore = storeToRefs(useCaseStore())
const route = useRoute();

onMounted(async ()=>{
    await useCaseStore().initCase(route.params.id as string)     // update caseStore with current case data
    console.log(caseStore._value.value)
})
watch(()=>route.params.id, async (nv, ov)=>{
    if (nv!=ov && nv) {
        await useCaseStore().initCase(nv as string)
    }},
    // {deep: true}
)
</script>

<template>
    <div class="container">
    <div class="card" style="width: 40rem;">
        <div class="card-header">
            {{ caseStore._value.value.title }}
        </div>
        <ul class="list-group list-group-flush">
        <li class="list-group-item">{{ caseStore._value.value.brief }}</li>
        <li class="list-group-item">原告：{{ caseStore._value.value.plaintiff }}</li>
        <li class="list-group-item">被告：{{ caseStore._value.value.defendant }}</li>
        <li v-if="caseStore._value.value.judge" class="list-group-item">主审：{{ caseStore._value.value.judge }}</li>
    </ul>
    </div>
        <form>
            <input>
        </form>
    </div>
    <div class="container" >
        <div>chat history</div>
    </div>
</template>