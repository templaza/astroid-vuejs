<script setup>
import {onMounted, onUpdated, ref} from "vue";

const emit = defineEmits(['update:modelValue', 'update:statusField']);
const props = defineProps(['modelValue', 'options', 'icons', 'fieldChanged']);
const options = ref({})
const icons = ref({})
const selected = ref(props.modelValue);
onMounted(()=>{
    if (typeof props.options === 'object' && !Array.isArray(props.options) && props.options !== null && Object.keys(props.options).length) {
        options.value = props.options;
    }
    if (typeof props.icons === 'object' && !Array.isArray(props.icons) && props.icons !== null && Object.keys(props.icons).length) {
        icons.value = props.icons;
    }
})

onUpdated(()=>{
    selected.value = props.modelValue;
    if (props.fieldChanged === true) {
        emit('update:statusField', false);
    }
})

function fieldChanged(event) {
    if (typeof props.fieldChanged === 'undefined' || props.fieldChanged === false) {
        emit('update:modelValue', event.target.value);
    }
}
</script>
<template>
    <div class="input-group input-group-sm">
        <span class="input-group-text"><i :class="icons[modelValue]"></i></span>
        <select @change="event => fieldChanged(event)" v-model="selected" class="form-select">
            <option v-for="(text, value) in options" :value="value">{{ text }}</option>
        </select>
    </div>
</template>