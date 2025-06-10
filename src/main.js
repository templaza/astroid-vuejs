import { createApp } from 'vue'
import App from './App.vue'
import Article from './Article.vue'
import Module from './Module.vue';
import "vue-search-select/dist/VueSearchSelect.css"
import 'vue-color-kit/dist/vue-color-kit.css'
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor'
let astroid_app = document.getElementById('astroid-app');
let as_widgets = document.querySelectorAll('.as-article-widget-data');
let as_module = document.getElementById('astroid-layout-module');
if (typeof(astroid_app) !== 'undefined' && astroid_app !== null)
{
    const app = createApp(App);
    app.use(VueMonacoEditorPlugin, {
        paths: {
            // The default CDN config
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.0/min/vs'
        },
    });
    app.mount('#astroid-app')
}
else if (as_widgets.length > 0) {
    as_widgets.forEach(as_widget => {
        let app = createApp(Article, {
            widget_json_id : as_widget.id
        });
        app.use(VueMonacoEditorPlugin, {
            paths: {
                // The default CDN config
                vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.0/min/vs'
            },
        });
        app.mount('#'+as_widget.id);
    });
}
else if (typeof(as_module) !== 'undefined' && as_module !== null)
{
    const app = createApp(Module);
    app.use(VueMonacoEditorPlugin, {
        paths: {
            // The default CDN config
            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.36.0/min/vs'
        },
    });
    app.mount('#astroid-layout-module')
}
document.addEventListener('focusin', (e) => {
    if (e.target.closest(".tox-tinymce, .tox-tinymce-aux, .moxman-window, .tam-assetmanager-root") !== null) {
        e.stopImmediatePropagation();
    }
});