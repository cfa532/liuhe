<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { router } from '@/router'
import { useAlertStore, useCaseStore } from '@/stores';

// const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
const caseStore = useCaseStore()
const alertStore = useAlertStore()
const caption=ref()

const emits = defineEmits(["newCaseId"])     // add new case to list
const spinner = ref("提交")
const btnSubmit = ref()

async function onSubmit() {
    // send message to websoceket and wait for response
    const newId = await caseStore.createCase(caption.value)
    alertStore.success("New case added, " + caseStore.case)
    emits("newCaseId", newId)    // To have case list updated
    router.push("/case/edit/"+newId)
}
onMounted(()=>{
    console.log("New Case Mounted", caseStore.mid)
})
</script>

<template>
<!-- <Uploader @newCaseValues="data=>formValues=data"></Uploader> -->
<form>
<div class="container d-grid row-gap-3" style="max-width: 600px; float: left;">
    <div class="row">
        <div class="col">
            <div class="card fs-6">
                <input v-model="caption" placeholder="对话标题..."/>
            </div>
        </div>
    </div>
    <div class="row mt-2">
        <div class="col">
            <button ref="btnSubmit" @click.prevent="onSubmit" type="button" style="position: relative; float: right;"
             class="btn btn-primary" v-html="spinner"></button>
        </div>
    </div>
</div>
</form>
</template>