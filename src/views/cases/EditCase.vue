<script setup lang="ts">
// import { Form, Field } from 'vee-validate';
// import * as Yup from 'yup';
import { useRoute } from 'vue-router';
// import { storeToRefs } from 'pinia';
import { useAlertStore, useCaseStore } from '@/stores';
import { onMounted, watch, ref, computed } from 'vue';
import { MultiUploader } from '@/components';
import { io, Socket } from "socket.io-client"

//DO NOT remove the following line. Keep Vue from complaining. 
const emits = defineEmits(["newCaseAdded"]);    /////////////
//DO NOT remove the above line. Keep Vue from complaining. 
const alertStore = useAlertStore();

const spinner = ref("提交")
const btnSubmit = ref()
const btnConfirm = ref()
// const user = useAuthStore().user!
const userRole = ref("attorney")
const userTask = ref("plaintiff")
const subTask = ref("info")
const caseStore = useCaseStore()
const route = useRoute();
const taskList = computed(()=>{
    // much easier to understand the logic here if looking at template.json in /assets.
    if (!caseStore.template) return
    console.log("userRole=", userRole.value, userTask.value, subTask.value, caseStore.template)
    return Object.keys(caseStore.template[userRole.value]).map((k:string)=>{
        return {...{}, [k]:caseStore.template[userRole.value][k]["title"]}}     // create an obj given key and value
    )
})
const subTasklist = computed(()=>{
    if (!caseStore.template) return
    return Object.entries(caseStore.template[userRole.value][userTask.value]["content"])
})
const field = computed(()=>userRole.value+":"+userTask.value+":"+subTask.value)
const prompt = ref()
const AiContent = ref()
const tips = ref()

async function submitQuery() {
    const caseStore = useCaseStore()
    const socket:Socket = io(import.meta.env.VITE_LLM_URL)
    console.log(userRole.value, userTask.value, subTask.value)
    // start the spinner, disable submit button
    btnSubmit.value.disabled = true
    caseStore.case.role = userTask.value + " lawyer. "

    switch(userRole.value) {
        case "attorney":
            switch(userTask.value) {
                case "plaintiff":      // 民事起诉
                    switch(subTask.value) {
                        case "info":
                            console.log(caseStore.case)
                            spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
                            socket.emit("case_info", caseStore.case, prompt.value, async (resp:any)=>{
                                // console.log(resp)   // {query: refined query str, result: AI result}
                                prompt.value = resp.query 
                                AiContent.value = resp.result
                                btnConfirm.value.disabled = false
                                btnSubmit.value.disabled = false
                                spinner.value = "提交"
                            })
                            break;
                        case "request":   // 诉讼请求
                            if (spinner.value=="提交") {
                                spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
                                socket.emit("case_request", caseStore.case, prompt.value, async (resp:any)=>{
                                    // generate a list of wrongdoings of the defendant and corresponding list
                                    // of requests for compensations. Waiting for users approval or editing
                                    console.log(resp)
                                    prompt.value = resp.query  // wrong doings
                                    AiContent.value = resp.result
                                    btnConfirm.value.disabled = false
                                    btnSubmit.value.disabled = false
                                    spinner.value = "确认"
                                })
                            } 
                            break;
                        case "argument":
                            if (spinner.value == "提交") {
                                socket.on("process_task", (resp)=>{
                                    prompt.value += resp + "\n\n"
                                })
                                // user confirmed list of wrongdoings, now process each one of them.
                                socket.emit("case_wrongs", caseStore.case, prompt.value, (resp:any)=>{
                                    console.log(resp)
                                    tips.value = ""
                                })
                                prompt.value = ""
                                AiContent.value = ""
                                tips.value = "Processing task....."
                                spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
                                // make sure to start a new item on a new line
                                socket.on("task_result", (resp:any)=>{
                                    // return facts and rebuff to each wrongdoing. Append it to end of AiContent
                                    console.log(resp)
                                    AiContent.value += resp.argument+"\n\n"
                                })
                                socket.on("case_done", (resp)=>{
                                    spinner.value == "提交"
                                    AiContent.value = AiContent.value.concat(resp)
                                    btnConfirm.value.disabled = false
                                    console.log("Case Done", resp)
                                })
                            }
                            break;
                        default:
                            console.error("Unknown tasks, ")
                            return;
                    }
                    break;
                case "defendant":      // 民事答辩
                    break;
                default:        // 刑事诉讼
            }
            break;
        default:            // judge
            console.log("judge")
    }
}

