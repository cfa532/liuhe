<script setup lang="ts">
import { shallowRef, watch, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia';
import { useCaseListStore, useCaseStore } from "@/stores";
import { router } from '@/router'

const props=defineProps({
    caseId: {type: String, required: false},
})
const emits = defineEmits(["sideNavClosed"])
const btnOpen = ref<HTMLSpanElement>()
const allCases = shallowRef([] as ChatCase[])
const caseListStore = storeToRefs(useCaseListStore())
const mySidenav = ref<HTMLDivElement>()

function openNav() {
    mySidenav.value!.style.width = "160px";
    mySidenav.value!.style.paddingLeft = "5px"
    btnOpen.value!.hidden = true
}
function closeNav() {
    console.log("close bar")
    mySidenav.value!.style.width = "0";
    mySidenav.value!.style.paddingLeft = "0"
    btnOpen.value!.hidden = false
    emits("sideNavClosed")
}
watch(()=>props.caseId, async (nv, ov)=>{
    console.log("caseId:",nv, ov)
    if (nv && nv!=='0') {
        if (allCases.value.findIndex(c=>c.id==nv) == -1)
            allCases.value.unshift(useCaseStore()._value)
        useCaseListStore().setActiveId(nv)
    } else {
        allCases.value = await caseListStore.allCases.value
        router.push("/case")
    }
})
onMounted(async ()=>{
    // get list of cases of the user
    allCases.value = await caseListStore.allCases.value
    console.log("case list mounted", caseListStore.activeId.value, allCases.value)
    mySidenav.value!.style.backgroundColor = document.body.style.background + " solid"
})
function selectCase(c:ChatCase) {
    // highlight current case and
    console.log(c) 
    useCaseListStore().setActiveId(c.id)
    router.push("/case/edit/"+c.id)
}
function addNewCase() {
    // create a new case
    useCaseListStore().setActiveId("")
    router.push('/case/add')
}
function btnClass(c:ChatCase) {
    return "btn btn-light text-nowrap btn-outline-secondary " + (c.id==caseListStore.activeId.value ? "active" : "")
}
</script>
<template>
<div ref="mySidenav" class="sidenav">
    <a href="javascript:void(0)" class="closebtn" @click="closeNav()">&times;</a>
    <div class="btn-group-vertical btn-group-sm d-grid gap-1" role="group" aria-label="Small button group">
        <button @click="addNewCase" type="button" class="btn btn-light text-nowrap btn-outline-primary">
            <span style="display: block; width: 120px;">新建</span>
        </button>
        <button @click="selectCase(c)" v-for="(c,i) in allCases" :key="i" type="button" :class="btnClass(c)">{{c.brief}}</button>
    </div>
</div>
<span ref="btnOpen" hidden style="font-size:30px; cursor:pointer; margin: 5px; position:fixed; margin-top: 170px;" @click="openNav()"> &#9776; </span>
</template>
<style>
.btn {
    overflow:hidden;
}
.sidenav {
    height: 100%;
    width: 160px;
    /* max-width: 160px; */
    position: fixed;
    z-index: 1;
    top: 40px;
    left: 0;
    /* background-color:rgb(246, 244, 240); */
    overflow-x: hidden;
    transition: 0.5s;
    padding-top: 60px;  /* hide Open button */
    padding-left: 5px;
    /* padding-right: 5px; */
}
.sidenav .closebtn {
  position: absolute;
  top: 0px;
  right: 25px;
  font-size: 30px;
  margin-left: 50px;
  text-decoration: none;
}

@media screen and (max-height: 450px) {
  .sidenav {padding-top: 15px;}
}
@media screen and (min-width: 600px) {
  .sidenav {
    max-width: 160px; /* Or whatever width you want. */
  }
  .sidenav .closebtn {
    font-size:  0px;
  }
}
</style>