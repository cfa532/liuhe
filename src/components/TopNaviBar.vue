<script setup lang="ts">
import { useAuthStore } from '@/stores';
import { ref } from 'vue';

const authStore = useAuthStore();
const searchIcon = ref<HTMLButtonElement>()
const searchBox = ref<HTMLInputElement>()
const searchWords = ref()

function openSearch() {
    if (searchBox.value!.style.width === '150px') {
        searchBox.value!.style.width = '0';
        searchBox.value!.value = '';
    } else {
        searchBox.value!.style.width = '150px';
        searchBox.value!.focus();
    }
}
function search() {
    console.log(searchWords.value)
    searchBox.value!.style.width = '0';
}
</script>

<template>
    <nav v-show="authStore.user" class="navbar navbar-expand navbar-dark bg-dark">
        <div class="navbar-nav">
            <router-link to="/" class="nav-item nav-link">首页</router-link>
            <router-link to="/users" class="nav-item nav-link">用户</router-link>
            <div class="search-container">
                <input ref="searchBox" v-model="searchWords" @keydown.enter.exact.prevent="search" type="text" class="search-box" placeholder="Search...">
                <button @click.prevent="openSearch" ref="searchIcon" class="search-icon">&#128269;</button>
            </div>
            <button style="position: absolute; right: 20px" @click="authStore.logout()" class="btn btn-link nav-item nav-link">退出</button>
        </div>
    </nav>
</template>

<style>
.navbar {
    height: 40px;
    background-color: #333;
  padding: 10px;
  color: white;
  text-align: center;
}
.search-container {
  position: absolute;
  right: -40px;
  display: inline-block;
  width: 400px;
}

.search-box {
  font-size: 16px;
  padding: 0px;
  margin: 0px;
  width: 0;
  position: relative;
  top: 0;
  right: 0;
  background: #666;
  color: white;
  border: none;
  outline: none;
  transition: width 0.5s ease-in-out;
}

.search-box:focus {
  border: 0px solid #555;
}

.search-icon {
  font-size: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  padding-top: 7px;
}

.search-icon:hover {
  color: #aaa;
}
</style>