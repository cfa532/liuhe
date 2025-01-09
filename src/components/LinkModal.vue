<script setup lang="ts">
import { watch, ref } from 'vue';

const emit = defineEmits(['save', 'cancel']);
const props = defineProps<{
    isVisible: boolean;
}>();
const urls = ref([''] as string[]);

const addUrl = () => {
    urls.value.push('');
};
const removeUrl = (index: number) => {
    // Check if removing the last element
    if (urls.value.length > 1) {
        urls.value.splice(index, 1);
    } else {
        // If only one element, set it to empty instead of removing
        urls.value[0] = '';
    }
};
const saveLinks = () => {
    const validUrls = [] as string[];
    urls.value.forEach((url, index) => {
        if (!isValidUrl(url)) {
            alert(`Invalid URL at index ${index + 1}`);
        } else {
            validUrls.push(url);
        }
    });
    emit('save', validUrls);
};
const cancel = () => {
    emit('cancel');
};
const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
};
watch(() => props.isVisible, (isVisible) => {
    if (isVisible) {
        urls.value = [''] ;
    }
});
</script>

<template>
    <div v-if="isVisible" class="link-input-modal">
        <div class="modal-content">
            <div v-for="(url, index) in urls" :key="index" class="input-group">
                <input type="text" v-model="urls[index]" placeholder="Enter URL" />
                <button @click="removeUrl(index)" class="delete-button">×</button>
            </div>
            <div class="button-group">
                <button @click="addUrl" class="add-button">Add URL</button>
                <button @click="saveLinks" class="save-button">Save</button>
                <button @click="cancel" class="cancel-button">Cancel</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.link-input-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 600px;
}

.input-group {
    display: flex;
    margin-bottom: 10px;
}

.input-group input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-right: 5px;
}

.delete-button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 0px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 24px; /* Adjust size as needed */
    line-height: 1; /* Remove extra spacing */
}

.add-button {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 10px;
}

.button-group {
    display: flex;
    justify-content: flex-end;
    margin-top: 15px;
    /* Added these lines */
    gap: 20px; /* Adds spacing between buttons */
}

.button-group button {
    /* Added these lines */
    flex: 1; /* Makes buttons take equal width */
    height: 36px; /* Sets a consistent height */
    padding: 0; /* Reset padding to avoid conflicts */
    display: flex; /* Centers content vertically */
    align-items: center; /* Centers content vertically */
    justify-content: center; /* Centers content horizontally */
}

</style>