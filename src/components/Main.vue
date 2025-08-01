<script setup>
import {onBeforeMount, ref, reactive, inject, onUpdated} from 'vue';
import axios from "axios";
import Fields from './helpers/Fields.vue'
const emit = defineEmits(['update:statusSave', 'update:saveFinish', 'update:switchPage']);
const props = defineProps({
  config: { type: Object, default: null },
  pageIndex: { type: Object, default: null },
  fieldSet_tabs: { type: Object, default: null},
    saveState: { type: Boolean, default: false }
});

const $scope = ref(new Object());
const astroidcontentlayouts = ref(new Object());
const constant  =   inject('constant', {});
let action_link = '';
const updatePreset = ref(new Object());
const mainLayout_saved = ref(true);
let saveWarning = {
  title: 'Layouts not saved',
  body: 'You have some layouts that are not saved yet. Do you want to save them now?',
  confirmText: 'Yes, Back to Layouts',
  cancelText: 'No, Discard'
};
onBeforeMount(() => {
  props.config.astroid_content.forEach((fieldSet, idx) => {
    Object.keys(fieldSet.childs).forEach(key => {
      fieldSet.childs[key].fields.forEach(field => {
        $scope.value[field.name] = field.value;
        updatePreset.value[field.name] = false;
      });
    });
  });
  action_link = props.config.astroid_lib.astroid_action.replace(/\&amp\;/g, '&');
})
onUpdated(()=>{
    if (props.saveState === true) {
        emit('update:statusSave', false);
        if (mainLayout_saved.value !== true) {
            document.getElementById('saveWarningBtn').click();
        } else {
            saveStyle();
        }
    }
})
function backToLayouts() {
    emit('update:switchPage', 'astroid_layout', 'layout_group');
    emit('update:saveFinish', true);
}
function saveStyle() {
    const action_link = props.config.astroid_lib.astroid_action.replace(/\&amp\;/g, '&') + '&format=json&' + props.config.astroid_lib.astroid_admin_token + '=1';
    const toastAstroidMsg = document.getElementById('mainMessage');
    const toastBootstrap = Toast.getOrCreateInstance(toastAstroidMsg);
    axios.post(action_link, $scope.value, {
        headers: {
            'Content-Type': 'application/json; charset=UTF-8'
        }
    })
        .then((response) => {
            toast_msg.icon = 'fa-solid fa-floppy-disk';
            if (response.data.status === 'success') {
                toast_msg.header= 'Style has been saved';
                toast_msg.body = 'Style '+props.config.astroid_lib.template_name+' has been saved';
                toast_msg.color = 'darkviolet';
            } else {
                toast_msg.header= 'Style did not saved yet';
                toast_msg.body = response.data.message;
                toast_msg.color = 'red';
            }
            emit('update:saveFinish', true);
            toastBootstrap.show();
        })
        .catch((err) => {
            console.error(err);
        });
}
function checkShow(field) {
  if (field.ngShow !== '' && field.ngShow.match(/\[\S+?\]/)) {
    const expression = field.ngShow.replace(/\[(\S+?)\]/g, "$scope.value\['$1'\]");
    try {
      return new Function('$scope', 'return ' + expression)($scope);
    } catch (error) {
      console.log(error);
      console.log('Error at: '+expression);
    }
  }
  return true;
}

function checkShowGroup(group, fieldsetName, index) {
  let hasField = false;
  if (group['option-type'] === 'tab') {
    if (props.fieldSet_tabs[fieldsetName] !== index) {
      return false;
    }
  }
  if (group.fields.length) {
    group.fields.forEach(field => {
      if (typeof field.ngShow === 'string' && checkShow(field)) {
        hasField = true;
        return hasField;
      }
    });
  }
  return hasField;
}

