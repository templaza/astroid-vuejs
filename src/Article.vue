<script setup>
import { onBeforeMount, ref, provide } from 'vue';
import axios from "axios";
import './assets/base.scss'
import Modal from "./components/helpers/Modal.vue";
const props = defineProps(['widget_json_id']);
const data = JSON.parse(document.getElementById(props.widget_json_id+'_json').innerHTML);
provide('constant', data.constant);
provide('language', data.language);
const sections = ref();
const save_disabled = ref(false);
onBeforeMount(()=>{
    sections.value = data.widgets;
})

const _showModal = ref(false);
const element = ref({});

function editElement(el) {
    element.value = el;
    _showModal.value = true;
}
function closeElement() {
    _showModal.value = false;
}
function saveElement(params) {
    const action_link = 'index.php?option=com_ajax&astroid=saveArticleElement&ts='+Date.now();
    const formData = new FormData();
    element.value.params = params;
    formData.append(data.constant.astroid_admin_token, 1);
    formData.append('article_id', data.article_id);
    formData.append('template', data.template);
    formData.append('data', JSON.stringify(element.value));
    save_disabled.value = true;
    axios.post(action_link, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    }).then((response) => {
        if (response.data.status === 'success') {
            save_disabled.value = false;
        }
    }).catch((err) => {
        console.error(err);
    });
    element.value = {};
}

function elementState(widget) {
    if (typeof widget.state === 'undefined') {
        widget.state = 0;
    } else {
        widget.state = Math.abs(widget.state - 1);
    }
    const action_link = 'index.php?option=com_ajax&astroid=saveArticleElement&ts='+Date.now();
    const formData = new FormData();
    formData.append(data.constant.astroid_admin_token, 1);
    formData.append('article_id', data.article_id);
    formData.append('template', data.template);
    formData.append('data', JSON.stringify(widget));
    save_disabled.value = true;
    axios.post(action_link, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    }).then((response) => {
        if (response.data.status === 'success') {
            save_disabled.value = false;
        }
    }).catch((err) => {
        console.error(err);
    });
}
</script>
<template>
    <div v-for="section in sections" class="mb-4">
        <h3>{{ section.title }}</h3>
        <div class="article-layout-data row row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row-cols-sm-1 row-cols-2 g-4">
            <div v-for="widget in section.widgets">
                <div class="article-widget card card-body border" :class="{'element-disabled' : !widget.state}">
                    <div class="d-flex justify-content-between">
                        <div class="widget-name">
                            <div class="title"><i class="text-body-tertiary me-2" :class="data.constant.form_template[widget.type].info.icon"></i>{{ widget.params.find((param) => param.name === 'title').value }}</div>
                            <div class="text-body-tertiary form-text">{{ widget.type }}</div>
                        </div>
                        <div class="widget-toolbar">
                            <ul v-if="!save_disabled" class="nav flex-column justify-content-end text-end">
                                <li class="nav-item">
                                    <a class="nav-link py-0 px-1" href="#" @click.prevent="editElement(widget)"><i class="fas fa-pencil-alt me-1"></i>Edit</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link py-0 px-1" href="#" title="Enable/Disable Element" @click.prevent="elementState(widget)"><i class="me-1" :class="{'fas fa-eye' : widget.state, 'fas fa-eye-slash' : !widget.state}"></i>{{ (widget.state ? 'Enabled' : 'Disabled') }}</a>
                                </li>
                            </ul>
                            <i v-else class="fa-solid fa-spinner fa-spin-pulse"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <Transition name="fade">
        <Modal v-if="_showModal" :element="element" :form="data.constant.form_template[element.type]" :colorMode="1" @update:saveElement="saveElement" @update:close-element="closeElement" />
    </Transition>
</template>