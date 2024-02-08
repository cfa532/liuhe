<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useCaseStore, useCaseListStore } from '@/stores';
import { io, Socket } from "socket.io-client"
import { useRoute } from 'vue-router';
import { Share } from '@/components'

// const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
const emits = defineEmits(["newCaseId"])     // add new case to list
const caseList = useCaseListStore()
const caseStore = useCaseStore()
const route = useRoute();
const query = ref()
const stream_in = ref("")

const spinner = ref("提交")
const btnSubmit = ref()
const socket:Socket = io(import.meta.env.VITE_LLM_URL)
socket.on("stream_in", r=>{
        stream_in.value += r;
        // console.log(r)
    })

async function onSubmit() {
    // send message to websoceket and wait for response
    const chatHistory = caseStore.chatHistory.map(e=>{return {...e}})
    stream_in.value = ""
    console.log("Submit value: ", query.value, caseStore.chatHistory)
    const ci = {} as ChatItem
    ci.Q = query.value? query.value : "Hello";        // query submitted to AI
    ci.A = ""
    // caseStore.chatHistory.unshift(ci)

    socket.emit("gpt_api", chatHistory, ci.Q, async (resp:any)=>{
        console.log(resp)   // {query: refined query str, result: AI result}
        ci.A = resp
        caseStore.addChatItem(ci)
        // console.log(caseStore.chatHistory)
        query.value = ""
        stream_in.value = ""
    })
}
onMounted(()=>{
    console.log("Case Mounted", caseStore.mid)
    // load chat history of a particular case
    caseStore.initCase(route.params.id as string)
})
watch(()=>route.params.id, async (nv, ov)=>{
    // force changing of user case
    if (nv && nv!=ov) {
        await caseStore.initCase(nv as string)
        console.log(caseStore.case)
    }},
)
async function deletePost() {
    await caseList.deleteCase(route.params.id as string)
    emits("newCaseId", "0")
}
</script>

<template>
<form>
<div class="container d-grid row-gap-3">
    <div class="row">
        <div class="col">
        <div class="card fs-6">
            <div class="card-header">
                <div style="display: inline-block; width: 95%;">{{ caseStore.case.brief }}</div>
                <div style=" display: inline-block; position: relative; text-align: right;">
                    <Share @delete-post="deletePost"></Share>
                </div>                
            </div>
        </div>
        </div>
    </div>
    <div class="row mt-2">
        <textarea rows="4" class="col" v-model="query" placeholder="Ask me...."></textarea>
        <p></p>
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
</div>
</form>

<div class="row text-secondary mt-4">
    <div class="row" v-if="stream_in.length>0">
        <div style="white-space: pre-wrap;"><label>A:&nbsp;</label>{{ stream_in }}</div>
        <p></p>
    </div>
    <div class="row" v-for="(ci, index) in caseStore.chatHistory" :key="index">
        <div><label>Q:&nbsp;</label>{{ ci.Q }}</div>
        <div style="white-space: pre-wrap;"><label>A:&nbsp;</label>{{ ci.A }}</div>
        <p></p>
        <hr/>
    </div>
</div>
</template>