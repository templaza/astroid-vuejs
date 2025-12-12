<script setup>
import axios from "axios";
import {ref, reactive, inject, onUpdated, watch, onBeforeMount} from "vue";
import Layout from "./Layout.vue";
const emit = defineEmits(['update:modelValue', 'update:Preset', 'update:layoutSaved', 'update:subLayouts']);
const props = defineProps({
    modelValue: { type: String, default: '' },
    field: { type: Object, default: null },
    colorMode: { type: Number, default: 0 },
    presetUpdated: { type: Boolean, default: false }
});
const constant  =   inject('constant', {});
const language  =   inject('language', []);
const items     =   ref([]);
const layout    =   ref('{"sections":[]}');
const layouts   =   ref({});
const default_layout = ref('{"sections":[]}');
const selected_layout = ref('');
const formInfo = reactive({
    title: '',
    desc: '',
    thumbnail: '',
    name: '',
    layout: 'custom',
    default: false
});
const toast_msg = reactive({
    header: '',
    body:'',
    icon: '',
    color:'darkviolet'
});
const save_disabled = ref(false);
const files = ref(null);
const checklist = ref([]);
const ajaxloading = ref(false);

onBeforeMount(() => {
    if (props.modelValue !== '') {
        if (isJsonString(props.modelValue) && layout.value !== props.modelValue) {
            layout.value = props.modelValue;
            default_layout.value = props.modelValue;
            resetFormInfo(true);
            editItem.value = true;
        }
    } else {
        layout.value = props.field.input.value;
        default_layout.value = props.field.input.value;
        resetFormInfo(true);
    }
    callAjax();
})

onUpdated(()=>{
    if (props.presetUpdated === true) {
        emit('update:Preset', false);
        if (props.modelValue !== '') {
            if (isJsonString(props.modelValue)) {
                reloadLayout.value = true;
                layout.value = props.modelValue;
                default_layout.value = props.modelValue;
                selected_layout.value = '';
                resetFormInfo(true);
            } else {
                const found = items.value.find(item => item.name === props.modelValue);
                if (found) {
                    editLayout(found.name);
                } else {
                    reloadLayout.value = true;
                    layout.value = props.field.input.value;
                    default_layout.value = props.field.input.value;
                    selected_layout.value = '';
                    resetFormInfo(true);
                }
            }
        } else {
            reloadLayout.value = true;
            layout.value = props.field.input.value;
            default_layout.value = props.field.input.value;
            selected_layout.value = '';
            resetFormInfo(true);
        }
    }
})

watch(layout, (newText) => {
    if (newText !== props.modelValue && isJsonString(props.modelValue)) {
        emit('update:modelValue', newText);
    }
    if (selected_layout.value !== '' && newText !== layouts.value[selected_layout.value].data) {
        layouts.value[selected_layout.value].data = newText;
        // if (layouts.value[selected_layout.value].status === 'first_load') {
        //     layouts.value[selected_layout.value].status = 'loaded';
        // } else {
        //     layouts.value[selected_layout.value].status = 'updated';
        //     emit('update:layoutSaved', false);
        // }
        layouts.value[selected_layout.value].status = 'updated';
        emit('update:layoutSaved', false);
    }
})

