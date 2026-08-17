<script setup>
import axios from "axios";
import {inject, onMounted, onUpdated, reactive, ref, watch} from "vue";

const emit = defineEmits(['update:ColorMode','update:saveStyle','update:saveFinished']);
const props = defineProps({
  config: { type: Object, default: null },
    saveStatus: { type: Boolean, default: false }
});

const theme = inject('theme', 'light');
const constant = inject('constant', {});
const template_link = props.config.astroid_lib.jtemplate_link.replace(/\&amp\;/g, '&');
const save_icon = ref('fa-floppy-disk');
const cache_icon = ref('fa-eraser');
const save_disabled = ref(false);
const toast_msg = reactive({
  header: '',
  body:'',
  icon: '',
  color:'darkviolet'
});

const switcher = ref(false);

onMounted (() => {
  switcher.value = theme.value === 'light' ? false : true;
})

onUpdated(()=>{
    if (props.saveStatus === true) {
        emit('update:saveFinished', false);
        save_icon.value = 'fa-floppy-disk';
        save_disabled.value = false;
    }
})

watch(switcher, (newValue) => {
  emit('update:ColorMode', newValue ? 'dark' : 'light');
})

const social_menu = [
  {title: 'Official Website', href: props.config.astroid_lib.astroid_link, icon: 'fas fa-meteor'},
  {title: 'Docs', href: props.config.astroid_lib.document_link, icon: 'fas fa-book'},
  {title: 'GitHub', href: props.config.astroid_lib.github_link, icon: 'fab fa-github'},
  {title: 'Buy Me a Coffee', href: props.config.astroid_lib.donate_link, icon: 'fa-solid fa-mug-saucer'}
]
function submitForm() {
    emit('update:saveStyle', true);
    save_icon.value = 'fa-sync fa-spin'
    save_disabled.value = true;
    return false;
}

