<script setup>
import { onMounted, onUpdated, ref } from 'vue';
import { MultiListSelect } from "vue-search-select"
const emit = defineEmits(['update:modelValue']);
const props = defineProps({
    field: { type: Object, default: null },
    modelValue: { type: String, default: '' },
});

const selectedItems = ref([]);
const list = ref([]);

onMounted(()=>{
    selectedItems.value = JSON.parse(props.modelValue);
    list.value = props.field.input.options;
})

onUpdated(()=>{
    if (JSON.stringify(selectedItems.value) !== props.modelValue) {
        selectedItems.value = JSON.parse(props.modelValue);
    }
})

function onSelectDevice(items, lastSelectItem) {
    selectedItems.value = items;
    emit('update:modelValue', JSON.stringify(selectedItems.value));
}
</script>
<template>
    <multi-list-select
        :list="list"
        option-value="value"
        option-text="label"
        :id="props.field.id"
        :selected-items="selectedItems"
        placeholder="Select Tags"
        @select="onSelectDevice"
    >
    </multi-list-select>
    <input type="hidden" :name="props.field.input.name" :value="modelValue">
</template>