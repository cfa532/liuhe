<script setup lang="ts">
import { ref } from 'vue'
import { CaseList } from '@/components';
const newCaseId = ref("")
function newCaseAdded(id:string) {
  if (id)
    newCaseId.value = id
}
</script>
<template>
    <!-- <div class="p-4">
        <div class="container">
        </div>
    </div> -->
    <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
      <div class="row justify-content-start">
        <div  class="col-2 align-self-start">
            <CaseList :newId="newCaseId"></CaseList>
        </div>
        <div class="col-8">
            <router-view  @newCaseAdded="newCaseAdded"></router-view>
        </div>
      </div>
    </div>
</template>
