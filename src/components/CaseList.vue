<script setup lang="ts">
import { ref, reactive, shallowRef } from 'vue'
import { onMounted, computed } from "vue";
import { storeToRefs } from 'pinia';
import { useCaseListStore } from "@/stores";
import { CButtonGroup, CButton } from '@coreui/vue';
import 'bootstrap/dist/css/bootstrap.min.css'

let allCases = shallowRef([] as LegalCase[])
const caseListStore = storeToRefs(useCaseListStore())
const currentId = computed(()=>{
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
    console.log("active="+caseListStore.activeId.value, "selected="+c.id)
}
</script>
<template>
<div>
    <CButtonGroup vertical role="group" aria-label="Vertical button group">
        <CButton :active="currentId==c.id? true:false" @click="selectCase(c)"
        v-for="(c,i) in allCases" :key="i.toString()">{{c.title}}</CButton>
    </CButtonGroup>
</div>
</template>