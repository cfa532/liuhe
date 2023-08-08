<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore } from '@/stores';
import { onMounted, watch } from 'vue';
import { MultiUploader } from '@/components';

const alertStore = useAlertStore();
const caseStore = storeToRefs(useCaseStore())
const route = useRoute();
const emits = defineEmits(["newCaseAdded"])     // to keep Vue from complaining

onMounted(async ()=>{
    await useCaseStore().initCase(route.params.id as string)     // update caseStore with current case data
    console.log(caseStore._value.value, route.params.id)
})
watch(()=>route.params.id, async (nv, ov)=>{
    if (nv!=ov && nv) {
        await useCaseStore().initCase(nv as string)
    }},
    // {deep: true}
)
</script>

<template>
<multi-uploader></multi-uploader>
<form>
<div class="container d-grid row-gap-3">
    <div class="row">
        <div class="col-8">
        <div class="card fs-6">
            <div class="card-header">
                {{ caseStore._value.value.title }}
            <div style="position: absolute; right: 0px; top:1px">
                <button type="button" data-bs-target="#myModal" class="btn btn-link" data-bs-toggle="modal">&nbsp;添加文件</button>
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
    <div class="row flex-nowrap">
        <div class="col-2">
            <select class="form-select text-secondary" aria-label="Default">
                <option value="1" selected>原告</option>
                <option value="2">被告</option>
                <option value="3">法官</option>
            </select>
        </div>
        <div class="col-6">
            <select class="form-select text-secondary" aria-label="Default">
                <option value="1" selected>原告</option>
                <option value="2">被告</option>
                <option value="3">法官</option>
            </select>
        </div>
    </div>
    <div class="row mt-1">
        <textarea rows="5" class="col-8"></textarea>
    </div>
    <div class="row">
        <div class="col-7"></div>
        <div class="col-1">
            <button>Submit</button>
        </div>
    </div>
</div>
</form>

<div class="row text-secondary mt-4">
    <div class="col">
        <div>chat history</div>
    </div>
</div>
</template>