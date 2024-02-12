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
const query = ref()
const caption=ref()
const stream_in = ref("")
const stream_key = ref(Date.now())

const emits = defineEmits(["newCaseId"])     // add new case to list
const spinner = ref("提交")
const btnSubmit = ref()
const socket:Socket = io(import.meta.env.VITE_LLM_URL)
socket.on("stream_in", r=>{
        stream_in.value=r;
        console.log(stream_in.value)
        stream_key.value=Date.now()
    })

async function onSubmit() {
    // send message to websoceket and wait for response
    console.log("Submit query to AI: ", query.value)

    spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
    btnSubmit.value.disabled = true
    stream_in.value = " "
    const ci = {} as ChatItem
    ci.Q = query.value? query.value : "Hello";        // query submitted to AI
    ci.A = ""
    // caseStore.chatHistory.unshift(ci)
    const timer = window.setTimeout(()=>{
        // alert user to reload
        window.alert("如果等待超时，可以试试刷新页面，重新提交。")
    }, 60000)

    // A new case. submit query to AI websocket and wait for reply.
    socket.emit("gpt_api", [], ci.Q, async (resp:any)=>{
        window.clearTimeout(timer)
        console.log(resp)   // {query: refined query str, result: AI result}
        ci.A = resp

        const newId = await caseStore.createCase(ci, caption.value)
        alertStore.success("New case added, " + caseStore.case)
        emits("newCaseId", newId)    // To have case list updated
        stream_in.value = ""
        query.value = ""
        spinner.value = "提交"
        btnSubmit.value.disabled = false
        router.push("/case/edit/"+newId)
    })

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
            <input v-model="caption" placeholder="对话标题..."/>
        </div>
        </div>
    </div>
    <div class="row mt-2">
        <textarea rows="4" class="col" v-model="query" placeholder="提问内容...."></textarea>
        <p></p>
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
</div>
</form>
</template>