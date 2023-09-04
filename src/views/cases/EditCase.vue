<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore, useAuthStore } from '@/stores';
import { onMounted, watch, ref, computed } from 'vue';
import { MultiUploader } from '@/components';
import { io, Socket } from "socket.io-client"
const emits = defineEmits(["newCaseAdded"])     //DO NOT remove. Keep Vue from complaining. 
const alertStore = useAlertStore();

const user = useAuthStore()
const userRole = ref("attorney")
const userTask = ref("t1")
const subTask = ref("task0")
const queryResult = ref()
const caseStore = storeToRefs(useCaseStore())
const route = useRoute();
const LLM_URL = import.meta.env.VITE_LLM_URL
const taskList = computed(()=>{
    // much easier to understand the logic here if looking at template.json in /assets.
    console.log("userRole=", userRole.value, userTask.value, subTask.value)
    // let s = userRole.value? userRole.value : "attorney"
    return Object.keys(user.user.template[userRole.value]).map((k:string)=>{
        return {...{}, [k]:user.user.template[userRole.value][k]["title"]}}     // create an obj given key and value
    )
})
const subTasklist = computed(()=>{
    const c = user.user.template[userRole.value][userTask.value]["content"]
    return Object.entries(c)
})
const taskContent = ref(user.user.template[userRole.value][userTask.value]["prompt"][subTask.value])

function submitQuery() {
    const caseStore = useCaseStore()
    const socket:Socket = io(LLM_URL)
    console.log(userRole.value, userTask.value, subTask.value)
    switch(userRole.value) {
        case "attorney":
            switch(userTask.value) {
                case "t1":      // 民事起诉
                    switch(subTask.value) {
                        case "task0":
                            socket.emit("case_info", caseStore.id, taskContent.value, async (resp:any)=>{
                                taskContent.value = resp
                                // use Hash of the case as Key, Field = userRole:userTask:subTask, content as value
                                const field = userRole.value+":"+userTask.value+":"+subTask.value
                                await caseStore.addTemplateItem(field, taskContent.value)
                            })
                            break;
                        default:
                    }
                    break;
                case "t2":      // 民事答辩
                    break;
                default:        // 刑事诉讼
            }
            break;
        default:            // judge
            console.log("judge")
    }
}
onMounted(async ()=>{
    const caseStore = useCaseStore()
    await caseStore.initCase(route.params.id as string)     // update caseStore with current case data
    console.log(caseStore._value, route.params.id, taskList.value)
    const field = userRole.value+":"+userTask.value+":"+subTask.value
    console.log(field)
    taskContent.value = await caseStore.getTemplateItem(field)
})
watch(()=>route.params.id, async (nv, ov)=>{
    // force changing of user case
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
        <div class="col">
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
        <div class="col-3">
            <select v-model="userTask" class="form-select text-secondary" aria-label="Default">
                <option v-for="t in taskList" :value="Object.keys(t)[0]" :key="Object.keys(t)[0]">{{ Object.values(t)[0] }}</option>
            </select>
        </div>
        <div class="col-4">
            <select v-model="subTask" class="form-select text-secondary" aria-label="Default">
                <option disabled value="=" selected>Please select one</option>
                <option v-for="t in subTasklist" :key="t[0]" :value="t[0]">{{ t[1] }}</option>
            </select>
        </div>
    </div>
    <div class="row mt-1">
        <textarea rows="8" class="col-10" v-model="taskContent"></textarea>
        <p></p>
        <div class="col-10">
            <button @click.prevent="submitQuery" style="position: relative; float: right;">Submit</button>
        </div>
    </div>
</div>
</form>

<div class="row text-secondary mt-4">
    <div class="col">
        <!-- <div>{{ queryResult }}</div> -->
    </div>
</div>
</template>