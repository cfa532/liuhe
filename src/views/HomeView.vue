<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore, useUsersStore, useAlertStore } from '@/stores';
import { CaseList } from '@/components';
import { onMounted, ref } from 'vue';

// const api = useLeither();
// const mmInfo = useMimei();
const { user } = storeToRefs(useAuthStore());
const sideNav = ref<HTMLDivElement>()
const settings = ref(user.value.template ? user.value.template : {llm:"openai",temperature: "0.0",model:"gpt-4o"})
const submitted = ref(true)
const models = ref(["o1-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"])
const selectedModel = ref(settings.value.model);

async function onSubmit() {
  submitted.value = true
  user.value.template = settings.value
  try {
    await useUsersStore().update(user.value.username, user.value)
    useAlertStore().success("Account updated.")
  } catch {
    useAlertStore().error("Update user account failed.")
  }
}
function selectLLM() {
  if (settings.value.llm == "openai") {
    models.value = ["o1-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]
  } else if (settings.value.llm == "gemini") {
    models.value = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"]
  }
  if (models.value.findIndex(e => e===settings.value.model) > -1) {
    selectedModel.value = settings.value.model
  } else {
    selectedModel.value = models.value[0]
  }
}
onMounted(()=>{
  selectLLM()
})
</script>

<template>
  <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
    <div class="row justify-content-start">
      <div ref="sideNav" class="col-2 align-self-start">
        <CaseList></CaseList>
      </div>
      <div class="col">
        <h3 v-if="user">Hi, {{ user.given_name }}</h3>
        <br>
        <form @change.prevent="submitted=false" @submit.prevent="onSubmit">
          <div class="row">
            <div class="col-4">
              <label for="llm">选择大模型：</label>
              <select v-model="settings.llm" @change.prevent="selectLLM" class="form-select mt-2 mb-3">
                <option value="openai" selected>OpenAI</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
            <div class="col-4">
              <label for="llm">选择模型：</label>
              <select v-model="selectedModel" class="form-select mt-2 mb-3">
                <option v-for="(model, index) in models" :value="model" :key="index">{{model}}</option>
              </select>
            </div>
          </div>
          <label>设定参数：</label>
          <div class="form-floating mb-3 col-4">
            <input v-model="settings.temperature" type="text" id="temperature" class="form-control" placeholder="temperature: 0">
            <label for="temperature">Temperature:</label>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="submitted">提交</button>
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