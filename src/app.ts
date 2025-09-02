import 'element-plus/dist/index.css'
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import jQuery from 'jquery'
window.$ = jQuery

import Alpine from 'alpinejs'
window.Alpine = Alpine
Alpine.start()

import { createApp } from 'vue'

import 'material-icons/iconfont/material-icons.css'
import {registerPlugins} from '@/plugins'

import App from './App.vue'
import Multiselect from 'vue-multiselect'
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css'
import 'vuetify/dist/vuetify.min.css'
import { createPinia } from 'pinia'
import { createPersistedState } from "pinia-plugin-persistedstate"

const pinia = createPinia()
pinia.use(createPersistedState())
const app = createApp(App)
  .use(pinia)
  .use(VueSweetalert2)

app.component('VueMultiselect', Multiselect)
app.component('VueDatePicker', VueDatePicker)

registerPlugins(app)
app.mount('#app')