function clearCache() {
  const toastAstroidMsg = document.getElementById('astroidMessage');
  const toastBootstrap = Toast.getOrCreateInstance(toastAstroidMsg);
  cache_icon.value = 'fa-sync fa-spin';
  let url = props.config.astroid_lib.base_url+'/index.php?option=com_ajax&astroid=clear-cache&template='+props.config.astroid_lib.template_name;
  if (constant.cms_name === 'moodle') {
      url = constant.site_url+`/local/moon/ajax/action.php?theme=${constant.template_name}&task=clearCache&sesskey=${constant.astroid_admin_token}`;
  }
  axios.get(url)
  .then(function (response) {
    if (response.data.status === 'success') {
      toast_msg.icon  = 'fa-solid fa-eraser';
      toast_msg.header= 'Template Clear Cache';
      toast_msg.body = response.data.data.message;
      toast_msg.color = 'darkviolet';
      toastBootstrap.show();
      if (constant.cms_name === 'joomla') {
          axios.get(props.config.astroid_lib.base_url+'/index.php?option=com_ajax&astroid=clear-joomla-cache')
              .then(function (response) {
                  if (response.data.status === 'success') {
                      cache_icon.value = 'fa-eraser';
                      toast_msg.header= 'Joomla Clear Cache';
                      toast_msg.body = response.data.data.message;
                      toastBootstrap.show();
                  }
              })
              .catch(function (error) {
                  // handle error
                  console.log(error);
              });
      } else {
          cache_icon.value = 'fa-eraser';
      }
    }
  })
  .catch(function (error) {
    // handle error
    console.log(error);
  });
}
</script>
<template>
  <header class="navbar navbar-expand-lg as-navbar sticky-top">
    <nav class="container-xxl as-gutter flex-wrap flex-lg-nowrap" aria-label="Main navigation">
      <div class="as-navbar-toggle">
        <button class="navbar-toggler p-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#asSidebar" aria-controls="asSidebar" aria-label="Toggle docs navigation">
          <i class="fas fa-bars"></i>
          <span class="d-none fs-6 pe-1">Browse</span>
        </button>
      </div>
      <a class="navbar-brand astroid-logo p-0 me-0 me-lg-4 d-flex align-items-center" href="javascript:void(0);" aria-label="Astroid">
        <div class="fa-layers me-1" full-width="">
            <svg v-if="constant.cms_name === `joomla`" class="svg-inline--fa me-2" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="meteor" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1254 1254"><polygon fill="currentColor" points="1070.81 980.07 1067.55 980.01 964.16 946.72 681.44 474.46 541.58 674.67 354.89 817.83 680.27 259.51 1070.81 980.07"/>
                <path fill="currentColor" d="M384.15,580.57c-.68-1.01-14.19,7.04-21.69,11.55-65.36,39.3-98.04,58.95-137.46,90.71,0,0-45.31,36.5-93.18,89.06-4.49,4.93-20.46,22.66-35.46,48.65-4.97,8.62-13.12,23.83-18.14,43.71-2.56,10.15-3.18,17.02-3.3,22.27-.3,13.23,2.39,23.24,3.3,26.39,6,20.75,18.64,33.54,23.91,38.76,11.05,10.93,21.84,16.35,30.51,20.62,4.95,2.44,16.49,7.76,41.23,13.19,27.66,6.07,49.46,7.38,65.15,8.25,10.17.56,30.92,1.42,57.73,0,24.4-1.29,41.44-3.8,65.97-7.42,51.66-7.62,89.45-16.81,101.43-19.79,19.82-4.94,34.25-9.18,47.83-13.19,16.33-4.82,66.64-20,132.77-46.18,11.09-4.39,39.49-15.77,75.87-32.16,12.53-5.65,54.91-24.91,115.45-56.9,55.61-29.39,83.42-44.08,121.22-68.45,19.13-12.33,76.15-49.9,125.35-96.48,4.76-4.5,25.09-23.91,47.83-51.95,11.25-13.87,18.36-24.02,24.74-34.64,7.72-12.83,14.38-24.08,18.97-40.41,3.12-11.12,6.6-23.48,4.12-39.58-.5-3.22-3.02-18.2-14.02-33.81-1.97-2.79-10.19-14.1-27.21-24.74-16.85-10.54-33.29-14.78-53.6-18.14-39.66-6.57-71.59-6.06-83.29-5.77-52.86,1.3-109.05,8.46-108.85,12.37.15,2.97,32.85,3.98,45.36,4.12,20.57.24,22.82-1.4,41.23-.82,20.06.63,35.97,3.16,45.36,4.95,17.98,3.42,31.44,5.98,47.56,14.02,13.83,6.9,26.71,13.32,35.73,28.04,9.59,15.66,9.29,31.7,9.07,38.76-.31,9.69-2.44,19.76-9.9,36.28-14.21,31.48-32.41,52.42-34.9,55.25-43.4,49.19-98.37,90.12-103.64,94.01-32.3,23.85-67.31,49.7-120.4,80.82-76.47,44.83-138.98,70.41-178.95,86.59-20.57,8.32-97.14,38.8-191.32,62.67-28.28,7.17-54.5,12.82-84.11,17.32-44.88,6.82-77.72,7.97-94.01,8.25-46.36.78-69.93-3.71-82.46-6.6-26.51-6.11-40.27-13.46-50.3-20.62-9.96-7.11-23.69-17.17-30.51-35.46-5.6-15.02-3.85-28.35-2.47-38.83.72-5.51,3.02-19.63,14.02-41.16,8.31-16.27,17.5-28.76,32.99-47,17.49-20.6,33.77-39.78,61.02-64.32,6.48-5.83,14.52-12.82,65.97-51.95,53.03-40.33,78.49-58.77,77.52-60.2Z"/>
                <polygon fill="currentColor" points="395.12 884.8 395.97 883.15 395.04 884.47 310.53 893.93 354.89 817.83 541.58 674.67 534.1 685.37 701.64 649.73 395.12 884.8"/></svg>
            <svg v-else viewBox="0 0 200 200" class="svg-inline--fa me-2" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color: rgb(96, 165, 250); stop-opacity: 1;"></stop><stop offset="100%" style="stop-color: rgb(59, 130, 246); stop-opacity: 1;"></stop></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"></feGaussianBlur><feMerge><feMergeNode in="coloredBlur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter></defs><circle cx="100" cy="100" r="70" fill="url(#moonGradient)" filter="url(#glow)"></circle><circle cx="115" cy="85" r="70" fill="#000" opacity="0.95"></circle><circle cx="80" cy="95" r="3" fill="#fff" opacity="0.8"></circle><circle cx="110" cy="110" r="3" fill="#fff" opacity="0.8"></circle><circle cx="95" cy="130" r="3" fill="#fff" opacity="0.8"></circle><circle cx="75" cy="110" r="2.5" fill="#e0f2fe" opacity="0.6"></circle><circle cx="125" cy="95" r="2.5" fill="#e0f2fe" opacity="0.6"></circle><line x1="80" y1="95" x2="110" y2="110" stroke="#fff" stroke-width="1" opacity="0.5"></line><line x1="110" y1="110" x2="95" y2="130" stroke="#fff" stroke-width="1" opacity="0.5"></line><line x1="80" y1="95" x2="75" y2="110" stroke="#e0f2fe" stroke-width="0.8" opacity="0.4"></line><circle cx="100" cy="100" r="70" fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.3"></circle><circle cx="100" cy="100" r="68" fill="none" stroke="#60a5fa" stroke-width="0.5" opacity="0.2"></circle></svg>
            <span class="fa-layers-counter fa-layers-bottom-right astroid-version">v{{ props.config.astroid_lib.astroid_version }}</span>
        </div>
        <span v-if="constant.cms_name === `joomla`">Astroid</span>
          <span v-else>Moon</span>
      </a>
      <div class="d-flex">
        <button class="navbar-toggler d-flex d-lg-none order-3 p-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#bdNavbar" aria-controls="bdNavbar" aria-label="Toggle navigation">
          <i class="fas fa-ellipsis"></i>
        </button>
      </div>
      <div class="offcanvas-lg offcanvas-end flex-grow-1" tabindex="-1" id="bdNavbar" aria-labelledby="bdNavbarOffcanvasLabel" data-bs-scroll="true">
        <div class="offcanvas-header px-4 pb-0">
          <h5 class="offcanvas-title" id="bdNavbarOffcanvasLabel">{{ props.config.astroid_lib.template_title }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" data-bs-target="#bdNavbar"></button>
        </div>
        <div class="offcanvas-body p-4 pt-0 p-lg-0">
          <hr class="d-lg-none">
          <div class="cta-button d-lg-flex">
            <div class="vr d-none d-lg-flex h-100 me-lg-4"></div>
            <ul class="navbar-nav flex-row flex-wrap">
              <li class="nav-item col-6 col-lg-auto d-grid">
                <button class="btn btn-sm btn-as btn-as-primary" type="button" id="save_template_style" @click.prevent="submitForm" :disabled="save_disabled">
                  <i class="fas me-1" :class="save_icon"></i>
                  {{ props.config.astroid_lang.ASTROID_SAVE }}
                </button>
              </li>
              <li class="nav-item col-6 col-lg-auto d-grid">
                <button class="btn btn-sm btn-as btn-as-light" type="button" @click.prevent="clearCache" :disabled="save_disabled">
                  <i class="fas me-1" :class="cache_icon"></i>
                  {{ props.config.astroid_lang.ASTROID_TEMPLATE_CLEAR_CACHE }}
                </button>
              </li>
              <li class="nav-item col-6 col-lg-auto d-grid">
                <a class="btn btn-sm btn-as btn-as-light" :href="props.config.astroid_lib.site_url" target="_blank" tabindex="-1" role="button" :aria-disabled="save_disabled" :class="{'disabled' : save_disabled}">
                  <i class="fas fa-up-right-from-square me-1"></i>
                  {{ props.config.astroid_lang.ASTROID_TEMPLATE_PREVIEW }}
                </a>
              </li>
              <li class="nav-item col-6 col-lg-auto d-grid">
                <a class="btn btn-sm btn-as btn-as-light" :href="template_link" tabindex="-1" role="button" :aria-disabled="save_disabled" :class="{'disabled' : save_disabled}">
                  <i class="fas fa-xmark me-1"></i>
                  {{ props.config.astroid_lang.ASTROID_TEMPLATE_CLOSE }}
                </a>
              </li>
            </ul>
          </div>
          <div class="template-title m-auto d-none d-lg-block">{{ props.config.astroid_lib.template_title }}</div>
          <hr class="d-lg-none">
          <ul class="navbar-nav flex-row flex-wrap ms-md-auto">
            <li class="nav-item col-6 col-lg-auto" v-for="item in social_menu" :key="item.value">
              <a class="nav-link py-2 px-0 px-lg-2" :href="item.href" :title="item.title" target="_blank" rel="noopener">
                <i :class="item.icon"></i>
                <small class="d-lg-none ms-2">{{ item.title }}</small>
              </a>
            </li>
          </ul>
          <div class="astroid-color-mode d-lg-flex align-items-center ms-lg-2">
            <hr class="d-lg-none">
            <div class="form-check form-switch"><input class="form-check-input switcher" id="astroid-color-mode-switcher" type="checkbox" role="switch" v-model="switcher"></div>
          </div>
        </div>
      </div>
    </nav>
  </header>
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="astroidMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="me-2" :class="toast_msg.icon" :style="{color: toast_msg.color}"></i>
                <strong class="me-auto">{{ toast_msg.header }}</strong>
                <small>1 second ago</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                {{ toast_msg.body }}
            </div>
        </div>
    </div>
</template>