function updateContentLayout(index, value) {
  if (typeof astroidcontentlayouts.value[index] === 'undefined') {
    astroidcontentlayouts.value[index] = {
      'astroid_content_layout' : '',
      'module_position' : '',
      'position' : 'after'
    }
  }
  Object.keys(value).forEach(key => {
    astroidcontentlayouts.value[index][key] = value[key];
  })
  let tmp = [];
  Object.keys(astroidcontentlayouts.value).forEach(key => {
    tmp.push(astroidcontentlayouts.value[key]['astroid_content_layout']+':'+astroidcontentlayouts.value[key]['module_position']+':'+astroidcontentlayouts.value[key]['position']);
  })
  $scope.value['astroidcontentlayouts'] = tmp.join(',');
}

const presets = ref([]);
const toast_msg = reactive({
  header: '',
  body:'',
  icon: '',
  color:'darkviolet'
});
function onUpdatePreset(key) {
    updatePreset.value[key] = true;
}
function loadPreset(value) {
  let tmp = '';
  if (typeof value === 'string') {
    tmp = JSON.parse(value);
  } else {
    tmp = value;
  }
  Object.keys(tmp).forEach(key => {
    $scope.value[key] = tmp[key];
      updatePreset.value[key] = true;
  })
}
function getPreset(value) {
  presets.value = value;
}
function selectPreset(event, group) {
  if (event.target.value !== '' && confirm('Your current configure will be lost and overwritten by new data. Are you sure?')) {
    const toastAstroidMsg = document.getElementById('mainMessage');
    const toastBootstrap = Toast.getOrCreateInstance(toastAstroidMsg);
    let url = 'index.php?t='+Math.random().toString(36).substring(7);
    if (process.env.NODE_ENV === 'development') {
        url = "preset_ajax.txt?ts="+Date.now();
    }
    const formData = new FormData(); // pass data as a form
    formData.append(props.config.astroid_lib.astroid_admin_token, 1);
    formData.append('name', event.target.value);
    formData.append('astroid', 'loadpreset');
    formData.append('option', 'com_ajax');
    formData.append('template', props.config.astroid_lib.tpl_template_name);
    axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      if (response.data.status === 'success') {
        const tmp = JSON.parse(response.data.data);
        group.fields.forEach(field => {
          if (typeof tmp[field.name] !== 'undefined') {
              $scope.value[field.name] = tmp[field.name]
              updatePreset.value[field.name] = true;
          }
        });
        toast_msg.icon = 'fa-solid fa-rocket';
        toast_msg.header = 'Preset '+group.title+' Applied.';
        toast_msg.body = 'Please click "Save" button to save your changes!';
        toast_msg.color = 'green';
        toastBootstrap.show();
      } else {
        toast_msg.icon = 'fa-regular fa-face-sad-tear';
        toast_msg.header = 'Preset '+group.title+' is not Applied.';
        toast_msg.body = response.data.message;
        toast_msg.color = 'red';
        toastBootstrap.show();
      }
      event.target.value = '';
    })
    .catch((err) => {
      console.error(err);
    });
  }
}
const pro_badge = '<span class="badge text-bg-danger ms-2">PRO</span>';
</script>
<template>
  <main class="as-main order-1">
    <form method="POST" :action="action_link" id="astroid-form">
      <input type="hidden" id="astroid-admin-token" :name="props.config.astroid_lib.astroid_admin_token" value="1" />
      <div class="as-page ps-lg-2" :class="props.pageIndex[fieldSet.name]" v-for="fieldSet in props.config.astroid_content" :key="fieldSet.name">
        <div :id="`astroid-page-`+index" class="as-content" v-if="Object.keys(fieldSet.childs).length > 0" v-for="(group, index) in fieldSet.childs" :key="index" v-show="checkShowGroup(group, fieldSet.name, index)">
          <h3 v-if="group.title !== ''">{{ group.title }}</h3>
          <p v-if="group.description !== ''">{{ group.description }}</p>
          <div class="input-group mb-3" v-if="group.preset !== `none`">
            <label :for="`preset_`+fieldSet.name+`_`+index" class="input-group-text">Load default configure</label>
            <select class="form-select" :id="`preset_`+fieldSet.name+`_`+index" @change="selectPreset($event, group)">
              <option value="">Select a preset</option>
              <option v-for="(preset, preset_idx) in presets" :key="preset_idx" :value="preset.name">{{ preset.title }}</option>
            </select>
          </div>
          <div v-if="group.fields.length > 0" class="as-group-content">
            <div :class="(idx !== 0 && field.input.type !== 'astroidhidden' && field.input.type !== 'hidden' ? 'mt-3 pt-3 border-top': '')" v-for="(field, idx) in group.fields" :key="field.id" v-show="checkShow(field)">
              <div class="row">
                <div v-if="(field.label || field.description) && field.input.type !== `astroidheading`" class="col-sm-6 col-md-5">
                  <div v-if="(field.input.type === `astroidradio` && field.input.role !== 'switch') || (['astroidpreloaders', 'astroidmedia', 'astroidcolor', 'astroidicon', 'astroidcalendar', 'astroidgradient', 'astroidspacing', 'astroidicons', 'astroidgetpro'].includes(field.input.type))" class="form-label" v-html="(field.label + (field.input.type === `astroidgetpro` ? pro_badge : ``))"></div>
                  <label v-else :for="(typeof field.type !== 'undefined' && field.type === `json` ? field.input.id : 'params_'+field.name)" class="form-label" v-html="field.label"></label>
                  <p v-if="field.description !== ''" v-html="field.description" class="form-text"></p>
                </div>
                <div :class="{
                  'col-sm-6 col-md-7' : (field.label || field.description) && field.input.type !== `astroidheading`,
                  'col-12': !(field.label || field.description) || field.input.type === `astroidheading`
                }">
                  <div v-if="typeof field.type !== 'undefined' && field.type === `json`" class="position-relative">
                    <Fields 
                      :field="field" 
                      :scope="$scope"
                      :colorMode="0"
                      :presetUpdated="updatePreset[field.name]"
                      @update:contentlayout="updateContentLayout"
                      @update:loadPreset="loadPreset"
                      @update:getPreset="getPreset"
                      @update:presetState="state => (updatePreset[field.name] = state)"
                      @update:mainLayoutState="state => (mainLayout_saved = state)"
                      />
                  </div>
                  <div v-else v-html="field.input"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
    <nav class="nav justify-content-center mb-3 astroid-footer-links">
      <a class="nav-link d-inline-flex align-items-center" href="https://ko-fi.com/astroidframework" title="Buy Me a Coffee" target="_blank"><img src="https://storage.ko-fi.com/cdn/cup-border.png" alt="Buy Me a Coffee" class="me-2">Support Astroid with $10</a>
      <a class="nav-link" :href="constant.jed_link" title="Reviews for Astroid on JED" target="_blank"><i class="fa-brands fa-joomla me-2"></i>Astroid on JED</a>
      <a class="nav-link" :href="constant.document_link" title="Go to Documentation" target="_blank">Documentation</a>
    </nav>
      <button type="button" id="saveWarningBtn" class="btn btn-primary d-none" data-bs-toggle="modal" data-bs-target="#saveWarning"></button>
      <div class="modal fade" id="saveWarning" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="saveWarningLabel" aria-hidden="true">
          <div class="modal-dialog">
              <div class="modal-content">
                  <div class="modal-header">
                      <h1 class="modal-title fs-5" id="saveWarningLabel">{{ saveWarning.title }}</h1>
                  </div>
                  <div class="modal-body" v-html="saveWarning.body"></div>
                  <div class="modal-footer">
                      <button type="button" class="btn btn-sm btn-as btn-as-primary" data-bs-dismiss="modal" @click="backToLayouts">{{ saveWarning.confirmText }}</button>
                      <button type="button" class="btn btn-sm btn-as btn-secondary" data-bs-dismiss="modal" @click="saveStyle">{{ saveWarning.cancelText }}</button>
                  </div>
              </div>
          </div>
      </div>
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
      <div id="mainMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <i class="me-2" :class="toast_msg.icon" :style="{ color: toast_msg.color }"></i>
          <strong class="me-auto">{{ toast_msg.header }}</strong>
          <small>1 second ago</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">{{ toast_msg.body }}</div>
      </div>
    </div>
  </main>
</template>