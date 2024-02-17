<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useCaseStore, useCaseListStore } from '@/stores';
import { useRoute } from 'vue-router';
import { Share } from '@/components'

const emits = defineEmits(["newCaseId"])     // add new case to list
const caseList = useCaseListStore()
const caseStore = useCaseStore()
const route = useRoute();
const query = ref()
const stream_in = ref("")
const socket = new WebSocket(import.meta.env.VITE_LLM_URL)
const spinner = ref("提交")
const btnSubmit = ref()
const chatHistory = ref<ChatItem[]>()
let timer = 0

socket.addEventListener("message", async ({data}) => {
    const event = JSON.parse(data as string)
    const ci = {} as ChatItem
    switch(event.type) {
        case "stream":
            window.clearTimeout(timer)
            stream_in.value += event.data;
            // console.log(event.data)
            break
        case "result":
            console.log("Ws received:", event, ci)
            ci.Q = query.value
            ci.A = event.answer
            chatHistory.value!.unshift(ci)
            await caseStore.addChatItem(ci)
            query.value = ""
            stream_in.value = ""
            spinner.value = "提交"
            btnSubmit.value.disabled = false
            break
        case "error":
            window.clearTimeout(timer)
            console.error("Ws error:", event)
            break
        default:
            window.clearTimeout(timer)
            console.warn("Ws default:", event)
            throw new Error(`Unsupported event type: ${event.type}.`);
    }
})

async function onSubmit() {
    timer = window.setTimeout(()=>{
        // alert user to reload
        window.alert("如果等待超时，可以试试刷新页面，重新提交。")
    }, 120000)

    // send message to websoceket and wait for response
    console.log("Submit query to AI: ", query.value)
    const ci = {} as ChatItem
    query.value = typeof query.value =="undefined" ? "Hello" : query.value;        // query submitted to AI
    ci.Q = query.value
    ci.A = ""
    console.log(ci)
    try {
        socket.send(JSON.stringify({"type":"gpt_api", "query":ci.Q}))
        spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
        btnSubmit.value.disabled = true
        stream_in.value = ""
    } catch(err) {
        console.error(err)
        spinner.value = "提交"
        btnSubmit.value.disabled = false
    }
}
onMounted(async ()=>{
    // load chat history of a particular case
    await caseStore.initCase(route.params.id as string)
    console.log("Case Mounted", caseStore.$state)
    chatHistory.value = caseStore.chatHistory
})
watch(()=>route.params.id, async (nv, ov)=>{
    // force changing of user case
    if (nv && nv!=ov) {
        await caseStore.initCase(nv as string)
        chatHistory.value = caseStore.chatHistory
        console.log(caseStore.case)
    }},
)
async function deletePost() {
    await caseList.deleteCase(route.params.id as string)
    emits("newCaseId", "0")
}
</script>

<template>
<div style="max-width: 800px;">
<form>
<div class="container d-grid row-gap-3">
    <div class="row">
        <div class="col-12">
            <span>&nbsp;&nbsp;{{ caseStore.case.brief }}</span>
            <Share style=" display: inline-block; position: absolute; right:40px;" @delete-post="deletePost"></Share>
        </div>
    </div>
    <div class="row mt-2">
        <textarea class="col" rows="4" v-model="query" placeholder="Ask me...."></textarea>
        <p></p>
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
</div>
</form>

<div class="row text-secondary mt-4">
    <div class="row" v-if="stream_in.length>0">
        <div style="white-space: pre-wrap; color: black;"><label>A:&nbsp;</label>{{ stream_in }}</div>
        <p></p>
        <hr/>
    </div>
    <div style="margin-left: 1px;" class="row" v-for="(ci, index) in chatHistory" :key="index">
        <div><label>Q:&nbsp;</label>{{ ci.Q }}</div>
        <div style="white-space: pre-wrap;"><label>A:&nbsp;</label>{{ ci.A }}</div>
        <p></p>
        <hr/>
    </div>
</div>
</div>
</template>
<style>
.col-12 {
    background-color: rgb(246, 244, 240);
    padding: 5px;
    border-radius: 5px;
    /* border: 1px solid #73AD21; */
} 
</style>