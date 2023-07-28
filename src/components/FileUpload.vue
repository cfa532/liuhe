<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, reactive, computed } from "vue";
import type { CSSProperties } from "vue";
import Preview from "./FilePreview.vue";
interface HTMLInputEvent extends Event { target: HTMLInputElement & EventTarget }

const props = defineProps({
    display: {type: String, required: false, default:"none"},
})
const classModal = computed(():CSSProperties=>{
  return {
    display: props.display,
    position: "fixed",
    'z-index': 1,
    overflow: "auto",
    left: 0, top: 0, width: "100%", height: "100%",
    'background-color': "rgb(0,0,0,0.7)",
  }
})
const filesUpload = ref<File[]>([]);
const uploadProgress = reactive<number[]>([]); // New ref to store upload progress of each file
const inpCaption = ref()
const divAttach = ref()
const dropHere = ref()
const myModal = ref()
const emit = defineEmits(["uploaded", "hide"])
const LLM_URL = import.meta.env.VITE_LLM_URL

function onSelect(e: Event) {
  let files = (e as HTMLInputEvent).target.files || (e as DragEvent).dataTransfer?.files;
  if (!files) return

  Array.from(files).forEach(f => {
    if (filesUpload.value.findIndex((e:File) => { return e.name === f.name && e.size === f.size && e.lastModified === f.lastModified }) === -1) {
      // filter duplication
      console.log(f)
      if (inpCaption.value === "" || !inpCaption.value) {
        inpCaption.value = f.name
      }
      filesUpload.value.push(f);
    }
  })
  divAttach.value!.hidden = false
  dropHere.value!.hidden = true
};
function dragOver(evt: DragEvent) {
  dropHere!.value!.hidden = false
}
async function onSubmit() {
  // process the uploaded file with AI
  const formData = new FormData()
  formData.append("file", filesUpload.value[0])
  const resp = await fetch(LLM_URL + '/init', {
    method: "POST",
    mode: "cors",
    // headers: {               
    //   "Content-Type": "multipart/form-data",   // do NOT set this
    // },
    body: formData
  })
  if (resp.ok) {
    const data = await resp.json()
    console.log(data)
  } else {
    console.error("Fetch error", resp)
  }
}
function selectFile() {
  // call the real function to select a file to upload
  document.getElementById("selectFiles")?.click();
}
function removeFile(f: File) {
  // removed file from preview list
  var i = filesUpload.value.findIndex((e:File) => e==f);
  filesUpload.value.splice(i, 1)
}
// When the user clicks anywhere outside of the modal, close it
const onClickOutside = (e: MouseEvent) => {
  if (e.target == myModal.value) {
    emit("hide")
  }
};

onBeforeUnmount(() => {
  window.removeEventListener("click", onClickOutside);
});
onMounted(async () => {
  console.log("Editor mount", props)
  window.addEventListener("click", onClickOutside);
})
</script>

<template>
  <div ref="myModal" :style="classModal">
    <div class="modal-content" @dragover.prevent="dragOver" @drop.prevent="onSelect">
      <form @submit.prevent="onSubmit" enctype="multipart/form-data" method="POST">
        <div style="width:99%; margin-bottom: 10px;">
          <div ref="dropHere"
            style="border: 1px solid lightgrey; text-align: center; width:100%; height:100px; margin: 0px;">
            <p style="font-size: 24px; padding-top: 30px;">DROP HERE</p>
          </div>
        </div>
        <div ref="divAttach" hidden
          style="border: 0px solid lightgray; border-radius: 3px; margin-bottom: 6px; padding-top:0px;" >
          <Preview @file-canceled="removeFile(file)" v-for="(file, index) in filesUpload" :key="index"
            v-bind:src="file" v-bind:progress="uploadProgress[index]"></Preview>
        </div>
        <div>
          <input id="selectFiles" @change="onSelect" type="file" name="file" hidden>
          <button @click.prevent="selectFile">Choose</button>
          <button style="float: right;">Submit</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style>
.modal-content {
  border-radius: 5px;
  background-color: #ebf0f3;
  margin: 5% 10% 5% 2%;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
  /* height: 150px; */
  max-width: 800px;
  top: 5%;
  left: 5%
}
</style>