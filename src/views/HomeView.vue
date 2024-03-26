<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore, useMainStore as useMimei, useUsersStore } from '@/stores';
import { CaseList } from '@/components';
import { onMounted, ref } from 'vue';

// const api = useLeither();
const mmInfo = useMimei();
const { user } = storeToRefs(useAuthStore());
const sideNav = ref<HTMLDivElement>()
// const socket = new WebSocket(import.meta.env.VITE_LLM_URL)
const divOpenai = ref()
const selectLLM = ref()
const settings = ref(user.value.template ? user.value.template : {llm: "openai", temperature: "0.0"})

onMounted(async ()=>{
  console.log("main page mounted", mmInfo.$state, user.value)
})
async function onSubmit() {
  user.value.template = settings.value
  user.value.role = "admin"
  await useUsersStore().update(user.value.username, user.value)
  // socket.send(JSON.stringify({type: "service", parameters: {llm: settings.value.llm, temperature: settings.value.temperature}}))
}
</script>

<template>
  <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
    <div class="row justify-content-start">
      <div ref="sideNav" class="col-2 align-self-start">
        <CaseList></CaseList>
      </div>
      <div class="col">
        <h3 v-if="user">Hi, {{ user.givenName }}</h3>
        <br>
        <form @submit.prevent="onSubmit">
          <div class="row">
            <div class="col-4">
              <label for="llm">选择大模型：</label>
              <select v-model="settings.llm" ref="selectLLM" id="llm" class="form-select mt-2 mb-3">
                <option value="openai">OpenAI</option>
                <option value="qianfan">百度千帆</option>
              </select>
            </div>
          </div>
          <label>设定参数：</label>
          <div ref="divOpenai" class="form-floating mb-3 col-4">
            <input v-model="settings.temperature" type="text" id="temperature" class="form-control" placeholder="temperature: 0">
            <label for="temperature">Temperature:</label>
          </div>
          <button type="submit" class="btn btn-primary">提交</button>
        </form>
        <div class="row mt-4">
          <p>点击左侧“新建”按钮后，建立新主题，然后提交。<br><br>
            点击左侧的主题列表，继续对话。最近使用的主题会自动排在首位。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.form-floating {
  height: fit-content;
}
</style>