<script setup lang="ts">
import { onErrorCaptured, onMounted, ref, watch } from 'vue';
import { useAuthStore, useCaseStore, useCaseListStore } from '@/stores';
import { useRoute } from 'vue-router';
import { Share } from '@/components'

const emits = defineEmits(["newCaseId"])     // add new case to list
const caseList = useCaseListStore()
const caseStore = useCaseStore()
const { user } = useAuthStore()
const route = useRoute();
const query = ref()
const stream_in = ref("")
const spinner = ref("提交")
const btnSubmit = ref()
const chatHistory = ref<ChatItem[]>([])

async function onSubmit() {
    spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
    btnSubmit.value.disabled = true

    const timer = window.setTimeout(()=>{
        // alert user to reload
        window.alert("如果等待超时，尝试刷新页面后重新提交。")
        spinner.value = "提交"
        btnSubmit.value.disabled = false
    }, 120000)

    const socket = new WebSocket(import.meta.env.VITE_LLM_URL)
    socket.onmessage = ({ data }) => {
        const event = JSON.parse(data)
        const ci = {} as ChatItem
        window.clearTimeout(timer)
        switch (event.type) {
            case "stream":
                stream_in.value += event.data;
                break
            case "result":
                console.log("Ws received:", event, ci)
                ci.Q = query.value
                ci.A = event.answer
                chatHistory.value!.unshift(ci)
                caseStore.addChatItem(ci)
                query.value = ""
                stream_in.value = ""
                spinner.value = "提交"
                btnSubmit.value.disabled = false
                socket.close(1000, "Job done")
                break
            default:
                console.warn("Ws default:", data)
                socket.close()
                throw new Error(`Unsupported event type: ${event.type}.`);
        }
    }
    socket.onerror = err => {
        console.error(err)
        spinner.value = "提交"
        btnSubmit.value.disabled = false
        socket.close(1000, "Job done")
    }
    socket.onopen = ()=>{
        // send message to websoceket and wait for response
        const ci = {} as ChatItem
        query.value = typeof query.value =="undefined" ? "Hello" : query.value;        // query submitted to AI
        ci.Q = query.value
        ci.A = ""
        const qwh: any = {query: ci.Q, history: [] as Array<ChatItem>}   // query with history
        for (let i=0; i<Math.min(6, chatHistory.value.length); i++) {
            qwh.history.push(chatHistory.value[i])
        }
        console.log(qwh, user.template)
        
        stream_in.value = ""
        socket.send(JSON.stringify({input: qwh, parameters: user.template}))
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
onErrorCaptured((err)=>{
    console.error(err)
    return false
})
async function deletePost() {
    await caseList.hideCase(route.params.id as string)
    emits("newCaseId", "0")
}
</script>

<template>
<div class="col-md-10 col-sm-12">
<form>
<div class="container d-grid row-gap-3">
    <Share style=" display: inline-block; position: absolute; right:40px;" @delete-post="deletePost"></Share>

    <div class="row mt-2">
        <textarea class="form-control" rows="5" v-model="query" placeholder="Ask me...."></textarea>
        <p></p>
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
</div>
</form>

<div class="row text-secondary mt-4">
    <div v-if="stream_in.length>0">
        <div style="white-space: pre-wrap; color: black;"><label>A:&nbsp;</label>{{ stream_in }}</div>
        <p></p>
        <hr/>
    </div>
    <div style="margin-left: 1px;" v-for="(ci, index) in chatHistory" :key="index">
        <div class="Q"><label>Q:&nbsp;</label>{{ ci.Q }}</div>
        <div class="A"><label>A:&nbsp;</label>{{ ci.A }}</div>
        <p></p>
        <hr/>
    </div>
</div>
</div>
</template>
<style>
div.Q {
    background-color:rgb(238, 238, 213);
    /* border: 1px solid blue; */
    border-radius: 10px;
    padding: 5px;
    margin-bottom: 10px;

}
div.A {
    white-space: pre-wrap;
    color: rgb(33, 31, 31);
}
.col-12 {
    background-color: rgb(199, 187, 163);
    padding: 5px;
    border-radius: 5px;
    /* border: 1px solid #73AD21; */
}
.text-secondary {
    /* --bs-text-opacity: 1; */
    color: rgb(53 57 62) !important;
}
</style>