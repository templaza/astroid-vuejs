<script setup>
import Heading from "@/components/Heading.vue";
import {onBeforeMount, onMounted, provide, ref} from "vue";
import 'bootstrap/scss/bootstrap.scss'
import './assets/base.scss'
import Sidebar from "@/components/Sidebar.vue";
import Main from "@/components/Main.vue";
const astroid_config = JSON.parse(document.getElementById("astroid-script-options").innerHTML);
const theme = ref('light');
provide('theme', theme);
provide('constant', astroid_config.astroid_lib);
provide('language', astroid_config.astroid_lang);
window.Toast = bootstrap.Toast;
window.Modal = bootstrap.Modal;
onBeforeMount(()=>{
  const colorMode = getCookie('astroid_colormode');
  if (colorMode) {
    theme.value = colorMode;
  } else if (getCookie('osColorScheme')) {
      theme.value = getCookie('osColorScheme');
  }
})

const pageIndex     = ref(new Object());
const fieldSet_tabs = ref(new Object());

onMounted(() => {
    astroid_config.astroid_content.forEach((fieldSet, idx) => {
        if (idx === 0) {
            pageIndex.value[fieldSet.name] = 'd-block';
        } else {
            pageIndex.value[fieldSet.name] = 'd-none';
        }
        fieldSet_tabs.value[fieldSet.name] = Object.keys(fieldSet.childs)[0];
    });
})

function pageActive(pgIndex, group = null) {
    astroid_config.astroid_content.forEach(fieldSet => {
        pageIndex.value[fieldSet.name] = 'd-none';
    });
    pageIndex.value[pgIndex] = 'd-block';
    setTimeout(function () {
        if (group !== null) {
            const el = document.getElementById('astroid-page-'+group);
            const y = el.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({top: y, behavior: 'smooth'});
            if (typeof fieldSet_tabs.value[pgIndex] !== 'undefined') {
                fieldSet_tabs.value[pgIndex] = group;
            }
        } else {
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    }, 100);
}

function updateColorMode(value) {
  theme.value = value;
  document.getElementById("astroid-html").setAttribute("data-bs-theme", value);
  setCookie('astroid_colormode', value, 3)
}

const setCookie = function (name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";
  document.cookie = name+"="+value+expires+"; path=/";
}

const getCookie = function (name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

const saveState = ref(false);
const saveFinished = ref(false);
function saveStyle() {
    saveState.value = true;
}
</script>
<template>
  <Heading :config="astroid_config" :saveStatus="saveFinished" @update:ColorMode="updateColorMode" @update:saveStyle="saveStyle" @update:saveFinished="status => (saveFinished = status)" />
    <div class="container-xxl as-gutter mt-3 my-md-4 as-layout">
        <Sidebar :config="astroid_config" @sidebar-active="pageActive" />
        <Main :config="astroid_config"
              :page-index="pageIndex"
              :field-set_tabs="fieldSet_tabs"
              :saveState="saveState"
              @update:statusSave="status => (saveState = status)"
              @update:saveFinish="status => (saveFinished = status)"
              @update:switchPage="pageActive"
        />
    </div>
</template>