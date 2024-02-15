<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Nav, Alert } from '@/components'
import { useAuthStore  } from '@/stores'

const authStore = useAuthStore();
</script>

<template>
  <div class="app-container" :class="authStore.user && 'bg-light'">
    <Nav />
    <Alert />
    <div class="container-fluid text-left" style="position: absolute; left: 0px; padding: 5px;">
      <div class="row justify-content-start">
        <div class="col pt-2 pb-4">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './assets/base.css';
</style>
