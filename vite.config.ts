import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'
import path from 'path'
import process from 'process'
import fs from 'fs'

const resolvers = [ElementPlusResolver()]

export default defineConfig(({ mode }) => {
	// 環境変数を読み込む（エラー時は空オブジェクトを使用）
	let env: Record<string, string> = {}
	try {
		env = loadEnv(mode, process.cwd(), '')
	} catch (error) {
		// .env.localへのアクセス権限がない場合など、エラーが発生してもビルドを続行
		console.warn('環境変数の読み込みに失敗しました:', error)
	}
	const APP_TITLE = env.VITE_APP_TITLE || 'ブログ管理システム'

	// HTMLタイトルを設定するカスタムプラグイン
	const htmlTitlePlugin = () => {
		return {
			name: 'html-transform',
			transformIndexHtml(html: string) {
				return html.replace(
					/<title>(.*?)<\/title>/,
					`<title>${APP_TITLE}</title>`
				)
			}
		}
	}

	return {
		server: {
			port: 8080,
			hmr: {
				host: 'localhost'
			},
			allowedHosts: [
				'lawanda-proexperiment-uriah.ngrok-free.dev'
			]
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
			htmlTitlePlugin(),
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
			},
			// ログ保存APIエンドポイント
			{
				name: 'log-api',
				configureServer(server) {
					server.middlewares.use('/api/logs', (req, res) => {
						if (req.method !== 'POST') {
							res.writeHead(405, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify({ error: 'Method not allowed' }));
							return;
						}

						let body = '';
						req.on('data', (chunk) => {
							body += chunk.toString();
						});

						req.on('end', () => {
							try {
								const { year, month, filename, logEntry } = JSON.parse(body);

								// ログディレクトリを確保
								const logsBaseDir = path.resolve(process.cwd(), 'src', 'logs');
								const yearDir = path.join(logsBaseDir, year);
								const monthDir = path.join(yearDir, month);

								// ディレクトリが存在しない場合は作成
								if (!fs.existsSync(yearDir)) {
									fs.mkdirSync(yearDir, { recursive: true });
								}
								if (!fs.existsSync(monthDir)) {
									fs.mkdirSync(monthDir, { recursive: true });
								}

								// ファイルパスを構築
								const logFilePath = path.join(monthDir, filename);

								// ファイルが存在する場合は末尾に追加、存在しない場合は作成
								fs.appendFileSync(logFilePath, logEntry, 'utf8');

								res.writeHead(200, { 'Content-Type': 'application/json' });
								res.end(JSON.stringify({ success: true }));
							} catch (error: any) {
								console.error('ログ保存エラー:', error);
								res.writeHead(500, { 'Content-Type': 'application/json' });
								res.end(JSON.stringify({ error: error.message }));
							}
						});
					});
				}
			}
		],
		define: { 
			'process.env': {},
			global: 'globalThis',
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
	}
})
