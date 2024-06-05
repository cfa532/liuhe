<script setup lang="ts">
import { onErrorCaptured, onMounted, ref, watch } from 'vue';
import { useAuthStore, useCaseStore, useCaseListStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Share } from '@/components'

const emits = defineEmits(["newCaseId"])     // add new case to list
const caseList = useCaseListStore()
const caseStore = useCaseStore()
const caseStoreRefs = storeToRefs(caseStore)
const { user } = useAuthStore()
const route = useRoute();
const query = ref()
const stream_in = ref("")
const spinner = ref("提交")
const btnSubmit = ref()
const checkedItems = ref([])
const checkboxNoHistory = ref()

// const chatHistory = ref<ChatItem[]>([])
let socket: WebSocket
let timer: any
let startTime = 0       // time between sending message and receives first reply.

async function onSubmit(event: any) {
    spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
    btnSubmit.value.disabled = true
    event.preventDefault()      // prevernt from continuous submitting.

    timer = window.setTimeout(()=>{
        // alert user to reload
        window.alert("如果等待超时，尝试刷新页面后重新提交。")
        spinner.value = "提交"
        if (btnSubmit.value) btnSubmit.value.disabled = false
    }, 120000)

    // send message to websoceket and wait for response
    const ci = {} as ChatItem
    query.value = typeof query.value =="undefined" ? "Hello" : query.value;        // query submitted to AI
    ci.Q = query.value
    ci.A = ""
    const qwh: any = {query: ci.Q, history: [] as Array<ChatItem>}   // query with history

    if (checkedItems.value.length > 0 && !checkboxNoHistory.value) {
        // if any previous conversations are checked, use them as chat history
        for (let i=0; i<Math.min(6, checkedItems.value.length); i++) {
            const item: ChatItem = checkedItems.value[i]
            qwh.history.push({Q: item.Q.replace(/"/g, "'"), A:item.A.replace(/"/g, "'").replace(/\s+/g, " ")})
        }
    } else if (!checkboxNoHistory.value) {
        // otherwise use the most recent 6 chats as history
        for (let i=0; i<Math.min(6, caseStoreRefs.chatHistory.value.length); i++) {
            const item: ChatItem = caseStoreRefs.chatHistory.value[i]
            qwh.history.push({Q: item.Q.replace(/"/g, "'"), A:item.A.replace(/"/g, "'").replace(/\s+/g, " ")})
        }
    }
    console.log(qwh, checkedItems.value)
    stream_in.value = ""

    const msg = JSON.stringify({input: qwh, parameters: user.template, user: user.username})
    if (socket && socket.readyState == WebSocket.OPEN) {
        startTime = Date.now()
        socket.send(msg)
    }
    else {
        openSocket()
        window.setTimeout(()=>{
            startTime = Date.now()
            socket.send(msg)
        }, 3000)
    }
}
onMounted(async () => {
    // load chat history of a particular case
    await caseStore.initCase(route.params.id as string)
    console.log("Case Mounted")
    // openSocket()
    document.addEventListener('keydown', async function (event) {
        if (event.ctrlKey && event.key === 'Enter') {
            checkboxNoHistory.value = true
            await onSubmit(event)
        }
    })
})

function openSocket() {
    console.log("Open socket")
    socket = new WebSocket(import.meta.env.VITE_LLM_URL)
    socket.onmessage = ({ data }) => {
        const event = JSON.parse(data)
        const ci = {} as ChatItem
        window.clearTimeout(timer)
        switch (event.type) {
            case "stream":
                if (startTime>0) {
                    console.log("time diff=", Date.now()-startTime); startTime=0
                }
                stream_in.value += event.data;
                break
            case "result":
                console.log("Ws received:", event)
                ci.Q = query.value
                ci.A = event.answer
                ci.tokens = event.tokens
                ci.cost = event.cost
                caseStoreRefs.chatHistory.value!.unshift(ci)
                caseStore.addChatItem(ci)
                query.value = ""
                stream_in.value = ""
                spinner.value = "提交"
                if (btnSubmit.value) btnSubmit.value.disabled = false
                checkedItems.value = []
                checkboxNoHistory.value = false
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
        if (btnSubmit.value) btnSubmit.value.disabled = false
        socket.close(1000, "Job done")
    }
}
watch(()=>route.params.id, async (nv, ov)=>{
    // force changing of user case
    if (nv && nv!=ov) {
        await caseStore.initCase(nv as string)
        console.log(caseStoreRefs.case.value, nv, ov)
    }},
)
onErrorCaptured((err)=>{
    console.error(err)
    return false
})
async function hideCase() {
    console.log("hide case", route.params.id)
    await caseList.hideCase(route.params.id as string)
    emits("newCaseId", "-"+route.params.id)
}
</script>

<template>
    <div class="col-md-10 col-sm-12">
        <form>
            <div class="container d-grid row-gap-3">
                <Share style=" display: inline-block; position: absolute; right:40px;" @delete-post="hideCase"></Share>
                <div class="row mt-2" style="position: relative;">
                    <textarea @keydown.enter.exact.prevent="onSubmit" class="form-control" rows="5" v-model="query" placeholder="Ask me...."></textarea>
                    <input title="No history if checked" style="position: absolute; bottom: 55px; right: 15px; transform: translate(50%, -50%);" type="checkbox" v-model="checkboxNoHistory">
                    <p></p>
                    <div class="col">
                        <button ref="btnSubmit" @click.prevent="onSubmit" type="button"
                            style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
                    </div>
                </div>
            </div>

            <div class="row text-secondary mt-4">
                <div v-if="stream_in.length > 0">
                    <div style="white-space: pre-wrap; color: black;"><label>A:&nbsp;</label>{{ stream_in }}</div>
                    <p></p>
                    <hr />
                </div>
                <div style="margin-left: 1px;" v-for="(ci, index) in caseStoreRefs.chatHistory.value" :key="index">
                    <div style="padding-left: 25px; text-indent: -20px;" class="Q">{{ "Q: " + ci.Q }}
                        <input title="Check to add into history" type="checkbox" :value="ci" v-model="checkedItems" style="margin: 6px 5px 0 5px;">
                    </div>
                    <div style="padding-left: 25px; text-indent: -20px;" class="A">{{"A: " + ci.A }}</div>
                    <p></p>
                    <hr />
                </div>
            </div>
        </form>

    </div>
</template>
<style>
div.Q {
    background-color:rgb(238, 238, 213);
    /* border: 1px solid blue; */
    border-radius: 10px;
    padding: 5px 5px 5px 0;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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