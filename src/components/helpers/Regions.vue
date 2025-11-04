<script setup>
import {onBeforeMount, onUpdated, ref, inject} from 'vue';
const emit = defineEmits(['update:modelValue']);
const props = defineProps(['modelValue', 'field', 'layoutType']);
const constant = inject('constant', {});
const regions = ref([]);
const selectedRegion = ref('')
onBeforeMount(()=>{
    if (typeof constant.theme_config.layouts !== 'undefined' && typeof constant.theme_config.layouts[props.layoutType] !== 'undefined') {
        const layout = constant.theme_config.layouts[props.layoutType];
        regions.value = layout.regions;
        selectedRegion.value = layout.defaultregion;

    } else {
        regions.value = constant.theme_config.regions;
        selectedRegion.value = constant.theme_config.defaultregion;
    }
    if (typeof props.modelValue === 'undefined' || props.modelValue === '') {
        emit('update:modelValue', selectedRegion.value);
    } else {
        selectedRegion.value = props.modelValue;
    }
})
onUpdated(()=>{
    if (props.modelValue !== selectedRegion.value) {
        selectedRegion.value = props.modelValue;
    }
})
</script>
<template>
    <select :id="props.field.input.id" :name="props.field.input.name" class="form-select" v-model="selectedRegion" @change="emit('update:modelValue', $event.target.value)">
        <option v-for="region in regions" :key="region" :value="region">{{region}}</option>
    </select>
</template>