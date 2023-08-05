<script setup lang="ts">
import { shallowRef } from 'vue'
import { onMounted, computed } from "vue";
import { storeToRefs } from 'pinia';
import { useCaseListStore, useCaseStore } from "@/stores";
import { router } from '@/router'

const props=defineProps({
    newId: {type: String, required: false},
})

let allCases = shallowRef([] as LegalCase[])
const caseListStore = storeToRefs(useCaseListStore())
const currentId = computed(()=>{
    // console.log("newId=",props.newId, "\nactiveId=",caseListStore.activeId.value)
    if (props.newId) {
        if (allCases.value.findIndex(c=>c.id==props.newId) == -1)
            allCases.value.unshift(useCaseStore()._value)
        useCaseListStore().setActiveId(props.newId)
    }
    return caseListStore.activeId.value
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
    return "btn btn-outline-secondary " + (c.id==currentId.value? "active":"")
}
</script>
<template>
<div>
    <button @click="addNewCase" type="button" class="btn btn-primary">新建</button>

    <div class="btn-group-vertical btn-group-sm" role="group" aria-label="Small button group">
        <button @click="selectCase(c)" v-for="(c,i) in allCases" :key="i.toString()" type="button" :class="btnClass(c)">{{c.title}}</button>
    </div>
</div>
</template>