<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useCaseStore } from '@/stores';
import Preview from "./FilePreview.vue";
import { io, Socket } from "socket.io-client"
interface HTMLInputEvent extends Event { target: HTMLInputElement & EventTarget }

const filesUpload = ref<File[]>([]);
const uploadProgress = reactive<number[]>([]); // New ref to store upload progress of each file
const divAttach = ref()
const dropHere = ref()
const btnSubmit = ref()
const spinner = ref("Submit")
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
      filesUpload.value.push(f);
    }
  })
  divAttach.value!.hidden = false
  dropHere.value!.hidden = true
};
function dragOver() {
  // display drop here mark when there is no file selected
  if (filesUpload.value.length<1)
    dropHere!.value!.hidden = false
}
function onSubmit() {
  // process the uploaded file with AI
  console.log(filesUpload.value)
  const caseStore = useCaseStore()

  const socket:Socket = io(LLM_URL)
  socket.on('connect', ()=>{
    console.log("socket connected")
    socket.emit("hello", "world", (response:any) => {
      console.log(response.status); // "got it"
    });

    function upload_files(files:File[], index:number) {
      if (index > files.length-1) {
        // clear files and hide the modal
        filesUpload.value = []
        btnSubmit.value.disabled = false
        spinner.value = "Submit"
        // document.getElementById("closeModal")?.click()
        return
      }
      // use case id as collection name in DB
      socket.emit("upload_file", caseStore.id, files[index].name, files[index].type, files[index], (status:any)=>{
        console.log(status)
        if (status == "success") {
          results.value.push(files[index].name + " done.")
          upload_files(files, index+1)
        }
      })
    }
    // start the spinner, disable submit button
    btnSubmit.value.disabled = true
    spinner.value = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span class="sr-only">Loading...</span>'
    upload_files(filesUpload.value, 0)

    socket.on("Done", (res)=>{
      console.log("received: " + res)
      results.value.push(res)
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
watch(()=>filesUpload.value.length, (nv)=>{
  // show "DROP HERE"
  if (nv==0) dropHere!.value!.hidden = false
})
</script>

<template>
<div id="myModal" class="modal fade" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content" @dragover.prevent="dragOver" @drop.prevent="onSelect">
      <form enctype="multipart/form-data" method="POST">
      <div class="modal-header">
        <h5 class="modal-title">上传文件</h5>
        <button id="closeModal" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
          <div ref="dropHere"
            style="border: 1px solid lightgrey; text-align: center; width:100%; height:100px; margin: 0px;">
            <p style="font-size: 24px; padding-top: 30px;">DROP HERE</p>
          </div>
        <div ref="divAttach" hidden
          style="border: 0px solid lightgray; border-radius: 3px; margin-bottom: 6px; padding-top:0px;" >
          <Preview @file-canceled="removeFile(file)" v-for="(file, index) in filesUpload" :key="index"
            v-bind:src="file" v-bind:progress="uploadProgress[index]"></Preview>
        </div>
      </div>
        <div class="modal-footer">
          <input id="selectFiles" @change="onSelect" type="file" name="files[]" accept=".pdf,.txt,.docx" hidden multiple>
          <button @click.prevent="selectFile" type="button" class="btn btn-secondary">Choose</button>
          <button ref="btnSubmit" @click.prevent="onSubmit" type="button" class="btn btn-primary" v-html="spinner"></button>
        </div>
      </form>
      <div id="divResult">
        <p v-for="(r,i) in results" :key="i.toString">{{ r }}</p>
      </div>
    </div>
  </div>
  </div>
</template>

