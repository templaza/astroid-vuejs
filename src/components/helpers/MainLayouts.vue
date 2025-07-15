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

onBeforeMount(() => {
    if (props.modelValue !== '') {
        if (isJsonString(props.modelValue) && layout.value !== props.modelValue) {
            layout.value = props.modelValue;
            default_layout.value = props.modelValue;
            resetFormInfo(true);
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
        if (layouts.value[selected_layout.value].status === 'first_load') {
            layouts.value[selected_layout.value].status = 'loaded';
        } else {
            layouts.value[selected_layout.value].status = 'updated';
            emit('update:layoutSaved', false);
        }
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
            formInfo.name = filename;
            if (filename === props.modelValue) {
                default_layout.value = layouts.value[filename].data;
                formInfo.default = true;
            } else {
                formInfo.default = false;
            }
            selected_layout.value = filename;
            return true;
        }
        let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=getlayout&ts="+Date.now();
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
                    if (filename === props.modelValue) {
                        default_layout.value = response.data.data.data;
                        formInfo.default = true;
                    } else {
                        formInfo.default = false;
                    }
                }
            })
            .catch((err) => {
                console.error(err);
            });
    } else {
        reloadLayout.value = true;
        resetValues();
        selected_layout.value = '';
    }
}

const reloadLayout = ref(false);
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
    let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=savelayout&ts="+Date.now();
    const formData = new FormData(); // pass data as a form
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
                layouts.value[response.data.data] = {
                    title: formInfo.title,
                    desc: formInfo.desc,
                    thumbnail: formInfo.thumbnail,
                    data: layout.value,
                    status: 'saved'
                };
                emit('update:layoutSaved', true);
                selected_layout.value = response.data.data;
                if (formInfo.default) {
                    emit('update:modelValue', response.data.data);
                    default_layout.value = layout.value;
                }
                Object.keys(layouts.value).forEach(key => {
                    if (key !== response.data.data && layouts.value[key].status === 'updated') {
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
    formInfo.default = isDefault;
    files.value = null;
}

function resetValues() {
    layout.value = default_layout.value;
    resetFormInfo();
}

function cancelLayout() {
    editLayout(props.modelValue);
}

function deleteLayout() {
    if (confirm(language.JGLOBAL_CONFIRM_DELETE) && checklist.value.length) {
        let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=deletelayouts&ts="+Date.now();
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
function callAjax() {
    let url = constant.site_url+"administrator/index.php?option=com_ajax&astroid=getlayouts&type=main_layouts&template="+constant.tpl_template_name+"&ts="+Date.now();
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
                        editLayout(response.data.data[0].name);
                    } else {
                        if (!isJsonString(props.modelValue) && selected_layout.value === '') {
                            const found = response.data.data.find(item => item.name === props.modelValue);
                            setTimeout(
                                () => {
                                    if (!found) {
                                        emit('update:modelValue', response.data.data[0].name);
                                        selected_layout.value = response.data.data[0].name;
                                        editLayout(response.data.data[0].name);
                                    } else {
                                        selected_layout.value = props.modelValue;
                                        editLayout(props.modelValue);
                                    }
                                }, 500
                            )
                        }
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
</script>
<template>
    <div>
        <div class="astroid-layout px-2">
            <h6>Layouts:</h6>
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
                            <button v-if="item.name !== props.modelValue" type="button" class="btn btn-sm" :class="{'btn-as-outline-primary': item.name === selected_layout, 'btn-as-light': item.name !== selected_layout}" @click.prevent="markAsDefault(item.name)" v-html="`<i class='fa-solid fa-star fa-xs text-body-tertiary'></i>`"></button>
                            <button v-if="item.name !== props.modelValue" type="button" class="btn btn-sm" :class="{'btn-as-outline-primary': item.name === selected_layout, 'btn-as-light': item.name !== selected_layout}" @click.prevent="checklist = [item.name]; deleteLayout()" v-html="`<i class='fa-solid fa-times'></i>`"></button>
                        </div>
                    </div>
                    <div>
                        <button v-if="items.length === 0 || isJsonString(props.modelValue)" type="button" class="btn btn-sm btn-as btn-as-primary" @click.prevent="saveLayout('save')" v-html="`<i class='fa-solid fa-floppy-disk me-2'></i>Save as Default`"></button>
                        <button v-else type="button" class="btn btn-sm btn-as btn-as-primary" @click.prevent="editLayout()" v-html="`<i class='fa-solid fa-plus me-2'></i>` + language.TPL_ASTROID_NEW_LAYOUT"></button>
                    </div>
                </div>
            </div>
            <Layout v-model="layout" source="root" :presetUpdated="reloadLayout" :colorMode="props.colorMode" @update:Preset="state => (reloadLayout = state)" @update:subLayouts="emit('update:subLayouts')" :field="{
                id: props.field.id,
                input: {
                    id: props.field.input.id,
                    name: props.field.input.name,
                    value: JSON.parse(layout)
                }
            }" />
            <div class="modal fade" :id="props.field.input.id+`_saveLayout`" tabindex="-1" :aria-labelledby="props.field.input.id+`saveLayoutLabel`" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title fs-5" :id="props.field.input.id+`_saveLayoutLabel`">{{ language.TPL_ASTROID_LAYOUT_INFO }}</h3>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" :id="props.field.input.id+`_saveLayout_close`"></button>
                        </div>
                        <div class="modal-body">
                            <div>
                                <div class="mb-3">
                                    <label :for="props.field.input.id+`_saveLayout_title`" class="form-label">{{ language.JGLOBAL_TITLE }}</label>
                                    <input type="text" v-model="formInfo.title" class="form-control" :id="props.field.input.id+`_saveLayout_title`" ref="_formTitle" placeholder="Title" required>
                                </div>
                                <div class="mb-3">
                                    <label :for="props.field.input.id+`_saveLayout_desc`" class="form-label">{{ language.JGLOBAL_DESCRIPTION }}</label>
                                    <textarea class="form-control" v-model="formInfo.desc" :id="props.field.input.id+`_saveLayout_desc`" rows="3"></textarea>
                                </div>
                                <div v-if="formInfo.thumbnail !== ``" class="mb-3">
                                    <img class="img-thumbnail" :src="constant.site_url + `/media/templates/site/` + constant.tpl_template_name + `/images/layouts/` + formInfo.thumbnail" :alt="formInfo.title">
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
                <a v-if="formInfo.name === ``" href="#" @click.prevent="cancelLayout()" class="btn btn-sm btn-as btn-as-light" :disabled="save_disabled">{{ language.JCANCEL }}</a>
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