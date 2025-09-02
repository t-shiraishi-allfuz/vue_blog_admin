import vuetify from "./vuetify"
import router from "@/routes"
import type {App} from "vue"

export function registerPlugins (app: App) {
	app
		.use(vuetify)
		.use(router)
}
