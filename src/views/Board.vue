<template>
	<v-card>
		<v-card-title class="d-flex align-center">
			<v-icon class="mr-2">mdi-bulletin-board</v-icon>
			掲示板
		</v-card-title>
		<v-divider />
		<v-tabs v-model="activeTab" bg-color="primary">
			<v-tab value="article">
				<v-icon class="mr-2">mdi-post</v-icon>
				記事紹介
			</v-tab>
			<v-tab value="chat">
				<v-icon class="mr-2">mdi-chat</v-icon>
				雑談
			</v-tab>
		</v-tabs>
		<v-divider />
		<v-window v-model="activeTab">
			<!-- 記事紹介タブ -->
			<v-window-item value="article">
				<v-card-text>
					<!-- 投稿ボタン -->
					<div v-if="authStore.isLogin" class="mb-4 text-right">
						<v-btn
							color="primary"
							variant="flat"
							@click="isArticleDialog = true"
						>
							<v-icon start>mdi-plus</v-icon>
							記事を紹介する
						</v-btn>
					</div>

					<!-- 投稿一覧 -->
					<div v-if="boardStore.isLoading" class="text-center pa-8">
						<v-progress-circular indeterminate />
					</div>
					<div v-else-if="boardStore.articlePosts.length === 0" class="text-center pa-8">
						<v-icon size="64" color="grey-lighten-1">mdi-post-outline</v-icon>
						<p class="text-grey mt-4">まだ投稿がありません</p>
					</div>
					<div v-else class="pa-4">
						<v-card
							v-for="post in boardStore.articlePosts"
							:key="post.id"
							class="mb-6"
							variant="outlined"
						>
							<v-card-text>
								<!-- タイトル -->
								<h3 class="text-h6 font-weight-bold mb-3">{{ post.title }}</h3>
								
								<!-- 紹介文 -->
								<div class="text-body-1 mb-4">{{ post.content }}</div>
								
								<!-- URLに該当するブログカードまたはモーメントカード -->
								<div v-if="post.blogUrl" class="mb-4">
									<BlogCard
										v-if="getBlogDataForPost(post.blogUrl) && getBlogSettingForPost(post.blogUrl)"
										:blog="getBlogDataForPost(post.blogUrl)!"
										:setting="getBlogSettingForPost(post.blogUrl)!"
									/>
									<MomentCard
										v-else-if="getMomentDataForPost(post.blogUrl)"
										:moment="getMomentDataForPost(post.blogUrl)!"
									/>
									<div v-else class="text-caption text-grey">
										記事データを読み込み中...
									</div>
								</div>
								
								<!-- 改行 -->
								<v-divider class="my-4" />
								
								<!-- 掲示板投稿日時 -->
								<div class="text-caption text-grey mb-2">
									<v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
									{{ formatDate(post.createdAt) }}
								</div>
								
								<!-- 投稿者のアカウント情報 -->
								<div class="d-flex align-center">
									<v-avatar
										:image="post.userProfileUrl || undefined"
										size="40"
										class="mr-3"
										end
									/>
									<div class="text-body-2 font-weight-medium">
										{{ post.userName }}
									</div>
									<v-spacer />
									<v-btn
										v-if="authStore.userInfo?.uid === post.uid"
										@click="deleteArticlePost(post.id!)"
										size="small"
										variant="text"
										color="error"
									>
										<v-icon size="small" class="mr-1">mdi-delete</v-icon>
										削除
									</v-btn>
								</div>
							</v-card-text>
						</v-card>
					</div>
				</v-card-text>
			</v-window-item>

			<!-- 雑談タブ -->
			<v-window-item value="chat">
				<v-card-text>
					<!-- 投稿ボタン -->
					<div v-if="authStore.isLogin" class="mb-4 text-right">
						<v-btn
							color="success"
							variant="flat"
							@click="isChatDialog = true"
						>
							<v-icon start>mdi-plus</v-icon>
							雑談を投稿する
						</v-btn>
					</div>

					<!-- 投稿一覧 -->
					<div v-if="boardStore.isLoading" class="text-center pa-8">
						<v-progress-circular indeterminate />
					</div>
					<div v-else-if="boardStore.chatPosts.length === 0" class="text-center pa-8">
						<v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
						<p class="text-grey mt-4">まだ投稿がありません</p>
					</div>
					<v-list v-else>
						<v-list-item
							v-for="post in boardStore.chatPosts"
							:key="post.id"
							class="mb-2"
						>
							<template #prepend>
								<v-avatar
									:image="post.userProfileUrl || undefined"
									size="40"
									class="mr-3"
								/>
							</template>
							<v-list-item-subtitle class="mb-2">
								{{ post.content }}
							</v-list-item-subtitle>
							<v-list-item-subtitle class="text-caption text-grey">
								{{ post.userName }} • {{ formatDate(post.createdAt) }}
								<v-btn
									v-if="authStore.userInfo?.uid === post.uid"
									@click="deleteChatPost(post.id!)"
									size="x-small"
									variant="text"
									color="error"
									class="ml-2"
								>
									削除
								</v-btn>
							</v-list-item-subtitle>
						</v-list-item>
					</v-list>
				</v-card-text>
			</v-window-item>
		</v-window>
	</v-card>

	<!-- 記事紹介投稿ダイアログ -->
	<DialogTemplate
		ref="articleDialogRef"
		label="記事を紹介する"
		v-model:dialog="isArticleDialog"
	>
		<template v-slot:contents>
			<v-form ref="articleFormRef" @submit.prevent="submitArticlePost">
				<v-card-text class="pa-6">
					<v-text-field
						v-model="articleForm.title"
						label="タイトル"
						:rules="articleRules.title"
						required
						class="mb-4"
					/>
					<v-textarea
						v-model="articleForm.content"
						label="紹介文"
						:rules="articleRules.content"
						required
						rows="3"
						class="mb-4"
					/>
					<v-text-field
						v-model="articleForm.blogUrl"
						label="記事URL（任意）"
						:rules="articleRules.url"
						placeholder="https://..."
						class="mb-4"
					/>
				</v-card-text>
				<v-card-actions class="pa-6 pt-0">
					<v-spacer />
					<v-btn
						color="grey-lighten-4"
						variant="elevated"
						@click="closeArticleDialog"
					>
						閉じる
					</v-btn>
					<v-btn
						color="success"
						variant="elevated"
						type="submit"
						:loading="isSubmitting"
						:disabled="isSubmitting"
					>
						投稿する
					</v-btn>
					<v-spacer />
				</v-card-actions>
			</v-form>
		</template>
	</DialogTemplate>

	<!-- 雑談投稿ダイアログ -->
	<DialogTemplate
		ref="chatDialogRef"
		label="雑談を投稿する"
		v-model:dialog="isChatDialog"
	>
		<template v-slot:contents>
			<v-form ref="chatFormRef" @submit.prevent="submitChatPost">
				<v-card-text class="pa-6">
					<v-textarea
						v-model="chatForm.content"
						label="メッセージ"
						:rules="chatRules.content"
						required
						rows="3"
						class="mb-4"
					/>
				</v-card-text>
				<v-card-actions class="pa-6 pt-0">
					<v-spacer />
					<v-btn
						color="grey-lighten-4"
						variant="elevated"
						@click="closeChatDialog"
					>
						閉じる
					</v-btn>
					<v-btn
						color="success"
						variant="elevated"
						type="submit"
						:loading="isSubmitting"
						:disabled="isSubmitting"
					>
						投稿する
					</v-btn>
					<v-spacer />
				</v-card-actions>
			</v-form>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import { useBoardStore } from '@/stores/boardStore'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useMomentStore } from '@/stores/momentStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import Swal from 'sweetalert2'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()
