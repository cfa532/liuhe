<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from "vue";
import { storeToRefs } from 'pinia';
import { useAuthStore, useCaseListStore } from "@/stores";
import { CAlert, CButtonGroup, CButton } from '@coreui/vue';
import 'bootstrap/dist/css/bootstrap.min.css'

const allCases = ref([] as LegalCase[])
const user = useAuthStore().user    // get current signed in user
const props = defineProps({
    activeBtnIdx: {type:Number, required: false, default:0}
})

onMounted(async ()=>{
    // get list of cases of the user
    // cases.value = useCaseStore().getAllCases()
    allCases.value = await useCaseListStore().allCases
    console.log("all cases:",allCases.value)
})
</script>
<template>
<div>
    <CButtonGroup role="group" aria-label="Basic example" vertical>
        <CButton v-for="(c,i) in allCases" :key="i.toString()">{{c}}</CButton>
    </CButtonGroup>
</div>
</template>