async function confirmAiResult() {
    // save AI result to DB
    // const c = useCaseStore().case
    // c.plaintiff = "阿家(杭州)文化发展有限公司"
    // c.defendant = "杭州栖溪商业管理有限公司"
    // await useCaseStore().editCase(c)
    await useCaseStore().updateTemplate(field.value, AiContent.value)       // save the AI output to template items
    btnConfirm.value.disabled = true
    alertStore.success('AI result confirmed');
}
onMounted(async ()=>{
    await caseStore.initCase(route.params.id as string)     // update caseStore with current case data
    AiContent.value = caseStore.getTemplateItem(field.value, "result")
    prompt.value = caseStore.getTemplateItem(field.value, "prompt")
    btnConfirm.value.disabled = true
})
watch(()=>route.params.id, async (nv, ov)=>{
    // force changing of user case
    if (nv!=ov && nv) {
        await useCaseStore().initCase(nv as string)
    }},
)
watch(()=>field.value, async (nv, ov)=>{
    if (nv!=ov) {
        const aiTempt = await caseStore.getTemplateItem(field.value)
        if (AiContent.value && AiContent.value!=aiTempt) {
            // alert()
        }
        AiContent.value = aiTempt
        prompt.value = caseStore.template[userRole.value][userTask.value]["prompt"][subTask.value]
    }
    if (subTask.value == "argument") {
        // set init prompt value from previous AI output
        prompt.value = caseStore.template[userRole.value][userTask.value]["result"]["request"]
    }
})
watch(()=>useCaseStore().case.id, async (nv, ov)=>{
    if (nv!=ov) {
        const aiTempt = await caseStore.getTemplateItem(field.value)
        if (AiContent.value && AiContent.value!=aiTempt) {
            // alert()
        }
        AiContent.value = aiTempt
        prompt.value = caseStore.getTemplateItem(field.value, "prompt")
    }
})

</script>

<template>
<multi-uploader></multi-uploader>
<form>
<div class="container d-grid row-gap-3">
    <div class="row">
        <div class="col">
        <div class="card fs-6">
            <div class="card-header">
                {{ caseStore.case.title }}
            <div style="position: absolute; right: 0px; top:1px">
                <button type="button" data-bs-target="#myModal" class="btn btn-link" data-bs-toggle="modal">&nbsp;添加文件</button>
            </div>
            </div>
            <ul class="list-group list-group-flush">
                <li class="list-group-item text-secondary">{{ caseStore.case.brief }}</li>
                <li class="list-group-item text-secondary">原告：{{ caseStore.case.plaintiff }}</li>
                <li class="list-group-item text-secondary">被告：{{ caseStore.case.defendant }}</li>
                <li v-if="caseStore.case.judge" class="list-group-item text-secondary">主审：{{ caseStore.case.judge }}</li>
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
    <div class="row mt-2">
        <textarea rows="8" class="col" v-model="prompt" :placeholder="tips"></textarea>
        <p></p>
        <div class="col">
            <!-- <button @click.prevent="submitQuery" style="position: relative; float: right;">提交</button> -->
            <button ref="btnSubmit" @click.prevent="submitQuery" type="button" style="position: relative; float: right;" class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
    <div v-show="AiContent" class="row mt-2">
        <textarea rows="8" class="col" @input="btnConfirm.disabled = false" v-model="AiContent"></textarea>
        <p></p>
        <div class="col">
            <button ref="btnConfirm" @click.prevent="confirmAiResult" type="button" class="btn btn-primary" style="position: relative; float: right;">保存</button>
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