const authStore = useAuthStore()
const blogStore = useBlogStore()
const momentStore = useMomentStore()
const blogSettingStore = useBlogSettingStore()

const activeTab = ref<string>('article')
const isSubmitting = ref<boolean>(false)
const isArticleDialog = ref<boolean>(false)
const isChatDialog = ref<boolean>(false)
const articleDialogRef = ref<any>(null)
const chatDialogRef = ref<any>(null)

// URLからブログIDまたはモーメントIDを抽出
const extractIdFromUrl = (url: string | null): { type: 'blog' | 'moment' | null; id: string | null } => {
	if (!url) return { type: null, id: null }
	
	try {
		const urlObj = new URL(url)
		const blogId = urlObj.searchParams.get('blog_id')
		const momentId = urlObj.searchParams.get('moment_id')
		
		if (blogId) {
			return { type: 'blog', id: blogId }
		} else if (momentId) {
			return { type: 'moment', id: momentId }
		}
	} catch (error) {
		// URL解析エラーの場合は、文字列から直接抽出を試みる
		const blogIdMatch = url.match(/[?&]blog_id=([^&]+)/)
		const momentIdMatch = url.match(/[?&]moment_id=([^&]+)/)
		
		if (blogIdMatch) {
			return { type: 'blog', id: blogIdMatch[1] }
		} else if (momentIdMatch) {
			return { type: 'moment', id: momentIdMatch[1] }
		}
	}
	
	return { type: null, id: null }
}

