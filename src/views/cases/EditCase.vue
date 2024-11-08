<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useAuthStore, useCaseStore, useCaseListStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Share, Preview } from '@/components'
const route = useRoute()
interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget
}
const emits = defineEmits(["newCaseId"])     // add new case to list
const caseList = useCaseListStore()
const caseStore = useCaseStore()
const caseStoreRefs = storeToRefs(caseStore)
const { user } = useAuthStore()
const query = ref()
const keywords = ref()
const stream_in = ref("")
const spinner = ref("提交")
const btnSubmit = ref()
const checkedItems = ref([])
const checkboxNoHistory = ref(false)
const isSubmitting = ref(false)
const selectFiles = ref()
const filesUpload = ref<File[]>([])
const divAttach = ref()
const dynamicInput = ref<HTMLInputElement>()
const hiddenMeasure = ref<HTMLSpanElement>()

// const chatHistory = ref<ChatItem[]>([])
let socket: WebSocket
let timer: any
let startTime = 0       // time between sending message and receives first reply.

async function onSubmit(event: any) {
    if (isSubmitting.value) {
        return;                 // Prevent resubmission
    }
    isSubmitting.value = true;
    spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
    btnSubmit.value.disabled = true
    event.preventDefault()      // prevernt from continuous submitting.

    timer = window.setTimeout(() => {
        // alert user to reload
        btnSubmit.value.disabled = false
        window.alert("如果等待超时，尝试刷新页面后重新提交。")
        spinner.value = "提交"
    }, 30000)

    // send message to websocket and wait for response
    const ci = {} as ChatItem
    query.value =  (query.value ? query.value : "Hello");        // query submitted to AI
    ci.Q = query.value + "\n" + (keywords.value ? 'keywords of my query: '+keywords.value : "") + "\n"
    ci.A = ""

    // add uploaded files to user question.
    // for(const f of filesUpload.value) {
    //     if (f.size + ci.Q.length < 8192)
    //         ci.Q = ci.Q + await f.text() + "\n"
    // }
    const qwh: any = { query: ci.Q, history: [] as Array<ChatItem>,
        numOfAttachments: filesUpload.value.length}   // query with history

    if (checkedItems.value.length > 0 && !checkboxNoHistory.value) {
        // if any previous conversations are checked, use them as chat history
        for (let i = 0; i < Math.min(6, checkedItems.value.length); i++) {
            const item: ChatItem = checkedItems.value[i]
            qwh.history.push({ Q: item.Q.replace(/"/g, "'"), A: item.A.replace(/"/g, "'").replace(/\s+/g, " ") })
        }
    } else if (!checkboxNoHistory.value) {
        // otherwise use the most recent 6 chats as history
        for (let i = 0; i < Math.min(6, caseStoreRefs.chatHistory.value.length); i++) {
            const item: ChatItem = caseStoreRefs.chatHistory.value[i]
            // it seems double quote will conflict with LnagChain
            qwh.history.push({ Q: item.Q.replace(/"/g, "'"), A: item.A.replace(/"/g, "'").replace(/\s+/g, " ") })
        }
    }
    // otherwise no chat history.

    stream_in.value = ""
    const msg = { input: qwh, parameters: user.template, user: user.username }
    console.log(msg, filesUpload.value)

    if (socket && socket.readyState == WebSocket.OPEN) {
        startTime = Date.now()
        socket.send(JSON.stringify(msg))
        filesUpload.value.forEach(async e => {
            const buf = await e.arrayBuffer()
            socket.send(buf)
        })
    }
    else {
        openSocket()
        window.setTimeout(() => {
            startTime = Date.now()
            socket.send(JSON.stringify(msg))
        }, 3000)
    }
}
onMounted(async () => {
    // load chat history of a particular case
    await caseStore.initCase(route.params.id as string)
    console.log("Case Mounted")
    adjustWidth()
    openSocket()
})

function openSocket() {
    socket = new WebSocket(import.meta.env.VITE_LLM_URL + "?token=" + useAuthStore().token.access_token)
    socket.onmessage = ({ data }) => {
        const event = JSON.parse(data)
        const ci = {} as ChatItem
        window.clearTimeout(timer)
        switch (event.type) {
            case "stream":
                if (startTime > 0) {
                    console.log("time diff=", Date.now() - startTime); startTime = 0
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
                isSubmitting.value = false
                btnSubmit.value.disabled = false
                checkedItems.value = []
                checkboxNoHistory.value = false
                filesUpload.value = []
                break
            case "error":
                console.warn(event.error)
                // window.alert("Token expired. Re-login")
                // useAuthStore().logout()
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
}
watch(() => route.params.id, async (nv, ov) => {
    // force changing of user case
    if (nv && nv != ov) {
        await caseStore.initCase(nv as string)
    }
})
async function delCase() {
    // set the current case as hidden in database, do not delete it.
    await caseList.deleteCase(route.params.id as string)
    emits("newCaseId", "-" + route.params.id)
}
function handleKeyDown(event: any) {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            // Allow new line in textarea
            if (event.target.tagName === 'TEXTAREA') {
                return;
            }
        } else if (event.ctrlKey) {
            // Process data before submitting
            event.preventDefault();
            checkboxNoHistory.value = true
            onSubmit(event);
        } else {
            // Submit form on Enter key press
            event.preventDefault();
            onSubmit(event);
        }
    }
};
async function onSelect(e: Event) {
  const files =
    (e as HTMLInputEvent).target.files ||
    (e as DragEvent).dataTransfer?.files ||
    (e as ClipboardEvent).clipboardData?.files
  if (files?.length! > 0) {
    Array.from(files!).forEach((f) => {
        // remove duplication
        if (filesUpload.value.findIndex((e: File) => {e.name === f.name}) === -1) {
            filesUpload.value.push(f)
      }
    })
    divAttach.value!.hidden = false
  }
}
function removeFile(f: File) {
  // removed file from preview list
  var i = filesUpload.value.findIndex((e: File) => e == f)
  filesUpload.value.splice(i, 1)
  if (filesUpload.value.length == 0) {
    divAttach.value.hidden = true
  }
}

function adjustWidth() {
    // Set the hidden element's text to the input's value
    hiddenMeasure.value!.textContent = (keywords.value || dynamicInput.value!.placeholder) as string;
    const width = hiddenMeasure.value!.offsetWidth;
    dynamicInput.value!.style.width = width + 'px';
}
</script>

<template>
    <div class="col-md-10 col-sm-12">
        <form @submit.prevent="onSubmit" @keydown="handleKeyDown">
            <div class="container d-grid row-gap-3" @drop.prevent="onSelect">
                <Share style=" display: inline-block; position: absolute; right:40px;" @delete-post="delCase"></Share>
                <div class="row mt-2" style="position: relative;">
                    <textarea class="form-control" rows="5" v-model="query" placeholder="Ask me...."></textarea>
                    <input title="No history if checked" style="position: absolute; bottom: 55px; right: 15px; transform: translate(50%, -50%);"
                     type="checkbox" v-model="checkboxNoHistory">
                    <p></p>
                    <div class="col-10">
                        <input ref="selectFiles" @change="onSelect" type="file" hidden multiple />
                        <label for="fileUpload" class="upload-button" @click.prevent="selectFiles.click()">
                            <svg fill="none" height="14" viewBox="0 0 14 14" width="14" xmlns="http://www.w3.org/2000/svg"><g stroke="#000001" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 5h1c.1326 0 .2598.05268.3536.14645.0937.09376.1464.22094.1464.35355v7.5c0 .1326-.0527.2598-.1464.3536-.0938.0937-.221.1464-.3536.1464h-9c-.13261 0-.25979-.0527-.35355-.1464-.09377-.0938-.14645-.221-.14645-.3536v-7.5c0-.13261.05268-.25979.14645-.35355.09376-.09377.22094-.14645.35355-.14645h1"/><path d="m7 7.5v-7"/><path d="m5 2.5 2-2 2 2"/></g></svg>
                        </label>
                        <label class="upload-button" @click.prevent="keywords=''; filesUpload=[]">
                            <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m13.9907.00000013c.8909 0 1.337 1.07713987.7071 1.70710987l-.8422.84211c.5654.60732 1.0348 1.30106 1.3892 2.05773.558 1.19141.8135 2.50205.744 3.81582s-.462 2.59013-1.1426 3.71603c-.6806 1.1258-1.6284 2.0665-2.7594 2.7385-1.131.6721-2.41025 1.0549-3.7245 1.1145-1.31426.0596-2.62293-.2059-3.81009-.7729-1.18716-.5669-2.21617-1.418-2.99587-2.4776-.779705-1.0597-1.286041-2.2953-1.4741578-3.59738-.07896991-.54661.3001268-1.05374.8467358-1.13271.546612-.07897 1.053742.30012 1.132712.84673.14109.97657.52084 1.90326 1.10562 2.69806.58478.7947 1.35653 1.433 2.2469 1.8582s1.87187.6243 2.85757.5797c.98569-.0447 1.94518-.3318 2.79338-.8359s1.5591-1.2095 2.0695-2.0539c.5105-.8444.8049-1.80169.857-2.78702s-.1395-1.96831-.558-2.86187c-.2556-.54572-.591-1.0478-.9934-1.49057l-.7331.73315c-.63.62997-1.70714.1838-1.70714-.7071v-3.99068987zm-12.490721 3.99999987c.552281 0 1 .44772 1 1 0 .55229-.447719 1-1 1-.552285 0-1-.44772-1-1s.447715-1 1-1zm2.250001-2.75c.55228 0 1 .44772 1 1 0 .55229-.44772 1-1 1-.55229 0-1-.44772-1-1s.44771-1 1-1zm3.25-1.25c.55228 0 1 .447716 1 1 0 .55229-.44772 1-1 1-.55229 0-1-.44771-1-1 0-.552284.44771-1 1-1z"/></svg>
                        </label>
                        <div class="input-container">
                            <input type="text" v-model="keywords" class="input-field" placeholder="keywords...." ref="dynamicInput" @input.prevent="adjustWidth()">
                            <span type="text" class="hidden-measure" ref="hiddenMeasure" />
                        </div>
                    </div>
                    <div class="col-2">
                        <button ref="btnSubmit" :disabled="isSubmitting" type="submit"
                            style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
                    </div>
                    <div ref="divAttach" hidden class="col preview-container">
                        <Preview
                          @file-canceled="removeFile(file)"
                          v-for="(file, index) in filesUpload"
                          :key="index"
                          v-bind:src="file"
                        ></Preview>
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
.preview-container {
    position: absolute;
    left: 0;
    bottom: 50px;
    margin-bottom: 6px;
    z-index: 0;
}
.upload-button {
    display: inline-flex;
    align-items: center;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    fill: rgb(48, 46, 46);
    transition: background-color 0.3s;
}
.upload-button svg {
    padding-top: 6px;
    margin-right: 10px;
    width: 24px;
    height: 24px;
}

.input-container {
    position: relative;
    display: inline-block;
}
.input-field {
    width: 1px;
    min-width: 200px;
    font-size: 14px;
}
.hidden-measure {
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
    font-size: 16px;
    padding: 5px;
}
</style>