<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
const emit = defineEmits(["fileCanceled"])
const props = defineProps({
    src: {type: File, required: true},
})
const imageUrl = ref("")
const caption = ref("")
onMounted(()=>{
    // src file may not be image
    thumbnail()
})
watch(()=>props.src, (newVal, oldVal)=>{
    if (newVal !== oldVal) {
        thumbnail()
    }
})

function thumbnail() {
    if (props.src.type.includes("image")) {
        imageUrl.value = URL.createObjectURL(props.src)
        caption.value = props.src.name
    } else if (props.src.type.includes("video")) {
        generateVideoThumbnail(props.src).then(url=>{
            imageUrl.value = url
            caption.value = props.src.name
        })
    } else {
        // everything else, draw avtar with file extensioin
        const canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d")!;
          canvas.width = 120;
          canvas.height = 120;
          ctx.font = '48px serif';
          ctx.fillText(props.src.name.substring(props.src.name.lastIndexOf('.')+1), 15, 60);
          imageUrl.value = canvas.toDataURL("image/png");
          caption.value = props.src.name
    }
}
const generateVideoThumbnail = (file: File) => {
  return new Promise<string>((resolve) => {
    const canvas = document.createElement("canvas");
    const video = document.createElement("video");

    // this is important
    video.autoplay = true;
    video.muted = true;
    video.src = URL.createObjectURL(file) + '#t=1';     // delay 1s
    video.onloadeddata = () => {
      let ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx!.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      video.pause();
      return resolve(canvas.toDataURL("image/png"));
    };
  });
};
</script>

<template>
    <div class="postbox_media_photo_wrapper" :style="{position: 'relative'}">
        <div style="position: absolute; display: flex; top: -5px; right: -20px;">
            <button @click='emit("fileCanceled")' title="Close" class="btn-reset" type="button">
            <svg style="width:20px; height:20px;">
                <circle cx="10" cy="10" r="10" stroke="black" stroke-width="0" fill="#ee8855" />
                <line x1="5" y1="5" x2="15" y2="15" style="stroke:#fff;stroke-width:2"></line>
                <line x1="15" y1="5" x2="5" y2="15" style="stroke:#fff;stroke-width:2"></line>
            </svg>
            </button>
        </div>
            <div style="font-size:smaller; overflow-wrap: break-word;">{{caption}}</div>
    </div>
</template>

<style>
.postbox_media_photo_wrapper {
  position: relative;
  display: inline-block;
  background-color: #fff;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
  transition: All .15s ease-out;
  /* max-width: calc(25% - 32px); */
  flex-grow: 1;
  margin-right: 20px;
  margin-left: 10px;
}
.btn-reset {
    background: none;
    border: none;
    filter: none;
    padding: 0;
    outline: none;
    cursor: pointer;
}
  </style>