// ブログデータを取得してキャッシュ
const blogDataCache = ref<Map<string, any>>(new Map())
const blogSettingCache = ref<Map<string, any>>(new Map())

// モーメントデータを取得してキャッシュ
const momentDataCache = ref<Map<string, any>>(new Map())

// 投稿のURLからブログデータを取得
const getBlogDataForPost = (url: string | null): any => {
	if (!url) return null
	
	const { type, id } = extractIdFromUrl(url)
	if (type !== 'blog' || !id) return null
	
	return blogDataCache.value.get(id) || null
}

// 投稿のURLからブログ設定を取得
const getBlogSettingForPost = (url: string | null): any => {
	if (!url) return null
	
	const { type, id } = extractIdFromUrl(url)
	if (type !== 'blog' || !id) return null
	
	return blogSettingCache.value.get(id) || null
}

// 投稿のURLからモーメントデータを取得
const getMomentDataForPost = (url: string | null): any => {
	if (!url) return null
	
	const { type, id } = extractIdFromUrl(url)
	if (type !== 'moment' || !id) return null
	
	return momentDataCache.value.get(id) || null
}

// 投稿一覧からブログ/モーメントデータを取得
const loadBlogAndMomentData = async (): Promise<void> => {
	const blogIds = new Set<string>()
	const momentIds = new Set<string>()
	
	// 投稿一覧からURLを解析してIDを収集
	for (const post of boardStore.articlePosts) {
		if (post.blogUrl) {
			const { type, id } = extractIdFromUrl(post.blogUrl)
			if (type === 'blog' && id) {
				blogIds.add(id)
			} else if (type === 'moment' && id) {
				momentIds.add(id)
			}
		}
	}
	
	// ブログデータを取得
	for (const blogId of blogIds) {
		if (!blogDataCache.value.has(blogId)) {
			try {
				await blogStore.getDetail(blogId)
				const blogData = blogStore.blogDetail
				if (blogData && blogData.id) {
					blogDataCache.value.set(blogId, blogData)
					// 設定も取得
					if (blogData.setting) {
						blogSettingCache.value.set(blogId, blogData.setting)
					} else if (blogData.uid) {
						try {
							const setting = await blogSettingStore.getForUid(blogData.uid)
							if (setting) {
								blogSettingCache.value.set(blogId, setting)
							} else {
								// 設定が取得できない場合、デフォルト値を設定
								blogSettingCache.value.set(blogId, {
									name: '名無し',
									profileUrl: null
								})
							}
						} catch (settingError) {
							console.error(`ブログ設定 ${blogId} の取得エラー:`, settingError)
							// エラー時もデフォルト値を設定
							blogSettingCache.value.set(blogId, {
								name: '名無し',
								profileUrl: null
							})
						}
					} else {
						// uidがない場合もデフォルト値を設定
						blogSettingCache.value.set(blogId, {
							name: '名無し',
							profileUrl: null
						})
					}
				}
			} catch (error) {
				console.error(`ブログ ${blogId} の取得エラー:`, error)
			}
		}
	}
	
	// モーメントデータを取得
	for (const momentId of momentIds) {
		if (!momentDataCache.value.has(momentId)) {
			try {
				await momentStore.getDetail(momentId)
				const momentData = momentStore.momentDetail
				if (momentData && momentData.id) {
					// settingが存在しない場合、デフォルト値を設定
					if (!momentData.setting) {
						if (momentData.uid) {
							try {
								const setting = await blogSettingStore.getForUid(momentData.uid)
								if (setting) {
									momentData.setting = {
										name: setting.name || setting.title || '名無し',
										profileUrl: setting.profileUrl || null
									}
								} else {
									momentData.setting = {
										name: '名無し',
										profileUrl: null
									}
								}
							} catch (settingError) {
								console.error(`モーメント設定 ${momentId} の取得エラー:`, settingError)
								momentData.setting = {
									name: '名無し',
									profileUrl: null
								}
							}
						} else {
							momentData.setting = {
								name: '名無し',
								profileUrl: null
							}
						}
					}
					// tweetsが空の場合、空配列を設定
					if (!momentData.tweets) {
						momentData.tweets = []
					}
					// 必須フィールドのデフォルト値を設定
					if (!momentData.like_count) {
						momentData.like_count = 0
					}
					if (momentData.is_like === undefined) {
						momentData.is_like = false
					}
					if (momentData.is_bookmark === undefined) {
						momentData.is_bookmark = false
					}
					if (!momentData.viewCount) {
						momentData.viewCount = 0
					}
					momentDataCache.value.set(momentId, momentData)
				}
			} catch (error) {
				console.error(`モーメント ${momentId} の取得エラー:`, error)
			}
		}
	}
}

