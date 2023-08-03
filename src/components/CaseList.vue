<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from "vue";
import { storeToRefs } from 'pinia';
import { useCaseListStore } from "@/stores";
import { CButtonGroup, CButton } from '@coreui/vue';
import 'bootstrap/dist/css/bootstrap.min.css'

const allCases = ref([] as LegalCase[])
const props = defineProps({
    activeBtnIdx: {type:Number, required: false, default:0}
})

onMounted(async ()=>{
    // get list of cases of the user
    allCases.value = await useCaseListStore().allCases
    console.log("all cases:",allCases)
})
</script>
<template>
<div>
    <CButtonGroup role="group" aria-label="Basic example" vertical>
        <CButton v-for="(c,i) in allCases" :key="i.toString()">{{c.title}}</CButton>
    </CButtonGroup>
</div>
</template>