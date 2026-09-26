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
    const config = JSON.parse(document.getElementById("astroid-script-options").innerHTML);
    const app = createApp(App, {
        config: config
    });
    app.use(VueMonacoEditorPlugin, {
        paths: {
            // The default CDN config
            vs: config.astroid_lib.monaco_editor_path
        },
    });
    app.mount('#astroid-app')
}
else if (as_widgets.length > 0) {
    as_widgets.forEach(as_widget => {
        const config = JSON.parse(document.getElementById(as_widget.id+'_json').innerHTML);
        let app = createApp(Article, {
            config: config
        });
        app.use(VueMonacoEditorPlugin, {
            paths: {
                // The default CDN config
                vs: config.constant.monaco_editor_path
            },
        });
        app.mount('#'+as_widget.id);
    });
}
else if (typeof(as_module) !== 'undefined' && as_module !== null)
{
    const config = JSON.parse(document.getElementById('astroid_layout_module_json').innerHTML);
    const app = createApp(Module, {
        config: config
    });
    app.use(VueMonacoEditorPlugin, {
        paths: {
            // The default CDN config
            vs: config.constant.monaco_editor_path
        },
    });
    app.mount('#astroid-layout-module')
}
document.addEventListener('focusin', (e) => {
    if (e.target.closest(".tox-tinymce, .tox-tinymce-aux, .moxman-window, .tam-assetmanager-root") !== null) {
        e.stopImmediatePropagation();
    }
});