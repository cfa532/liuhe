<script setup lang="ts">
import { onMounted, ref } from 'vue';

const ips = ref([]);
const aid = ref();
const mimeiDB = import.meta.env.VITE_MIMEI_DB
onMounted(()=>{
    if (window.getParam) {
        let p=window.getParam()
        console.log(p)
        aid.value = p.aid ? p.aid : p.mid
        ips.value = p.ips
        // msg.value = "Resource data provided by:" + p["ips"][p.CurNode] + " from Providers: " + p.ips
    }
})
</script>

<template>
    <p ref="msgBox" style="margin-left:0px; width:98%; padding-left: 5px; padding-top: 10px; position:relative; border-top: 0px solid gainsboro; color:lightgray; word-wrap: break-word;">
        {{ aid }} / {{ mimeiDB }}
        <a v-for="ip in ips" style="color:lightgray" :href="'http://'+ip+'/entry?mid='+aid+'&ver=last&r=0.'+Date.now()" :key="ip">{{ ip }}&comma;&nbsp;</a>
    </p>
</template>