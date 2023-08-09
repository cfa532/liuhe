<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore, useAuthStore } from '@/stores';
import { onMounted, watch, ref, computed } from 'vue';
import { MultiUploader } from '@/components';
const emits = defineEmits(["newCaseAdded"])     //DO NOT remove. to keep Vue from complaining. 
const alertStore = useAlertStore();

const user = useAuthStore()
const userRole = ref("attorney")
const userTask = ref("t1")
const caseStore = storeToRefs(useCaseStore())
const route = useRoute();
const taskList = computed(()=>{
    console.log("userRole=", userRole.value, userTask.value)
    // let s = userRole.value? userRole.value : "attorney"
    return Object.keys(user.user.template[userRole.value]).map((k:string)=>{
        return {...{}, [k]:user.user.template[userRole.value][k]["title"]}}     // create an obj with key and value
    )
})
const userSubtasks = computed(()=>{
    const c = user.user.template[userRole.value][userTask.value]["content"]
    return JSON.stringify(c)
})
onMounted(async ()=>{
    await useCaseStore().initCase(route.params.id as string)     // update caseStore with current case data
    console.log(caseStore._value.value, route.params.id, taskList.value)
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
            <select v-model="userRole" class="form-select text-secondary" aria-label="Default">
                <option value="attorney" selected>律师</option>
                <option value="judge">法官</option>
            </select>
        </div>
        <div class="col-6">
            <select v-model="userTask" class="form-select text-secondary" aria-label="Default">
                <option disabled value="=">Please select one</option>
                <option v-for="t in taskList" :value="Object.keys(t)[0]" :key="Object.keys(t)[0]">{{ Object.values(t)[0] }}</option>
            </select>
        </div>
    </div>
    <div class="row mt-1">
        <textarea rows="5" class="col-8" v-model="userSubtasks"></textarea>
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
        <div>{{ userSubtasks }}</div>
    </div>
</div>
</template>