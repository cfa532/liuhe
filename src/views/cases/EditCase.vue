<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useCaseStore, useCaseListStore } from '@/stores';
import { useRoute } from 'vue-router';
import { Share } from '@/components'

// const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
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

socket.addEventListener("message", async ({data}) => {
    const event = JSON.parse(data as string)
    const ci = {} as ChatItem
    switch(event.type) {
        case "stream":
            stream_in.value += event.data;
            // console.log(event.data)
            break
        case "result":
            console.log("Ws received:", event)
            ci.Q = query.value
            ci.A = event.answer
            chatHistory.value!.unshift(ci)
            await caseStore.addChatItem({...ci})
            query.value = ""
            stream_in.value = ""
            spinner.value = "提交"
            btnSubmit.value.disabled = false
            break
        case "error":
            console.error("Ws error:", event)
            break
        default:
            console.warn("Ws default:", event)
            throw new Error(`Unsupported event type: ${event.type}.`);
    }
})

async function onSubmit() {
    // send message to websoceket and wait for response
    console.log("Submit query to AI: ", query.value)
    const ci = {} as ChatItem
    ci.Q = query.value? query.value : "Hello";        // query submitted to AI
    ci.A = ""
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
    console.log("Case Mounted", caseStore.mid)
    // load chat history of a particular case
    await caseStore.initCase(route.params.id as string)
    chatHistory.value = caseStore.chatHistory
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
        <div style="white-space: pre-wrap; color: black;"><label>A:&nbsp;</label>{{ stream_in }}</div>
        <p></p>
        <hr/>
    </div>
    <div class="row" v-for="(ci, index) in chatHistory" :key="index">
        <div><label>Q:&nbsp;</label>{{ ci.Q }}</div>
        <div style="white-space: pre-wrap;"><label>A:&nbsp;</label>{{ ci.A }}</div>
        <p></p>
        <hr/>
    </div>
</div>
</template>