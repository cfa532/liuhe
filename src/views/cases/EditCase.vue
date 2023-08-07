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
function uploadFiles() {

}
</script>

<template>
<div class="container d-grid row-gap-3">
    <div class="row">
        <div class="col">
        <div class="card fs-6" style="width: 40rem;">
            <div class="card-header">
                {{ caseStore._value.value.title }}
            <div style="position: absolute; right: 0px; top:1px">
                <button type="button" @click="uploadFiles" class="btn btn-link">&nbsp;添加文件</button>
            </div>
            </div>
            <ul class="list-group list-group-flush">
                <li class="list-group-item text-secondary">{{ caseStore._value.value.brief }}</li>
                <li class="list-group-item text-secondary">原告：{{ caseStore._value.value.plaintiff }}</li>
                <li class="list-group-item text-secondary">被告：{{ caseStore._value.value.defendant }}</li>
                <li v-if="caseStore._value.value.judge" class="list-group-item text-secondary">主审：{{ caseStore._value.value.judge }}</li>
            </ul>
        </div>
        </div>
    </div>
    <div class="row">
        <div class="col">
        <form>
            <input>
        </form>
    </div>
    </div>
    <div class="row text-secondary">
        <div class="col">
        <div>chat history</div>
    </div>
    </div>
</div>


</template>