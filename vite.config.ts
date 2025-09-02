import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import path from 'path'

const resolvers = [ElementPlusResolver()]

export default defineConfig({
	server: {
		port: 8080,
		hmr: {
			host: 'localhost'
		},
	},
	plugins: [
		vue({
			template: {
				transformAssetUrls: {
					base: null,
					includeAbsolute: false,
				},
			},
		}),
		vuetify({
			autoImport: true,
		}),
		ViteFonts({
			google: {
				families: [{
					name: 'Roboto',
					styles: 'wght@100;300;400;500;700;900',
				}],
			},
		}),
		AutoImport({
			resolvers: resolvers,
			imports: ["vue", "vue-router", "pinia"],
			dts: "src/auto-imports.d.ts",
		}),
		Components({
			resolvers: resolvers,
			extensions: ["vue"],
			dts: "src/components.d.ts",
		}),
	],
	define: { 'process.env': {} },
	resolve: {
		alias: {
			vue: 'vue/dist/vue.esm-bundler.js',
			'$': 'jQuery',
			'@': path.resolve(__dirname, './src'),
		}
	}
})
