<script setup lang="ts">
import { shallowRef } from 'vue'
import { onMounted, computed } from "vue";
import { storeToRefs } from 'pinia';
import { useCaseListStore } from "@/stores";
import { CButtonGroup, CButton } from '@coreui/vue';
import { router } from '@/router'
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
    router.push("/case/edit/"+c.id)
}
function addNewCase() {
  // create a new case
  router.push('/case/add')
}
</script>
<template>
<div>
    <button @click="addNewCase" type="button" class="btn btn-primary">新建</button>

    <CButtonGroup vertical role="group" aria-label="Vertical button group">
        <CButton :active="currentId==c.id? true:false" @click="selectCase(c)"
        v-for="(c,i) in allCases" :key="i.toString()">{{c.title}}</CButton>
    </CButtonGroup>
</div>
</template>