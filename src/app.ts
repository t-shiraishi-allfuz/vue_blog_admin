import '@/assets/css/app.css'
import '@/assets/css/sweetalert-custom.css'
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
import Vue3TouchEvents from "vue3-touch-events"
import { createHead } from '@unhead/vue/client'

const pinia = createPinia()
pinia.use(createPersistedState())
const app = createApp(App)
  .use(pinia)
  .use(VueSweetalert2)
  .use(Vue3TouchEvents as any)
  .use(createHead())

app.component('VueMultiselect', Multiselect)
app.component('VueDatePicker', VueDatePicker)

// グローバルエラーハンドラー
app.config.errorHandler = (err, _instance, info) => {
	console.error('Vueエラー:', err, info)
	try {
		if (err instanceof Error) {
			logError(err, `Vueコンポーネントエラー: ${info || '不明'}`).catch(() => {
				// ログ保存エラーは無視
			})
		} else if (err) {
			// Errorインスタンスでない場合でもログに記録
			const error = new Error(String(err))
			if (typeof err === 'object' && err !== null) {
				Object.assign(error, err)
			}
			logError(error, `Vueコンポーネントエラー: ${info || '不明'}`).catch(() => {
				// ログ保存エラーは無視
			})
		}
	} catch (handlerError) {
		// エラーハンドラー自体でエラーが発生した場合はコンソールに出力のみ
		console.error('エラーハンドラーエラー:', handlerError)
	}
}

// 未処理のPromise拒否をキャッチ
window.addEventListener('unhandledrejection', (event) => {
	console.error('未処理のPromise拒否:', event.reason)
	
	// 動的インポートのエラーを詳細に記録
	if (event.reason instanceof TypeError && event.reason.message?.includes('Failed to fetch dynamically imported module')) {
		const errorMessage = `動的インポートエラー: ${event.reason.message}\nURL: ${(event.reason as any).url || '不明'}`
		console.error(errorMessage)
		const error = new Error(errorMessage)
		if ((event.reason as any).url) {
			(error as any).url = (event.reason as any).url
		}
		logError(error, '動的インポートエラー').catch(() => {
			// ログ保存エラーは無視
		})
		// デフォルトの動作を防ぐ（エラーが表示されないようにする）
		event.preventDefault()
		return
	}
	
	if (event.reason instanceof Error) {
		logError(event.reason, '未処理のPromise拒否').catch(() => {
			// ログ保存エラーは無視
		})
	}
})

registerPlugins(app)
app.mount('#app')
