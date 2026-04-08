<script setup>
import {onMounted, onUpdated, onBeforeMount, reactive, ref, inject} from 'vue';
import ResponsiveToggle from "./ResponsiveToggle.vue";
const emit = defineEmits(['update:changeDevice', 'update:statusField']);
const props = defineProps(['modelValue', 'field', 'fieldname', 'currentDevice', 'fieldChanged']);
const constant = inject('constant', {});
const devices = ['mobile', 'landscape_mobile', 'tablet', 'desktop', 'large_desktop', 'larger_desktop', 'global'];
const unitOptions = ['px', 'em', 'rem', 'pt', '%'];
const rangeConfig = reactive(
    {
        'global' : {
            'max' : 100,
            'step': 1,
            'priority': 6
        },
        'larger_desktop' : {
            'max' : 100,
            'step': 1,
            'priority': 5
        },
        'large_desktop' : {
            'max' : 100,
            'step': 1,
            'priority': 4
        },
        'desktop' : {
            'max' : 100,
            'step': 1,
            'priority': 3
        },
        'tablet'  : {
            'max' : 100,
            'step': 1,
            'priority': 2
        },
        'landscape_mobile'  : {
            'max' : 100,
            'step': 1,
            'priority': 1
        },
        'mobile'  : {
            'max' : 100,
            'step': 1,
            'priority': 0
        }
    }
)
const placeholder = ref({
    'global' : '',
    'larger_desktop' : '',
    'large_desktop' : '',
    'desktop' : '',
    'tablet'  : '',
    'landscape_mobile'  : '',
    'mobile'  : ''
});
function changeDevice(device) {
    emit('update:changeDevice', device, props.fieldname);
}
function updateRange(device) {
    if (['em', 'rem'].includes(props.modelValue[props.fieldname+`_unit`][device])) {
        rangeConfig[device]['max']  = 10;
        rangeConfig[device]['step'] = 0.01;
    }
    if (['px', 'pt'].includes(props.modelValue[props.fieldname+`_unit`][device])) {
        rangeConfig[device]['max']  = 100;
        rangeConfig[device]['step'] = 1;
    }
    if (props.modelValue[props.fieldname+`_unit`][device] === '%') {
        rangeConfig[device]['max']  = 1000;
        rangeConfig[device]['step'] = 1;
    }
}
onBeforeMount(() => {
    updateUnit();
})
onMounted(() => {
    Object.keys(props.modelValue[props.fieldname+`_unit`]).forEach(key => {
        updateRange(key);
    });
    if (constant.astroid_legacy && (typeof props.modelValue[props.fieldname]['global'] === 'undefined' || props.modelValue[props.fieldname]['global'] === '')) {
        for (let i = devices.length - 1; i >= 0; i--) {
            const device = devices[i];
            if (typeof props.modelValue[props.fieldname][device] !== 'undefined' && props.modelValue[props.fieldname][device] !== '') {
                props.modelValue[props.fieldname]['global'] = props.modelValue[props.fieldname][device];
                break;
            }
        }
    }
    updatePlaceholder();
    for (let i = devices.length - 1; i >= 0; i--) {
        const device = devices[i];
        if (typeof props.modelValue[props.fieldname][device] !== 'undefined' && props.modelValue[props.fieldname][device] !== '') {
            if (rangeConfig[props.currentDevice].priority < rangeConfig[device].priority) {
                changeDevice(device);
                break;
            }
        }
    }
})
onUpdated(() => {
    updateUnit();
    updateRange(props.currentDevice);
    updatePlaceholder();
})
function updateUnit() {
    // Cache references for performance and clarity
    const model = props.modelValue || {};
    const fname = props.fieldname;
    const unitKey = `${fname}_unit`;

    // Normalize the main field to an object (legacy support: primitive -> per-device copy)
    if (Object.prototype.hasOwnProperty.call(model, fname) && (model[fname] === null || typeof model[fname] !== 'object')) {
        const tmp = model[fname];
        const obj = {};
        for (let i = 0; i < devices.length; i++) {
            obj[devices[i]] = tmp;
        }
        model[fname] = obj;
    }

    // Ensure the field exists as an object
    if (!model[fname] || typeof model[fname] !== 'object') {
        const obj = {};
        for (let i = 0; i < devices.length; i++) {
            obj[devices[i]] = '';
        }
        model[fname] = obj;
    }

    // Normalize unit key: if it's a string or undefined, create an object with defaults
    if (typeof model[unitKey] === 'string' || typeof model[unitKey] === 'undefined') {
        const obj = {};
        for (let i = 0; i < devices.length; i++) {
            obj[devices[i]] = typeof model[unitKey] === 'string' ? model[unitKey] : 'px';
        }
        model[unitKey] = obj;
    }

    // Apply carry-forward logic for units: if a device unit missing, keep last seen
    let lastDevice = typeof model[unitKey] === 'string' ? model[unitKey] : 'px';
    for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        if (typeof model[fname][device] === 'undefined' || model[fname][device] === '') {
            model[unitKey][device] = lastDevice;
        } else {
            // if unit exists for this device, use it for subsequent defaults
            if (model[unitKey] && model[unitKey][device]) {
                lastDevice = model[unitKey][device];
            }
        }
    }
}
function updatePlaceholder() {
    let lastDevice = '';
    for (let i = devices.length - 1; i >= 0; i--) {
        const device = devices[i];
        placeholder.value[device] = lastDevice;
        if (props.modelValue[props.fieldname][device]) {
            lastDevice = props.modelValue[props.fieldname][device];
        }
    }
}
</script>
<template>
    <div class="row g-3 justify-content-between">
        <div class="col col-auto">
            {{ props.field.input.lang[props.fieldname] }}
        </div>
        <div class="col col-auto">
            <ResponsiveToggle
                :modelValue="props.currentDevice"
                @update:modelValue="device => changeDevice(device)"
                :fieldChanged="props.fieldChanged"
                @update:statusField="data => emit('update:statusField', data)"
            />
        </div>
    </div>
    <div class="mt-2" v-for="device in devices" v-show="props.currentDevice===device">
        <div class="row align-items-center g-3 mb-2">
            <div class="col col-3">
                <div class="row gx-1 align-items-center form-text">
                    <div class="col">
                        <input class="form-control form-control-sm"
                               :id="props.field.input.id +`_`+ props.fieldname +`_`+ device"
                               :name="props.field.input.name + `[` + props.fieldname + `]` + `[` + device + `]`" type="text"
                               v-model="props.modelValue[props.fieldname][device]"
                               :placeholder="placeholder[device]">
                    </div> 
                    <div class="col-auto">
                        {{ props.modelValue[props.fieldname+`_unit`][device] }}
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="astroid-btn-group text-end">
                    <span v-for="(unit, key) in unitOptions" :key="unit">
                        <input type="radio" class="btn-check"
                               v-model="props.modelValue[props.fieldname+`_unit`][device]"
                               :name="props.field.input.name + `[` + props.fieldname + `_unit` + `]` + `[` + device + `]`"
                               :id="props.field.input.id+`_`+props.fieldname+`_unit_`+device+`_`+key"
                               :value="unit" autocomplete="off">
                        <label class="btn btn-sm btn-outline-primary btn-as-outline-primary" :for="props.field.input.id+`_`+props.fieldname+`_unit_`+device+`_`+key">{{ unit }}</label>
                    </span>
                </div>
            </div>
        </div>
        <input type="range" class="form-range" min="0" :step="rangeConfig[device]['step']" :max="rangeConfig[device]['max']" v-model="props.modelValue[props.fieldname][device]" :id="props.field.input.id+`_`+props.fieldname+`_range_`+device">
    </div>
</template>