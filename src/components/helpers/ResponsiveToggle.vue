<script setup>
import {inject, onBeforeMount, ref} from "vue";
import SelectBox from "./SelectBox.vue";
const emit = defineEmits(['update:modelValue', 'update:statusField']);
const props = defineProps({
    modelValue: { type: String, default: '' },
    options: { type: Object, default: {} },
    icons: { type: Object, default: {} },
    fieldChanged: { type: Boolean, default: false }
});
const language  =   inject('language', []);
const icons = ref({
    global: 'fa-solid fa-globe',
    larger_desktop: 'fa-solid fa-tv',
    large_desktop: 'fa-solid fa-desktop',
    desktop: 'fa-solid fa-laptop',
    tablet: 'fa-solid fa-tablet',
    landscape_mobile: 'fa-solid fa-mobile fa-rotate-90',
    mobile: 'fa-solid fa-mobile'
})
const options = ref({
    global: language.ASTROID_GLOBAL,
    larger_desktop: language.ASTROID_XXL,
    large_desktop: language.ASTROID_XL,
    desktop: language.ASTROID_DESKTOP,
    tablet: language.ASTROID_TABLET,
    landscape_mobile: language.ASTROID_SM,
    mobile: language.ASTROID_MOBILE,
})
onBeforeMount(()=>{
    if (Object.keys(props.options).length) {
        options.value = props.options;
    }
    if (Object.keys(props.icons).length) {
        icons.value = props.icons;
    }
})
</script>
<template>
    <SelectBox
        :modelValue="props.modelValue"
        @update:modelValue="data => emit('update:modelValue', data)"
        :options="options"
        :icons="icons"
        :fieldChanged="props.fieldChanged"
        @update:statusField="data => emit('update:statusField', data)"
    />
</template>