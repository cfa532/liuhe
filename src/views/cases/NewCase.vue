<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { onMounted, ref } from 'vue';
import { Uploader } from '@/components';
import { router } from '@/router'
import { useAlertStore, useCaseStore } from '@/stores';

// const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
const formValues = ref()
const schema = Yup.object().shape({
    brief: Yup.string()
        .required('案件简述必填'),
});
const emits = defineEmits(["newCaseAdded"])     // add new case to list
const props = defineProps({
    chatId : {type: String, required: false}    // only new chat
})

async function onSubmit(values:any) {
    // send message to websoceket and wait for response
    const caseStore = useCaseStore()
    const alertStore = useAlertStore()
    if (!props.chatId) {
        const newId = await caseStore.createCase(values)
        alertStore.success("New case added, " + caseStore._value)
        // because store is singleton, the caseStore is updated with new data by now.
        emits("newCaseAdded", newId)    // To have case list updated
        router.push("/case/edit/"+newId)
    } else {
        // load chat history
        
    }
}

onMounted(()=>{
    console.log("New Case Mounted")
})
</script>

<template>
    <!-- <Uploader @newCaseValues="data=>formValues=data"></Uploader> -->
    <div class="card">
        <h4 class="card-header">新建案件</h4>
        <!-- <div style="position: absolute; right: 0px; top:0px">
            <button type="button" data-bs-target="#myModal" class="btn btn-secondary btn-sm" data-bs-toggle="modal">初始化</button>
        </div> -->
        <div class="card-body">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="formValues" v-slot="{errors, isSubmitting}">
                <div class="form-group">
                    <label>诉求：</label>
                    <Field name="brief" rows="8" as="textarea" class="form-control" :class="{ 'is-invalid': errors.brief }" />
                    <div class="invalid-feedback">{{ errors.brief }}</div>
                </div>
                <div class="form-group mt-2">
                    <button class="btn btn-primary" :disabled="isSubmitting">
                        <span v-show="isSubmitting" class="spinner-border spinner-border-sm mr-1"></span>
                        提交
                    </button>
                    <router-link to="login" class="btn btn-link" style="float: right;">取消</router-link>
                </div>
            </Form>
            <div class="form-group mt-4">
                <div>
                    <label>You：</label>
                    <div>What is your name</div>
                    <label>AI：</label>
                    <div>Chat GPT
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>