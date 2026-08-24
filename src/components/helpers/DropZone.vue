<script setup>
import { reactive, onUpdated, inject } from 'vue';
import axios from "axios";
import { useDropzone } from "vue3-dropzone";

const props = defineProps({
    media: { type: String, default: ''},
    folder: { type: String, default: ''},
    clickUpload: { type: Boolean, default: false },
});
const emit = defineEmits(['update:media']);
const state = reactive({
  files: [],
});
const constant = inject('constant', {});
const api = inject('api');
const { getRootProps, getInputProps, isDragActive, ...rest } = useDropzone({
  onDrop,
});

function onDrop(acceptFiles, rejectReasons) {
//   console.log('acceptFile: ',acceptFiles);
//   console.log('rejectReason: ',rejectReasons);
  acceptFiles.forEach(element => {
    state.files.push(element);
  });
}

function handleClickDeleteFile(index) {
  state.files.splice(index, 1);
}

const saveFiles = (files) => {
    for (let x = 0; x < files.length; x++) {
        const formData = new FormData(); // pass data as a form
        formData.append("file", files[x]);
        if (constant.cms_name === 'moodle') {
            const uploadUrl = `${constant.base_url}/webservice/upload.php`;
            axios.post(uploadUrl, formData, {
                params: { token: constant.upload_token }
            }).then (async function (uploadResponse) {
                const response = await api.moodleRequest('local_moon_upload_media', {
                    theme: constant.template_name,
                    task: 'upload',
                    filearea: props.media,
                    itemid: 0,
                    folder: props.folder,
                    fileInfo: {
                        contextid: uploadResponse.data[0].contextid,
                        component: uploadResponse.data[0].component,
                        filearea: uploadResponse.data[0].filearea,
                        itemid: uploadResponse.data[0].itemid,
                        filepath: uploadResponse.data[0].filepath,
                        filename: uploadResponse.data[0].filename
                    }
                });
                if (response.data[0].error === false) {
                    if (x === files.length - 1) {
                        emit('update:media');
                    }
                } else {
                    alert(response.data[0].exception.message);
                }
            }).catch(function (error) {
                // handle error
                console.log(error);
            });
        } else {
            formData.append(constant.astroid_admin_token, 1);
            axios.post(constant.base_url+'/administrator/index.php?option=com_ajax&astroid=media&action=upload&media='+props.media+'&dir=images/'+props.folder, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }).then((response) => {
                if (x === files.length - 1) {
                    emit('update:media');
                }
            }).catch((err) => {
                console.error(err);
            });
        }
    }
};

onUpdated(()=>{
    if (props.clickUpload === true && state.files.length) {
        saveFiles(state.files);
    }
})
</script>

<template>
  <div v-if="state.files.length > 0" class="files mb-3">
    <div class="file-item" v-for="(file, index) in state.files" :key="index">
      <span>{{ file.name }}</span>
      <span class="delete-file" @click="handleClickDeleteFile(index)"
      >Delete</span
      >
    </div>
  </div>
  <div class="dropzone" v-bind="getRootProps()">
    <div
        class="border"
        :class="{isDragActive,}"
    >
        <input v-bind="getInputProps()" />
        <div v-if="isDragActive" class="text-center py-5">
            <i class="fas fa-cloud-arrow-up fa-4x mb-3"></i>
            <div>Drop the files here ...</div>
        </div>
        <div v-else class="text-center py-5">
            <i class="fas fa-cloud-arrow-up fa-4x mb-3"></i>
            <div>Drag and drop files here, or Click to select files</div>
        </div>
    </div>
  </div>
</template>