const articleForm = ref({
	title: '',
	content: '',
	blogUrl: ''
})

const chatForm = ref({
	content: ''
})

const articleFormRef = ref<any>(null)
const chatFormRef = ref<any>(null)

// ダイアログを閉じる
const closeArticleDialog = (): void => {
	if (articleDialogRef.value) {
		articleDialogRef.value.closeDialog()
	}
	// フォームをリセット
	articleForm.value = {
		title: '',
		content: '',
		blogUrl: ''
	}
}

const closeChatDialog = (): void => {
	if (chatDialogRef.value) {
		chatDialogRef.value.closeDialog()
	}
	// フォームをリセット
	chatForm.value.content = ''
}

// バリデーションルール
const articleRules = {
	title: [
		(v: string) => !!v || 'タイトルは必須です',
		(v: string) => (v && v.length <= 100) || 'タイトルは100文字以内で入力してください'
	],
	content: [
		(v: string) => !!v || '紹介文は必須です',
		(v: string) => (v && v.length <= 500) || '紹介文は500文字以内で入力してください'
	],
	url: [
		(v: string | null | undefined) => {
			if (!v || v.trim() === '') return true
			// http:// または https:// で始まるURLを許可（localhostも許可）
			const urlPattern = /^(http|https):\/\/(localhost|.+\..+)/
			return urlPattern.test(v) || '正しいURL形式で入力してください（http:// または https:// で始まる必要があります）'
		}
	]
}

const chatRules = {
	content: [
		(v: string) => !!v || 'メッセージは必須です',
		(v: string) => (v && v.length <= 500) || 'メッセージは500文字以内で入力してください'
	]
}

// 日付フォーマット
const formatDate = (date: Date | null): string => {
	if (!date) return ''
	return format(new Date(date), 'yyyy年MM月dd日 HH:mm', { locale: ja })
}

