import { createApp } from 'vue';
import App from './App.vue';
import router from './routes';
import { createPinia } from 'pinia'; // Pinia
import { quillEditor } from 'vue3-quill'
import 'quill/dist/quill.snow.css'; // Quill用のスタイル

// Vuetify用のインポート（Vuetifyを使用する場合）
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'; // マテリアルデザインアイコン

import { useAuthStore } from '@/stores/authStore';

const vuetify = createVuetify({
	components,
	directives,
	icons: {
		defaultSet: 'mdi',
		aliases,
		sets: { mdi }
	},
})

// Piniaインスタンスの作成
const pinia = createPinia();

// アプリケーションの作成
const app = createApp(App);

// プラグインをアプリに登録
app.use(pinia);
app.use(vuetify);
app.use(quillEditor);

const authStore = useAuthStore();
authStore.initializeAuth().then(() => {
	app.use(router);
	app.mount('#app');
});
