<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { onMounted } from "vue";
import { storeToRefs } from 'pinia';
import { useCaseListStore, useCaseStore } from "@/stores";
import { router } from '@/router'

const props=defineProps({
    newId: {type: String, required: false},
})

let allCases = shallowRef([] as LegalCase[])
const caseListStore = storeToRefs(useCaseListStore())
watch(()=>props.newId, (nv, ov)=>{
    if (nv) {
        if (allCases.value.findIndex(c=>c.id==props.newId) == -1)
            allCases.value.unshift(useCaseStore()._value)
        useCaseListStore().setActiveId(nv)
    }
})
onMounted(async ()=>{
    // get list of cases of the user
    allCases.value = await caseListStore.allCases.value
    console.log("all cases:", caseListStore.activeId.value, allCases.value)
})
function selectCase(c:LegalCase) {
    // highlight current case and 
    useCaseListStore().setActiveId(c.id)
    router.push("/case/edit/"+c.id)
}
function addNewCase() {
    // create a new case
    router.push('/case/add')
}
function btnClass(c:LegalCase) {
    return "btn btn-light text-nowrap btn-outline-secondary " + (c.id==caseListStore.activeId.value? "active":"")
}
</script>
<template>
<div style="min-width: 80px;">
    <div class="btn-group-vertical btn-group-sm d-grid gap-1" role="group" aria-label="Small button group">
        <button @click="addNewCase" type="button" class="btn btn-light text-nowrap btn-outline-primary">新建</button>
        <button @click="selectCase(c)" v-for="(c,i) in allCases" :key="i.toString()" type="button" :class="btnClass(c)">{{c.title}}</button>
    </div>
</div>
</template>