// 記事紹介投稿を送信
const submitArticlePost = async (): Promise<void> => {
	if (articleFormRef.value) {
		const { valid } = await articleFormRef.value.validate()
		if (!valid) return
	}

	try {
		isSubmitting.value = true
		await boardStore.createArticlePost({
			type: 'article',
			title: articleForm.value.title,
			content: articleForm.value.content,
			blogUrl: articleForm.value.blogUrl || null
		})

		// ダイアログを閉じる
		closeArticleDialog()

		await Swal.fire({
			title: '投稿しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false,
			confirmButtonColor: '#27C1A3',
		})
	} catch (error: any) {
		console.error('記事紹介投稿エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: error.message || '投稿に失敗しました',
			icon: 'error'
		})
	} finally {
		isSubmitting.value = false
	}
}

// 雑談投稿を送信
const submitChatPost = async (): Promise<void> => {
	if (chatFormRef.value) {
		const { valid } = await chatFormRef.value.validate()
		if (!valid) return
	}

	try {
		isSubmitting.value = true
		await boardStore.createChatPost(chatForm.value.content)

		// ダイアログを閉じる
		closeChatDialog()

		await Swal.fire({
			title: '投稿しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false,
			confirmButtonColor: '#27C1A3',
		})
	} catch (error: any) {
		console.error('雑談投稿エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: error.message || '投稿に失敗しました',
			icon: 'error'
		})
	} finally {
		isSubmitting.value = false
	}
}

// 記事紹介投稿を削除
const deleteArticlePost = async (postId: string): Promise<void> => {
	const result = await Swal.fire({
		title: '削除しますか？',
		text: 'この投稿を削除しますか？',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#d33',
		cancelButtonColor: '#6c757d',
		confirmButtonText: '削除する',
		cancelButtonText: 'キャンセル'
	})

	if (result.isConfirmed) {
		try {
			await boardStore.deletePost(postId, 'article')
			await Swal.fire({
				title: '削除しました',
				icon: 'success',
				timer: 1500,
				showConfirmButton: false,
				confirmButtonColor: '#27C1A3',
			})
		} catch (error: any) {
			console.error('削除エラー:', error)
			await Swal.fire({
				title: 'エラー',
				text: error.message || '削除に失敗しました',
				icon: 'error'
			})
		}
	}
}

// 雑談投稿を削除
const deleteChatPost = async (postId: string): Promise<void> => {
	const result = await Swal.fire({
		title: '削除しますか？',
		text: 'この投稿を削除しますか？',
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#d33',
		cancelButtonColor: '#6c757d',
		confirmButtonText: '削除する',
		cancelButtonText: 'キャンセル'
	})

	if (result.isConfirmed) {
		try {
			await boardStore.deletePost(postId, 'chat')
			await Swal.fire({
				title: '削除しました',
				icon: 'success',
				timer: 1500,
				showConfirmButton: false,
				confirmButtonColor: '#27C1A3',
			})
		} catch (error: any) {
			console.error('削除エラー:', error)
			await Swal.fire({
				title: 'エラー',
				text: error.message || '削除に失敗しました',
				icon: 'error'
			})
		}
	}
}

// タブ変更時にデータを取得
watch(activeTab, async (newTab) => {
	if (newTab === 'article') {
		await boardStore.getArticlePosts()
		await loadBlogAndMomentData()
	} else if (newTab === 'chat') {
		await boardStore.getChatPosts()
	}
}, { immediate: true })

// 記事投稿一覧の変更を監視して、データを再取得
watch(() => boardStore.articlePosts, async () => {
	if (activeTab.value === 'article') {
		await loadBlogAndMomentData()
	}
}, { deep: true })

// コンポーネントマウント時にデータを取得
onMounted(async () => {
	await boardStore.getArticlePosts()
	await loadBlogAndMomentData()
	
	// URLパラメータから投稿情報を取得
	const urlParam = route.query.url as string
	const titleParam = route.query.title as string
	
	if (urlParam && authStore.isLogin) {
		// 記事紹介タブを開く
		activeTab.value = 'article'
		
		// フォームに値を設定
		articleForm.value.blogUrl = urlParam
		if (titleParam) {
			articleForm.value.title = titleParam
		}
		
		// ダイアログを開く
		isArticleDialog.value = true
		
		// URLパラメータをクリア
		router.replace({ path: '/board', query: {} })
	}
})
</script>

<style scoped>
.v-list-item {
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>

