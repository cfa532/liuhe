<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore, useUsersStore, useAlertStore } from '@/stores';
import { CaseList } from '@/components';
import { onMounted, ref, watch } from 'vue';

// const api = useLeither();
// const mmInfo = useMimei();
const { user } = storeToRefs(useAuthStore());
const sideNav = ref<HTMLDivElement | null>(null); // Add null type
const settings = ref({
  llm: user.value?.template?.llm || "openai", // Default to openai if undefined
  temperature: user.value?.template?.temperature || "0.0", // Default to 0.0 if undefined
  model: user.value?.template?.model || "gpt-4.1" // Default to gpt-4o if undefined
});
const submitted = ref(true);
const models = ref(["o3-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"]);
const alert = useAlertStore();

async function onSubmit() {
  alert.clear();
  submitted.value = true;

  if (!settings.value.model || models.value.indexOf(settings.value.model) === -1) {
    alert.error("必须选择 Model");
    submitted.value = false;
    return;
  }
  try {
    // Ensure user.value exists before accessing properties
    if (user.value) {
      user.value.template = { ...settings.value }; // Create a new object to avoid reference issues
      await useUsersStore().update(user.value.username, user.value);
      alert.success("Account updated.");
    } else {
      alert.error("User data not available.");
      submitted.value = false;
    }
  } catch (error) {
    console.error("Update user account failed:", error); // Log the error for debugging
    alert.error("Update user account failed.");
    submitted.value = false;
  }
}

function selectLLM() {
  let newModels: string[] = [];
  if (settings.value.llm === "openai") {
    newModels = ["o3-mini", "gpt-4o", "gpt-4.1"];
  } else if (settings.value.llm === "gemini") {
    newModels = ["gemini-2.5-pro-preview-06-05", "gemini-1.5-pro"];
  } else if (settings.value.llm === "claude") {
    newModels = ["claude-sonnet-4-20250514", "claude-opus-4-20250514"];
  }
  models.value = newModels;

  // Ensure settings.value.model is valid after LLM change
  if (!models.value.includes(settings.value.model)) {
    settings.value.model = models.value[0]; // Default to the first model in the list
  }
}

onMounted(() => {
  selectLLM();
});

// Watch for changes in settings to enable the submit button
watch(settings, () => {
  submitted.value = false;
}, { deep: true });

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
        <form id="llms" @submit.prevent="onSubmit">
          <div class="row">
            <div class="col-4">
              <label for="llm">LLM:</label>
              <select v-model="settings.llm" @change="selectLLM" class="form-select mt-2 mb-3">
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="claude">Claude</option>
              </select>
            </div>
            <div class="col-4">
              <label for="llm">Model:</label>
              <select v-model="settings.model" class="form-select mt-2 mb-3">
                <option v-for="(model, index) in models" :value="model" :key="index">{{ model }}</option>
              </select>
            </div>
          </div>
          <label>设定参数：</label>
          <div class="form-floating mb-3 col-4">
            <input v-model="settings.temperature" type="text" id="temperature" class="form-control"
              placeholder="temperature: 0">
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