function editLayout(filename = '') {
    if (filename !== '') {
        if (isJsonString(props.modelValue)) {
            alert('You have to save your current layout as Default before switching to another layout.');
            return true;
        }
        if (selected_layout.value === '') {
            if (!confirm('You do not save your current layout. Do you want to switch to '+filename+'?')) {
                return true;
            }
        }
        if (typeof layouts.value[filename] !== 'undefined' && isJsonString(layouts.value[filename].data)) {
            reloadLayout.value = true;
            layout.value = layouts.value[filename].data;
            formInfo.title = layouts.value[filename].title;
            formInfo.desc = layouts.value[filename].desc;
            formInfo.thumbnail = layouts.value[filename].thumbnail;
            if (constant.cms_name === 'moodle') {
                formInfo.layout = layouts.value[filename].layout ?? 'custom';
            }
            formInfo.name = filename;
            if (filename === props.modelValue) {
                default_layout.value = layouts.value[filename].data;
                formInfo.default = true;
            } else {
                formInfo.default = false;
            }
            selected_layout.value = filename;
            editItem.value = true;
            return true;
        }
        ajaxloading.value = true;
        let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=getlayout&ts="+Date.now();
        if (constant.cms_name === 'moodle') {
            url = constant.site_url+`/local/moon/ajax/action.php?theme=${constant.template_name}&task=getlayout&filearea=main_layouts&itemid=0&sesskey=${constant.astroid_admin_token}`;
        }
        if (process.env.NODE_ENV === 'development') {
            url = "editlayout_ajax.txt?ts="+Date.now();
        }
        const formData = new FormData(); // pass data as a form
        formData.append(constant.astroid_admin_token, 1);
        formData.append('name', filename);
        formData.append('template', constant.tpl_template_name);
        formData.append('type', 'main_layouts');
        axios.post(url, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
            .then((response) => {
                if (response.data.status === 'success') {
                    reloadLayout.value = true;
                    layout.value = response.data.data.data;
                    formInfo.title = response.data.data.title;
                    formInfo.desc = response.data.data.desc;
                    formInfo.thumbnail = response.data.data.thumbnail;
                    formInfo.name = filename;
                    selected_layout.value = filename;
                    layouts.value[filename] = {
                        title: response.data.data.title,
                        desc: response.data.data.desc,
                        thumbnail: response.data.data.thumbnail,
                        data: response.data.data.data,
                        status: 'first_load'
                    };
                    if (constant.cms_name === 'moodle') {
                        formInfo.layout = response.data.data.layout;
                        layouts.value[filename].layout = response.data.data.layout;
                    }
                    if (filename === props.modelValue) {
                        default_layout.value = response.data.data.data;
                        formInfo.default = true;
                    } else {
                        formInfo.default = false;
                    }
                    ajaxloading.value = false;
                    editItem.value = true;
                }
            })
            .catch((err) => {
                console.error(err);
            });
    } else {
        reloadLayout.value = true;
        resetValues();
        selected_layout.value = '';
        editItem.value = true;
    }
}

const reloadLayout = ref(false);
const editItem = ref(false);
function loadDefault() {
    if (!confirm('Are you sure? This will reset your current layout.')) {
        return true;
    }
    reloadLayout.value = true;
    layout.value = default_layout.value;
}

function onFileChange(e) {
    files.value = e.target.files || e.dataTransfer.files;
}

function saveLayout(action = 'save') {
    if (formInfo.title === '') {
        if (action === 'save_dialog') {
            alert('You have to input the Title')
            _formTitle.value.focus();
        } else {
            document.getElementById(props.field.input.id+`_saveLayout_opendialog`).click();
        }
        return true;
    }
    const formData = new FormData(); // pass data as a form
    let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=savelayout&ts="+Date.now();
    if (constant.cms_name === 'moodle') {
        url = constant.site_url+`/local/moon/ajax/action.php?theme=${constant.template_name}&task=savelayout&filearea=main_layouts&itemid=0&sesskey=${constant.astroid_admin_token}`;
        formData.append('layout', formInfo.layout);
    }
    const toastAstroidMsg = document.getElementById(props.field.input.id+`_saveLayoutToast`);
    const toastBootstrap = Toast.getOrCreateInstance(toastAstroidMsg);
    formData.append(constant.astroid_admin_token, 1);
    formData.append('title', formInfo.title);
    formData.append('desc', formInfo.desc);
    formData.append('data', layout.value);
    formData.append('thumbnail_old', formInfo.thumbnail);

    if (files.value !== null && files.value.length) {
        formData.append('thumbnail', files.value[0]);
    }
    if (formInfo.name !== ``) {
        formData.append('name', formInfo.name);
    }
    formData.append('template', constant.tpl_template_name);
    formData.append('type', 'main_layouts');
    save_disabled.value = true;

    axios.post(url, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
        .then((response) => {
            if (response.data.status === 'success') {
                toast_msg.icon = 'fa-solid fa-rocket';
                toast_msg.header = 'Layout '+formInfo.title+' is saved.';
                toast_msg.body = 'You can use it to display your website.';
                toast_msg.color = 'green';
                save_disabled.value = false;
                layouts.value[response.data.data.name] = {
                    title: response.data.data.title,
                    desc: response.data.data.desc,
                    thumbnail: response.data.data.thumbnail,
                    layout: formInfo.layout,
                    data: layout.value,
                    status: 'saved'
                };
                formInfo.name = response.data.data.name;
                if (response.data.data.thumbnail !== '') {
                    formInfo.thumbnail = response.data.data.thumbnail;
                }
                emit('update:layoutSaved', true);
                selected_layout.value = response.data.data.name;
                if (formInfo.default) {
                    emit('update:modelValue', response.data.data.name);
                    default_layout.value = layout.value;
                }
                Object.keys(layouts.value).forEach(key => {
                    if (key !== response.data.data.name && layouts.value[key].status === 'updated') {
                        emit('update:layoutSaved', false);
                    }
                });
                callAjax();
                if (action !== 'apply') {
                    document.getElementById(props.field.input.id+`_saveLayout_close`).click();
                }
            } else {
                toast_msg.icon = 'fa-regular fa-face-sad-tear';
                toast_msg.header = 'Layout '+formInfo.title+' is not saved.';
                toast_msg.body = response.data.message;
                toast_msg.color = 'red';
            }
            toastBootstrap.show();
        })
        .catch((err) => {
            console.error(err);
        });
}

function resetFormInfo(isDefault = false) {
    formInfo.title = '';
    formInfo.desc = '';
    formInfo.thumbnail = '';
    formInfo.name = '';
    formInfo.layout = 'custom';
    formInfo.default = isDefault;
    files.value = null;
}

function resetValues() {
    selected_layout.value = '';
    layout.value = default_layout.value;
    resetFormInfo();
}
function deleteLayout(item = null) {
    if (item !== null) {
        checklist.value = [item.name];
    }
    if (confirm(language.JGLOBAL_CONFIRM_DELETE) && checklist.value.length) {
        let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=deletelayouts&ts="+Date.now();
        if (constant.cms_name === 'moodle') {
            url = constant.site_url+`/local/moon/ajax/action.php?theme=${constant.template_name}&task=deletelayouts&filearea=main_layouts&itemid=0&sesskey=${constant.astroid_admin_token}`;
        }
        const formData = new FormData(); // pass data as a form
        const toastAstroidMsg = document.getElementById(props.field.input.id+`_saveLayoutToast`);
        const toastBootstrap = Toast.getOrCreateInstance(toastAstroidMsg);
        formData.append(constant.astroid_admin_token, 1);
        checklist.value.forEach(element => {
            formData.append('layouts[]', element);
        });
        formData.append('template', constant.tpl_template_name);
        formData.append('type', 'main_layouts');
        axios.post(url, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
            .then((response) => {
                if (response.data.status === 'success') {
                    if (response.data.data) {
                        toast_msg.icon = 'fa-solid fa-rocket';
                        toast_msg.header = 'Layouts deleted.';
                        toast_msg.body = 'You cannot undo this process.';
                        toast_msg.color = 'green';
                    } else {
                        toast_msg.icon = 'fa-regular fa-face-sad-tear';
                        toast_msg.header = 'Error!';
                        toast_msg.body = 'Layouts are not deleted.';
                        toast_msg.color = 'red';
                    }
                    callAjax();
                    toastBootstrap.show();
                } else {
                    toast_msg.icon = 'fa-regular fa-face-sad-tear';
                    toast_msg.header = 'Error!';
                    toast_msg.body = response.data.message;
                    toast_msg.color = 'red';
                    toastBootstrap.show();
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }
}
function isJsonString(str) {
    return /^\s*(\{.*\}|\[.*\])\s*$/.test(str);
}
const selectedLayouts = ref([]);
function callAjax() {
    let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=getlayouts&type=main_layouts&template="+constant.tpl_template_name+"&ts="+Date.now();
    if (constant.cms_name === 'moodle') {
        url = constant.site_url+`/local/moon/ajax/action.php?theme=${constant.template_name}&task=getlayouts&filearea=main_layouts&itemid=0&sesskey=${constant.astroid_admin_token}`;
    }
    if (process.env.NODE_ENV === 'development') {
        url = "layout_ajax.txt?ts="+Date.now();
    }

    axios.get(url)
        .then(function (response) {
            if (response.data.status === 'success') {
                items.value = response.data.data;
                if (response.data.data.length > 0) {
                    if (props.modelValue === '') {
                        emit('update:modelValue', response.data.data[0].name);
                        // editLayout(response.data.data[0].name);
                    } else {
                        if (!isJsonString(props.modelValue) && selected_layout.value === '') {
                            const found = response.data.data.find(item => item.name === props.modelValue);
                            setTimeout(
                                () => {
                                    if (!found) {
                                        emit('update:modelValue', response.data.data[0].name);
                                        selected_layout.value = response.data.data[0].name;
                                        // editLayout(response.data.data[0].name);
                                    } else {
                                        selected_layout.value = props.modelValue;
                                        // editLayout(props.modelValue);
                                    }
                                }, 500
                            )
                        }
                    }
                    if (constant.cms_name === 'moodle') {
                        response.data.data.forEach(item => {
                            if (typeof item.layout !== 'undefined' && item.layout !== 'custom') {
                                selectedLayouts.value.push(item.layout);
                            }
                        });
                    }
                }
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        });
}
const _formTitle = ref(null);
function markAsDefault(name = '') {
    if (name !== '') {
        emit('update:modelValue', name);
    } else if (formInfo.name !== props.modelValue) {
        emit('update:modelValue', formInfo.name);
        formInfo.default = true;
    }
}

function importLayout() {
    if (files.value === null || files.value.length === 0) {
        alert('You have to select a JSON file to import.');
        return true;
    }
    const file = files.value[0];
    if (file.type !== 'application/json') {
        alert('You have to select a valid JSON file to import.');
        return true;
    }
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const data = JSON.parse(event.target.result);
            reloadLayout.value = true;
            layout.value = JSON.stringify(data.data);
            formInfo.title = data.title || '';
            formInfo.desc = data.desc || '';
            formInfo.thumbnail = data.thumbnail || '';
            files.value = null;
            document.getElementById(props.field.input.id+`_importLayout_file`).value = '';
            document.getElementById(props.field.input.id+`_importLayout_close`).click();
        } catch (e) {
            alert('Invalid JSON file format.');
        }
    };
    reader.readAsText(file);
}
function cancelLayout() {
    editItem.value = false;
    resetValues();
    callAjax();
}
function exportLayout() {
    const dataStr = JSON.stringify({
        title: formInfo.title,
        desc: formInfo.desc,
        thumbnail: '',
        data: JSON.parse(layout.value)
    }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (formInfo.name || 'layout') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
}

function typeChange() {
    if (formInfo.layout !== 'custom') {
        formInfo.title = constant.layouts[formInfo.layout];
    }
}

const checkAll = ref(false);
function checkAllList() {
    checklist.value = [];
    if (!checkAll.value) {
        items.value.forEach(element => {
            checklist.value.push(element.name);
        });
    }
}
function isSystemLayout(name) {
    return Object.prototype.hasOwnProperty.call(constant.layouts, name);
}
</script>
<template>
    <div>
        <div class="astroid-layout" v-if="editItem === false">
            <div v-if="items.length === 0">
                <div class="alert alert-info" role="alert">{{ language.TPL_ASTROID_NO_LAYOUT_INFO }}</div>
            </div>
            <table v-else class="table table-hover">
                <thead>
                <tr>
                    <th scope="col" width="1%"><input class="form-check-input" type="checkbox" value="" v-model="checkAll" @click="checkAllList"></th>
                    <th scope="col">{{ language.JGLOBAL_TITLE }}</th>
                    <th scope="col">{{ language.JGLOBAL_DESCRIPTION }}</th>
                    <th scope="col">{{ language.JDEFAULT }}</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(item, index) in items" class="astroid-element">
                    <td scope="row"><input class="form-check-input" type="checkbox" :value="item.name" v-model="checklist"></td>
                    <td class="d-flex">
                        <a href="#" :title="`Edit: ` + item.title" class="link-body-emphasis link-offset-2 link-underline-opacity-0 link-underline-opacity-75-hover" @click.prevent="editLayout(item.name)" v-html="(typeof layouts[item.name] !== 'undefined' && layouts[item.name].status === `updated` ? item.title + '<span class=\'badge text-bg-warning ms-2\'>'+language.ASTROID_DRAFT+'</span>' : item.title)"></a>
                        <div class="element-toolbar d-flex align-items-center">
                            <ul class="nav">
                                <li class="nav-item">
                                    <a class="nav-link py-0 ps-3 pe-1" href="#" title="Edit Element" @click.prevent="editLayout(item.name)"><i class="fas fa-edit"></i></a>
                                </li>
                                <li v-if="constant.cms_name === `moodle`" class="nav-item">
                                    <a class="nav-link py-0 px-1" :href="constant.root_url + `local/moon/page.php?id=` + item.name" title="Page url" target="_blank"><i class="fas fa-link"></i></a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link py-0 pe-0 ps-1" href="#" @click.prevent="deleteLayout(item)" title="Remove Element"><i class="fas fa-trash-alt"></i></a>
                                </li>
                            </ul>
                        </div>
                    </td>
                    <td>{{ item.desc }}</td>
                    <td><a v-if="isSystemLayout(item.name)" :class="{'link-secondary':item.name !== props.modelValue, 'link-warning':item.name === props.modelValue}" href="#" @click.prevent="markAsDefault(item.name)"><i class="fa-solid fa-star"></i></a></td>
                </tr>
                </tbody>
            </table>
            <div class="as-sublayout-bottom-toolbox sticky-bottom bg-body-tertiary px-4 py-3 border border-bottom-0 rounded-top-3 mt-5">
                <a href="#" @click.prevent="editLayout()" class="btn btn-sm btn-as btn-as-primary me-2">{{ language.TPL_ASTROID_NEW_LAYOUT }}</a>
                <a href="#" @click.prevent="deleteLayout()" class="btn btn-sm btn-as btn-outline-danger">{{ language.TPL_ASTROID_DELETE_LAYOUT }}</a>
            </div>
        </div>
        <div v-else class="astroid-layout px-2">
            <h6>Layouts:<a v-if="props.field.help !== ``" class="link-secondary" :href="props.field.help" title="Help" target="_blank"><i class="fa-solid fa-circle-question fa-sm ms-1"></i></a></h6>
            <div class="layout-toolbar card card-body">
                <div class="row row-cols-auto g-2">
                    <div v-for="item in items">
                        <div class="btn-group position-relative">
                            <button type="button" class="btn btn-sm btn-as" :class="{'btn-as-outline-primary': item.name === selected_layout, 'btn-as-light': item.name !== selected_layout}" @click.prevent="editLayout(item.name)"
                                    v-html="(item.name === props.modelValue ? '<i class=\'fa-solid fa-star me-2 text-warning\'></i>' + item.title : item.title)
                                    + (typeof layouts[item.name] !== `undefined` && layouts[item.name].status !== `loaded` && layouts[item.name].status !== `first_load` ?
                                        (layouts[item.name].status === `updated` ?
                                            `<span class='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-warning z-1 p-1 blink'><span class='visually-hidden'>unsaved layout</span></span>`
                                            : `<span class='position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-success z-1 p-1'><span class='visually-hidden'>saved layout</span></span>`)
                                        : ``)"></button>
                            <button v-if="item.name !== props.modelValue" type="button" class="btn btn-sm" :class="{'btn-as-outline-primary': item.name === selected_layout, 'btn-as-light': item.name !== selected_layout}" @click.prevent="markAsDefault(item.name)" v-html="`<i class='fa-solid fa-star fa-xs'></i>`"></button>
                            <button v-if="item.name !== props.modelValue" type="button" class="btn btn-sm" :class="{'btn-as-outline-primary': item.name === selected_layout, 'btn-as-light': item.name !== selected_layout}" @click.prevent="deleteLayout(item)" v-html="`<i class='fa-solid fa-times'></i>`"></button>
                        </div>
                    </div>
                    <div>
                        <button v-if="items.length === 0 || isJsonString(props.modelValue)" type="button" class="btn btn-sm btn-as btn-as-primary" @click.prevent="saveLayout('save')" v-html="`<i class='fa-solid fa-floppy-disk me-2'></i>Save as Default`"></button>
                        <button v-else type="button" class="btn btn-sm btn-as btn-as-primary" @click.prevent="editLayout()" v-html="`<i class='fa-solid fa-plus me-2'></i>` + language.TPL_ASTROID_NEW_LAYOUT"></button>
                    </div>
                </div>
            </div>
            <div class="position-relative">
                <Layout v-model="layout" source="root" :presetUpdated="reloadLayout" :colorMode="props.colorMode" :layoutType="formInfo.layout" @update:Preset="state => (reloadLayout = state)" @update:subLayouts="emit('update:subLayouts')" :field="{
                id: props.field.id,
                input: {
                    id: props.field.input.id,
                    name: props.field.input.name,
                    value: JSON.parse(layout)
                }
            }" />
                <div v-if="ajaxloading" class="loading-frame position-absolute top-0 start-0 bottom-0 end-0 bg-body d-flex justify-content-center align-items-center flex-column" style="--bs-bg-opacity: .8;">
                    <i class="fa-solid fa-basketball fa-bounce fa-3x" style="--fa-bounce-land-scale-x: 1.2;--fa-bounce-land-scale-y: .8;--fa-bounce-rebound: 5px;"></i>
                    <div class="fa-beat-fade mt-3" style="--fa-beat-fade-opacity: 0.1; --fa-beat-fade-scale: 1.05;">Loading...</div>
                </div>
            </div>
            <div class="modal fade" :id="props.field.input.id+`_saveLayout`" tabindex="-1" :aria-labelledby="props.field.input.id+`saveLayoutLabel`" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title fs-5" :id="props.field.input.id+`_saveLayoutLabel`">{{ language.TPL_ASTROID_LAYOUT_INFO }}</h3>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :id="props.field.input.id+`_saveLayout_close`"></button>
                        </div>
                        <div class="modal-body">
                            <div>
                                <div v-if="constant.cms_name === `moodle`" class="mb-3">
                                    <label :for="props.field.input.id+`_saveLayout_type`" class="form-label">{{ language.type }}</label>
                                    <select class="form-select" v-model="formInfo.layout" @change="typeChange()" :id="props.field.input.id+`_saveLayout_type`">
                                        <option v-for="(text, value) in constant.layouts" :value="value" :disabled="selectedLayouts.includes(value) && (selected_layout === `` || (typeof layouts[selected_layout] !== `undefined` && typeof layouts[selected_layout].layout !== `undefined` && layouts[selected_layout].layout !== value))">{{text}}</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label :for="props.field.input.id+`_saveLayout_title`" class="form-label">{{ language.JGLOBAL_TITLE }}</label>
                                    <input type="text" v-model="formInfo.title" class="form-control" :id="props.field.input.id+`_saveLayout_title`" ref="_formTitle" placeholder="Title" :disabled="constant.cms_name === `moodle` && formInfo.layout !== `custom`" required>
                                </div>
                                <div class="mb-3">
                                    <label :for="props.field.input.id+`_saveLayout_desc`" class="form-label">{{ language.JGLOBAL_DESCRIPTION }}</label>
                                    <textarea class="form-control" v-model="formInfo.desc" :id="props.field.input.id+`_saveLayout_desc`" rows="3"></textarea>
                                </div>
                                <div v-if="formInfo.thumbnail !== ``" class="mb-3">
                                    <img class="img-thumbnail" :src="(constant.cms_name === `moodle` ? formInfo.thumbnail : constant.site_url + `media/templates/site/` + constant.tpl_template_name + `/images/main_layouts/` + formInfo.thumbnail)" :alt="formInfo.title">
                                </div>
                                <div class="mb-3">
                                    <label :for="props.field.input.id+`_saveLayout_thumbnail`" class="form-label">{{ language.TPL_ASTROID_SELECT_YOUR_THUMBNAIL }}</label>
                                    <input class="form-control" type="file" @change="onFileChange" :id="props.field.input.id+`_saveLayout_thumbnail`">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button v-if="formInfo.name !== `` && !formInfo.default" type="button" class="btn btn-sm btn-as btn-primary btn-as-primary" data-bs-dismiss="modal" aria-label="Close" :disabled="save_disabled" v-html="language.JAPPLY"></button>
                            <button v-if="formInfo.name === `` || formInfo.default" type="button" class="btn btn-sm btn-as btn-as-light" data-bs-dismiss="modal" aria-label="Close" :disabled="save_disabled">{{ language.ASTROID_BACK }}</button>
                            <button v-if="formInfo.name === `` || formInfo.default" type="button" class="btn btn-sm btn-as btn-primary btn-as-primary" @click.prevent="saveLayout('save_dialog')" :disabled="save_disabled" v-html="language.JSAVE"></button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="!isJsonString(props.modelValue)" class="as-sublayout-bottom-toolbox sticky-bottom bg-body-tertiary px-4 py-3 border border-bottom-0 rounded-top-3 mt-5">
                <a href="#" @click.prevent="saveLayout(formInfo.name !== `` ? 'apply' : 'new')" class="btn btn-sm btn-as btn-as-primary me-2" :disabled="save_disabled" v-html="`<i class='fa-solid fa-floppy-disk me-2'></i>`+language.JAPPLY"></a>
                <a v-if="formInfo.name !== `` && formInfo.name !== props.modelValue" href="#" class="btn btn-sm btn-as btn-as-light me-2" @click.prevent="markAsDefault()" :disabled="save_disabled">Mark as Default</a>
                <a v-if="formInfo.name !== ``" href="#" @click.prevent="" data-bs-toggle="modal" :data-bs-target="`#`+props.field.input.id+`_saveLayout`" class="btn btn-sm btn-as btn-as-light me-2" :disabled="save_disabled">{{ language.TPL_ASTROID_EDIT_INFO }}</a>
                <a v-if="formInfo.name !== props.modelValue" href="#" @click.prevent="loadDefault()" class="btn btn-sm btn-as btn-as-light me-2" :disabled="save_disabled">{{ language.TPL_ASTROID_LOAD_DEFAULT_SETTINGS }}</a>
                <div v-if="formInfo.name !== ``" class="btn-group me-2" role="group" aria-label="Import / Export">
                    <button type="button" data-bs-toggle="modal" :data-bs-target="`#`+props.field.input.id+`_importLayout`" class="btn btn-sm btn-as btn-as-light" :disabled="save_disabled"><i class="fa-solid fa-file-import me-2"></i>Import</button>
                    <button type="button" @click.prevent="exportLayout()" class="btn btn-sm btn-as btn-as-light" :disabled="save_disabled"><i class="fa-solid fa-file-export me-2"></i>Export</button>
                </div>
                <a href="#" @click.prevent="cancelLayout()" class="btn btn-sm btn-as btn-as-light" :disabled="save_disabled">{{ language.ASTROID_TEMPLATE_CLOSE }}</a>
            </div>
            <div class="modal fade" :id="props.field.input.id+`_importLayout`" tabindex="-1" :aria-labelledby="props.field.input.id+`importLayoutLabel`" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title fs-5" :id="props.field.input.id+`_importLayoutLabel`">Import</h3>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :id="props.field.input.id+`_importLayout_close`"></button>
                        </div>
                        <div class="modal-body">
                            <div>
                                <div class="mb-3">
                                    <label :for="props.field.input.id+`_importLayout_file`" class="form-label">Click to select JSON file</label>
                                    <input class="form-control" type="file" @change="onFileChange" :id="props.field.input.id+`_importLayout_file`">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button v-if="formInfo.name !== ``" type="button" class="btn btn-sm btn-as btn-as-light" data-bs-dismiss="modal" aria-label="Close" :disabled="save_disabled">{{ language.ASTROID_BACK }}</button>
                            <button v-if="formInfo.name !== ``" type="button" class="btn btn-sm btn-as btn-primary btn-as-primary" @click.prevent="importLayout('save_dialog')" :disabled="save_disabled" v-html="language.JSAVE"></button>
                        </div>
                    </div>
                </div>
            </div>
            <button :id="props.field.input.id+`_saveLayout_opendialog`" class="d-none" type="button" data-bs-toggle="modal" :data-bs-target="`#`+props.field.input.id+`_saveLayout`">Open Dialog</button>
        </div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div :id="props.field.input.id+`_saveLayoutToast`" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="me-2" :class="toast_msg.icon" :style="{color: toast_msg.color}"></i>
                    <strong class="me-auto">{{ toast_msg.header }}</strong>
                    <small>1 second ago</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" v-html="toast_msg.body"></div>
            </div>
        </div>
    </div>
</template>