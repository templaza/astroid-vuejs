<script setup>
import {onBeforeMount, reactive} from 'vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps(['modelValue', 'field']);
const fromTo = reactive({
    from: '',
    to: '',
});
onBeforeMount(()=>{
    if (typeof props.modelValue !== 'undefined' && props.modelValue !== '') {
        let tmp = JSON.parse(props.modelValue);
        fromTo.from = tmp.from;
        fromTo.to = tmp.to;
    }
})
</script>
<template>
    <div class="input-group">
        <span class="input-group-text">from</span>
        <input type="text" class="form-control" aria-label="From" v-model="fromTo.from" @input="emit('update:modelValue', JSON.stringify(fromTo))">
        <span class="input-group-text">to</span>
        <input type="text" class="form-control" aria-label="To" v-model="fromTo.to" @input="emit('update:modelValue', JSON.stringify(fromTo))">
        <span v-if="props.field.input.unit" class="input-group-text">{{ props.field.input.unit }}</span>
    </div>
    <input
        :id="props.field.input.id"
        :name="props.field.input.name"
        :value="modelValue"
        type="hidden"
    />
</template>