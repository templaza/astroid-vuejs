<script setup>
import {computed} from "vue";
const props = defineProps(['field', 'promotion']);
const item = computed(() => {
    return props.promotion?.status === 'success'
        ? props.promotion.data?.[0]
        : null;
});

const title = computed(() => {
    return item.value ? item.value.title : props.field.input.title;
});

const desc = computed(() => {
    if (!item.value) {
        return props.field.input.desc;
    }

    const {description, link, link_title} = item.value;
    return '<p>' + description + '</p><a href="' + link + '" target="_blank" class="btn btn-sm btn-as btn-danger">' + link_title + '</a>';
});
</script>
<template>
    <h6 class="card-title">{{ title }}</h6>
    <div class="card-text form-text" v-html="desc"></div>
</template>