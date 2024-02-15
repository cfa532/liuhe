<script setup lang="ts">
import { shallowRef, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia';
import { useCaseListStore, useCaseStore } from "@/stores";
import { router } from '@/router'

const props=defineProps({
    caseId: {type: String, required: false},
})

const allCases = shallowRef([] as ChatCase[])
const caseListStore = storeToRefs(useCaseListStore())

watch(()=>props.caseId, async (nv, ov)=>{
    console.log("Watch caseId:",nv, ov)
    if (nv && nv!=='0') {
        if (allCases.value.findIndex(c=>c.id==nv) == -1)
            allCases.value.unshift(useCaseStore()._value)
        useCaseListStore().setActiveId(nv)
    } else {
        allCases.value = await caseListStore.allCases.value
        router.push("/case")
    }
})
onMounted(async ()=>{
    // get list of cases of the user
    allCases.value = await caseListStore.allCases.value
    console.log("case list mounted", caseListStore.activeId.value, allCases.value)
})
function selectCase(c:ChatCase) {
    // highlight current case and
    console.log(c) 
    useCaseListStore().setActiveId(c.id)
    router.push("/case/edit/"+c.id)
}
function addNewCase() {
    // create a new case
    useCaseListStore().setActiveId("")
    router.push('/case/add')
}
function btnClass(c:ChatCase) {
    return "btn btn-light text-nowrap btn-outline-secondary " + (c.id==caseListStore.activeId.value? "active":"")
}
</script>
<template>
<div>
    <div class="btn-group-vertical btn-group-sm d-grid gap-1" role="group" aria-label="Small button group">
        <button @click="addNewCase" type="button" class="btn btn-light text-nowrap btn-outline-primary">
            <span class="text-decoration-underline">&nbsp;新建&nbsp;</span>
        </button>
        <button @click="selectCase(c)" v-for="(c,i) in allCases" :key="i" type="button" :class="btnClass(c)">{{c.brief}}</button>
    </div>
</div>
</template>
<style>
.btn {
    max-width: 160px;
    overflow:hidden;
    text-wrap: balance;
}
</style>