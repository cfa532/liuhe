<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores';
import { CaseList } from '@/components';
import { onMounted, ref } from 'vue';
import { useMainStore as useMimei, useLeitherStore as useLeither } from "../stores/lapi"

// const api = useLeither();
const mmInfo = useMimei();
const { user } = storeToRefs(useAuthStore());
const sideNav = ref<HTMLDivElement>()

onMounted(async ()=>{
  // mmInfo.init(api)
  console.log("main page mounted", mmInfo.$state, await mmInfo.mmsid)
})
</script>

<template>
    <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
      <div class="row justify-content-start">
        <div ref="sideNav" class="col-2 align-self-start">
            <CaseList></CaseList>
        </div>
        <div class="col">
            <h3 v-if="user">Hi, {{user.givenName}}</h3>
            <br>
            <p>点击左侧“新建”按钮后，建立新主题，然后提交。<br><br>
            点击左侧的主题列表，继续对话。最近使用的主题会自动排在首位。</p>
        </div>
      </div>
    </div>
</template>
