<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { router } from '@/router'
import { useAlertStore, useCaseStore } from '@/stores';
import { io, Socket } from "socket.io-client"

// const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
const query = ref()
const emits = defineEmits(["newCaseAdded"])     // add new case to list
const props = defineProps({
    chatId : {type: String, required: false}    // only new chat
})
const spinner = ref("提交")
const btnSubmit = ref()

async function onSubmit() {
    // send message to websoceket and wait for response
    console.log("Submit value: ", query.value)
    const caseStore = useCaseStore()
    const alertStore = useAlertStore()
    const socket:Socket = io(import.meta.env.VITE_LLM_URL)

    const ci = {} as ChatItem
    ci.Q = query.value? query.value : "query";        // query submitted to AI
    ci.A = ""
    if (!props.chatId) {
        // submit query to AI websocket and wait for reply
        socket.emit("gpt_api", caseStore.chatHistory, ci.Q, async (resp:any)=>{
            // console.log(resp)   // {query: refined query str, result: AI result}
            ci.A = resp
            const newId = await caseStore.createCase(ci)
            alertStore.success("New case added, " + caseStore.case)
            emits("newCaseAdded", newId)    // To have case list updated
            router.push("/case/edit/"+newId)
        })
    } else {
        // load chat history
        
    }
}
onMounted(()=>{
    console.log("New Case Mounted", props.chatId)
})
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
        <textarea rows="8" class="col" v-model="query" placeholder="tips"></textarea>
        <p></p>
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
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