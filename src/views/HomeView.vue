<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores';
import { CaseList } from '@/components';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

</script>

<template>
    <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
      <div class="row justify-content-start">
        <div  class="col-2 align-self-start">
            <CaseList></CaseList>
        </div>
        <div class="col-8">
            <h3>Hi, {{user.givenName}}!</h3>
            <p>点击左侧“新建”按钮后，上传诉状，系统会自动登记案件信息。如有错误，请手动输入正确信息。然后提交。</p>
            <p>新案件登记完成后，随时上传案件相关文件，以便系统建立完善的案件数据库。</p>
            <p>点击左侧的案件列表，选择工作案例</p>
        </div>
        <div class="col-2">Chat with AI</div>
      </div>
    </div>
</template>
