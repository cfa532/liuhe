<script setup lang="ts">
import { ref } from 'vue'
import { CaseList } from '@/components';
const caseId = ref("")
// function newCase(id:string) {
//   console.log("new case id", id)
//   if (id)
//     caseId.value = id
//   else {
//     // if ID is null, means the case is deleted, reload case list
//     caseId.value = ""
//   }
// }
</script>
<template>
    <!-- <div class="p-4">
        <div class="container">
        </div>
    </div> -->
    <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
      <div class="row justify-content-start">
        <div  class="col-2 align-self-start">
            <CaseList :caseId="caseId"></CaseList>
        </div>
        <div class="col-8">
            <router-view @newCaseId="(id:string)=>caseId=id"></router-view>
        </div>
        <div class="col-2">Chat with AI</div>
      </div>
    </div>
</template>
