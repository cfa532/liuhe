<script setup lang="ts">
import { ref, computed } from 'vue'
import { CAlert } from '@coreui/vue';
import 'bootstrap/dist/css/bootstrap.min.css'

const props = defineProps({
    title: {type: String, required: true}
})
</script>
<template>
    <b-button >{{ props.title }}</b-button>
</template>