<script setup lang="ts">
// share menu or other right click items
import { ref } from 'vue'
const shareMenu = ref()
const emit = defineEmits(["deletePost"])

function showShareMenu() {
    shareMenu.value.hidden = false
    // toggle right menu on and off
    setTimeout(() => {
        window.onclick = function (e: MouseEvent) {
            if (e.target !== shareMenu.value) {
                shareMenu.value.hidden = true
                setTimeout(()=>{
                    window.onclick = null
                }, 100)
            }
        }
    }, 100)
}
function copyLink() {
    console.log(window.location.href);
    var input = document.body.appendChild(document.createElement("input"));
    input.value = window.location.href;
    input.focus();
    input.select();
    document.execCommand('copy');
    input.parentNode!.removeChild(input);
    // if (window.isSecureContext && navigator.clipboard)
    // navigator.clipboard.writeText(window.location.href)
}
function deletePage() {
    window.confirm("删除本会话全部内容？") ? emit("deletePost") : null
}
</script>

<template>
    <a href="#" @click.prevent="showShareMenu" style="text-decoration: none; font-size: 15px; color:rgb(60, 59, 59)">&#8226; &#8226; &bull;</a>
    <div ref="shareMenu" style="position: absolute; top: 5px; right: 0px; z-index: 20; background-color: whitesmoke;
        box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19); width: 250px;" hidden>
        <div style="border-bottom: 1px dotted; padding: 10px; text-align: center;">
            <a href="#" @click.prevent="copyLink">Copy &#128279; to clipboard</a>
        </div>
        <div style="border-bottom: 1px dotted; padding: 10px; text-align: center;">
            <a href="#" @click.prevent="deletePage">Delete</a>
        </div>
    </div>
</template>