<script setup lang="ts">
import { onMounted, ref, reactive } from "vue";
import Preview from "./FilePreview.vue";
import { io, Socket } from "socket.io-client"
import { Modal } from 'bootstrap'

interface HTMLInputEvent extends Event { target: HTMLInputElement & EventTarget }

const state = reactive({
    modal_demo: null,
})

const props = defineProps({
    display: {type: String, required: false, default:"none"},
})
const filesUpload = ref<File[]>([]);
const uploadProgress = reactive<number[]>([]); // New ref to store upload progress of each file
const inpCaption = ref()
const divAttach = ref()
const dropHere = ref()
const emit = defineEmits(["newCaseValues", "hide", "myModal"])
const LLM_URL = import.meta.env.VITE_LLM_URL
const results = ref([] as any[])
// const axios: any = inject('axios')

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
  filesUpload.value.forEach((f)=>{formData.append('file', f)})

  const socket:Socket = io(LLM_URL)
  socket.on('connect', ()=>{
    console.log("socket connected")
    socket.emit("hello", "world", (response:any) => {
      console.log(response.status); // "got it"
    });

    socket.emit("init_case", filesUpload.value[0].name, filesUpload.value[0].type, filesUpload.value[0], (status:any)=>{
      console.log(status)
    })

    socket.on("Done", (res)=>{
      console.log("received: " + res)
      results.value.push(res)
      emit("hide", true)
      emit("newCaseValues", res)
      // hide modal and return to previous page
    })
  })
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
onMounted(async () => {
  console.log("Editor mount", props)
  // state.modal_demo = new Modal('#myModal', {})
  // state.modal_demo.show()
})
</script>

<template>
<div id="myModal" class="modal fade" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content" @dragover.prevent="dragOver" @drop.prevent="onSelect">
      <form @submit.prevent="onSubmit" enctype="multipart/form-data" method="POST">
      <div class="modal-header">
        <h5 class="modal-title">上传文件</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
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
      </div>
        <div class="modal-footer">
          <input id="selectFiles" @change="onSelect" type="file" name="files[]" hidden multiple>
          <button @click.prevent="selectFile"  type="button" class="btn btn-secondary">Choose</button>
          <button style="float: right;"  type="button" class="btn btn-primary">Submit</button>
        </div>
      </form>
      <div id="divResult">
        <p v-for="(r,i) in results" :key="i.toString">{{ r }}</p>
      </div>
    </div>
  </div>
  </div>
</template>

