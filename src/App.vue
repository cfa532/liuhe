<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Nav, Alert, CaseList } from '@/components'
import { useAuthStore  } from '@/stores';
import { router } from '@/router'

const authStore = useAuthStore();

function addNewCase() {
  // create a new case
  router.push('/case/add')
}
</script>

<template>
  <div class="app-container" :class="authStore.user && 'bg-light'">
    <Nav />
    <Alert />
    <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
      <div class="row justify-content-start">
        <div v-show="authStore.user" class="col-2 align-self-start">
          <button @click="addNewCase()" type="button" class="btn btn-primary">新建</button>
          <CaseList></CaseList>
        </div>
        <div class="col">
          <div class="container pt-4 pb-4">
            <div>
              <router-view />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './assets/base.css';
</style>
