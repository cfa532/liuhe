<script setup lang="ts">
import { onMounted, ref } from 'vue'

const mySidenav = ref<HTMLDivElement>()

function openNav() {
    mySidenav.value!.style.width = "250px";
}
function closeNav() {
    console.log("close bar")
    mySidenav.value!.style.width = "0";
}
onMounted(()=>{
    console.log("Sidebar mounted")
})
</script>

<template>
    <div ref="mySidenav" class="sidenav">
        <a href="javascript:void(0)" class="closebtn" @click="closeNav()">&times;</a>
        <a href="#">About</a>
        <a href="#">Services</a>
        <a href="#">Clients</a>
        <a href="#">Contact</a>
    </div>

    <span style="font-size:30px;cursor:pointer" @click="openNav()">&#9776; open</span>
</template>

<style>
.sidenav {
  height: 100%;
  width: 0;
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  background-color: #111;
  overflow-x: hidden;
  transition: 0.5s;
  padding-top: 60px;
}

.sidenav a {
  padding: 8px 8px 8px 32px;
  text-decoration: none;
  font-size: 25px;
  color: #818181;
  display: block;
  transition: 0.3s;
}

.sidenav a:hover {
  color: #f1f1f1;
}

.sidenav .closebtn {
  position: absolute;
  top: 0;
  right: 25px;
  font-size: 36px;
  margin-left: 50px;
}

@media screen and (max-height: 450px) {
  .sidenav {padding-top: 15px;}
  .sidenav a {font-size: 18px;}
}

@media screen and (min-width: 600px) {
  .sidenav {
    width: 250px; /* Or whatever width you want. */
  }
}
</style>