import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import path from 'path'
import { Buffer } from 'buffer'
import process from 'process'

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
		// Buffer polyfill plugin
		{
			name: 'buffer-polyfill',
			configureServer(server) {
				server.middlewares.use('/buffer', (_req, res) => {
					res.setHeader('Content-Type', 'application/javascript');
					res.end('export { Buffer } from "buffer";');
				});
			}
		},
		// Process polyfill plugin
		{
			name: 'process-polyfill',
			configureServer(server) {
				server.middlewares.use('/process', (_req, res) => {
					res.setHeader('Content-Type', 'application/javascript');
					res.end('export { default } from "process/browser";');
				});
			}
		}
	],
	define: { 
		'process.env': {},
		global: 'globalThis',
		process: process,
		Buffer: Buffer,
	},
	resolve: {
		alias: {
			vue: 'vue/dist/vue.esm-bundler.js',
			'$': 'jQuery',
			'@': path.resolve(__dirname, './src'),
			crypto: 'crypto-browserify',
			stream: 'stream-browserify',
			vm: 'vm-browserify',
			util: 'util',
			buffer: 'buffer',
			process: 'process/browser',
		}
	},
	optimizeDeps: {
		include: ['crypto-browserify', 'stream-browserify', 'vm-browserify', 'util', 'buffer', 'process']
	},
	esbuild: {
		define: {
			global: 'globalThis',
			process: 'process',
			Buffer: 'Buffer',
		},
	},
	build: {
		rollupOptions: {
			external: [],
			output: {
				globals: {
					buffer: 'Buffer',
					process: 'process'
				}
			}
		},
		commonjsOptions: {
			transformMixedEsModules: true
		}
	}
})
