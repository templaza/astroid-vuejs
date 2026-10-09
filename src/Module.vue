<script setup>
import { onBeforeMount, ref, provide } from 'vue';
import Layout from "./components/helpers/Layout.vue";
import './assets/base.scss'
const props = defineProps(['config']);
const data = props.config;
const layout = ref('{"sections":[]}');
provide('constant', data.constant);
provide('language', data.language);
onBeforeMount(()=>{
    layout.value = JSON.stringify(data.layout);
})
</script>
<template>
    <Layout v-model="layout" source="joomla_module" :colorMode="1" :field="{
                id: data.id,
                input: {
                    id: data.id,
                    name: data.name,
                    value: data.layout
                }
            }" />
</template>