import 'element-plus/dist/index.css'
import VueSweetalert2 from 'vue-sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import jQuery from 'jquery'
;(window as any).$ = jQuery

import Alpine from 'alpinejs'
;(window as any).Alpine = Alpine
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
import { logError } from '@/utils/logger'

const pinia = createPinia()
pinia.use(createPersistedState())
const app = createApp(App)
  .use(pinia)
  .use(VueSweetalert2)

app.component('VueMultiselect', Multiselect)
app.component('VueDatePicker', VueDatePicker)

// グローバルエラーハンドラー
app.config.errorHandler = (err, instance, info) => {
	console.error('Vueエラー:', err, info)
	if (err instanceof Error) {
		logError(err, `Vueコンポーネントエラー: ${info}`).catch(() => {
			// ログ保存エラーは無視
		})
	}
}

// 未処理のPromise拒否をキャッチ
window.addEventListener('unhandledrejection', (event) => {
	console.error('未処理のPromise拒否:', event.reason)
	if (event.reason instanceof Error) {
		logError(event.reason, '未処理のPromise拒否').catch(() => {
			// ログ保存エラーは無視
		})
	}
})

registerPlugins(app)
app.mount('#app')
