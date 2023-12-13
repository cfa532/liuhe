<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { router } from '@/router'
import { useAlertStore, useCaseStore } from '@/stores';
import { io, Socket } from "socket.io-client"
import { useRoute } from 'vue-router';

// const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
const caseStore = useCaseStore()
const alertStore = useAlertStore()
const route = useRoute();
const socket:Socket = io(import.meta.env.VITE_LLM_URL)
const query = ref()
const emits = defineEmits(["newCaseAdded"])     // add new case to list
const spinner = ref("提交")
const btnSubmit = ref()

async function onSubmit() {
    // send message to websoceket and wait for response
    console.log("Submit value: ", query.value)
    const ci = {} as ChatItem
    ci.Q = query.value? query.value : "query";        // query submitted to AI
    ci.A = ""
    if (!route.params.id) {
        // submit query to AI websocket and wait for reply
        socket.emit("gpt_api", caseStore.chatHistory, ci.Q, async (resp:any)=>{
            // console.log(resp)   // {query: refined query str, result: AI result}
            ci.A = resp
            const newId = await caseStore.createCase(ci)
            alertStore.success("New case added, " + caseStore.case)
            emits("newCaseAdded", newId)    // To have case list updated
            query.value = ""
            router.push("/case/edit/"+newId)
        })
    } else {
        socket.emit("gpt_api", caseStore.chatHistory, ci.Q, async (resp:any)=>{
            // console.log(resp)   // {query: refined query str, result: AI result}
            ci.A = resp
            caseStore.addChatItem(ci)
        })
    }
}
onMounted(()=>{
    console.log("Case Mounted", caseStore.mid)
    if (route.params.id) {
        // load chat history of a particular case
        caseStore.initCase(route.params.id as string)
    }
})
watch(()=>route.params.id, async (nv, ov)=>{
    // force changing of user case
    if (nv!=ov) {
        await caseStore.initCase(nv as string)
        console.log(caseStore.case)
    }},
)
</script>

<template>
<!-- <Uploader @newCaseValues="data=>formValues=data"></Uploader> -->
<form>
<div class="container d-grid row-gap-3">
    <div class="row">
        <div class="col">
        <div class="card fs-6">
            <div class="card-header">
                人机对话
                <div style="position: absolute; right: 0px; top:1px">
                    <button type="button" data-bs-target="#myModal" class="btn btn-link" data-bs-toggle="modal">&nbsp;添加文件</button>
                </div>
            </div>
        </div>
        </div>
    </div>
    <div class="row mt-2">
        <textarea rows="8" class="col" v-model="query" placeholder="Ask me...."></textarea>
        <p></p>
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
</div>
</form>

<div class="row text-secondary mt-4">
    <div class="row" v-for="(ci, index) in caseStore.chatHistory" :key="index">
        <div><label>Q:&nbsp;</label>{{ ci.Q }}</div>
        <div><label>A:&nbsp;</label>{{ ci.A }}</div>
        <p></p>
    </div>
</div>
</template>