import vuetify from "./vuetify"
import router from "@/routes"
import type {App} from "vue"
import vue3GoogleLogin from 'vue3-google-login'

export function registerPlugins (app: App) {
	app
		.use(vuetify)
		.use(router)
		.use(vue3GoogleLogin, {
			clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
		})
}
