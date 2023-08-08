<script setup lang="ts">
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { onMounted, ref } from 'vue';
import { Uploader } from '@/components';
import { router } from '@/router'
import { useAlertStore, useCaseStore } from '@/stores';

const formValues = ref({title:"田产地头纠纷",brief:"张三告李四多吃多占",plaintiff:"张三",defendant:"李四"})
const schema = Yup.object().shape({
    title: Yup.string()
        .required('案件标题必填'),
    brief: Yup.string()
        .required('案件简述必填'),
    plaintiff: Yup.string()
        .required('原告名必填'),
    defendant: Yup.string()
        .required("被告名必填"),
});
const emits = defineEmits(["newCaseAdded"])     // to keep Vue from complaining

async function onSubmit(values:any) {

    const caseStore = useCaseStore()
    const alertStore = useAlertStore()
    try {
        const newId = await caseStore.createCase(values)
        alertStore.success("New case added, " + caseStore._value)
        // because store is singleton, the caseStore is updated with new data by now.
        emits("newCaseAdded", newId)    // To have case list updated
        router.push("/case/edit/"+newId)
    } catch(err) {
        console.error(err)
        alertStore.error(err)
    }
}

onMounted(()=>{
    console.log("New Case Mounted")
})
</script>

<template>
    <div>
        <Uploader @newCaseValues="data=>formValues=data"></Uploader>
    </div>
    <div class="card m-3">
        <h4 class="card-header">新建案件</h4>
        <div style="position: absolute; right: 0px; top:0px">
            <button type="button" data-bs-target="#myModal" class="btn btn-secondary btn-sm" data-bs-toggle="modal">初始化</button>
        </div>
        <div class="card-body">
            <Form @submit="onSubmit" :validation-schema="schema" :initial-values="formValues" v-slot="{errors, isSubmitting}">
                <div class="form-group">
                    <label>标题</label>
                    <Field name="title" type="text" class="form-control" :class="{ 'is-invalid': errors.title }" />
                    <div class="invalid-feedback">{{ errors.title }}</div>
                </div>
                <div class="form-group">
                    <label>简述</label>
                    <Field name="brief" type="text" class="form-control" :class="{ 'is-invalid': errors.brief }" />
                    <div class="invalid-feedback">{{ errors.brief }}</div>
                </div>
                <div class="form-group">
                    <label>原告</label>
                    <Field name="plaintiff" type="text" class="form-control" :class="{ 'is-invalid': errors.plaintiff }" />
                    <div class="invalid-feedback">{{ errors.plaintiff }}</div>
                </div>
                <div class="form-group">
                    <label>被告</label>
                    <Field name="defendant" type="text" class="form-control" :class="{ 'is-invalid': errors.defendant }" />
                    <div class="invalid-feedback">{{ errors.defendant }}</div>
                </div>
                <div class="form-group">
                    <label>主审法官</label>
                    <Field name="judge" type="text" class="form-control" :class="{ 'is-invalid': errors.judge }" />
                    <div class="invalid-feedback">{{ errors.judge }}</div>
                </div>
                <div class="form-group">
                    <label>律师</label>
                    <Field name="attorney" type="text" class="form-control" :class="{ 'is-invalid': errors.attorney }" />
                    <div class="invalid-feedback">{{ errors.attorney }}</div>
                </div>
                <div class="form-group">
                    <button class="btn btn-primary" :disabled="isSubmitting">
                        <span v-show="isSubmitting" class="spinner-border spinner-border-sm mr-1"></span>
                        注册
                    </button>
                    <router-link to="login" class="btn btn-link" style="float: right;">取消</router-link>
                </div>
            </Form>
        </div>
    </div>
</template>