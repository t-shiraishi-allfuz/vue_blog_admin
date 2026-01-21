<template>
	<!-- 生年月日入力ダイアログ -->
	<BirthDateDialog 
		v-model:dialog="isBirthDateDialog" 
		@saved="onBirthDateSaved"
	/>

	<LoginDialog 
		v-model:dialog="isLoginDialog"
		@open-user-create="isUserCreateDialog = true"
	/>

	<!-- ユーザー登録ダイアログ -->
	<UserCreateDialog 
		v-model:dialog="isUserCreateDialog"
		@open-login="isLoginDialog = true"
	/>

	<!-- パスワード再設定ダイアログ -->
	<ResetPasswordConfirmDialog 
		v-model:dialog="isResetPasswordConfirmDialog"
		@open-login="isLoginDialog = true"
	/>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="パスワード認証"
		v-model:dialog="isPasswordDialog"
		:persistent="true"
	>
		<template v-slot:contents>
			<v-card-text>
				<p class="text-body-1 mb-4">このモーメントはパスワードで保護されています。</p>
				<v-text-field
					v-model="passwordInput"
					label="パスワード"
					type="password"
					variant="outlined"
					:error-messages="passwordError"
					@keyup.enter="verifyPassword"
					autofocus
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="grey-lighten-4"
					variant="flat"
					@click="closeDialog"
				>
					閉じる
				</v-btn>
				<v-btn
					color="success"
					variant="flat"
					@click="verifyPassword"
					:loading="passwordVerifying"
				>
					認証
				</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>

	<!-- タブ切り替え -->
	<v-tabs v-model="activeTab" color="success" class="mb-4">
		<v-tab value="blogs">
			<v-icon start icon="mdi-post" />
			ブログ記事
		</v-tab>
		<v-tab value="tweets">
			<v-icon start icon="mdi-note" />
			つぶやき
		</v-tab>
		<v-tab value="moments">
			<v-icon start icon="mdi-note-multiple" />
			モーメント
		</v-tab>
	</v-tabs>

	<v-window v-model="activeTab">
		<!-- ブログ記事タブ -->
		<v-window-item
			value="blogs"
			transition="none"
			reverse-transition="none"
		>
			<v-row class="horizontal-scroll" no-gutters>
				<v-slide-group v-if="extendBlogList.length > 0" show-arrows>
					<v-slide-group-item
						v-for="(item, index) in extendBlogList"
						:key="index"
					>
						<v-card
							class="blog-card d-inline-block"
							@click="goToBlogDetail(item)"
							outlined
							height="280"
							@contextmenu.prevent="copyBlogUrl(item)"
						>
							<v-img
								:src="item.thumbUrl || '/placeholder-image.png'"
								width="200"
								height="150"
								position="top"
								aspect-ratio="16/9"
								cover
							/>
							<v-card-text class="d-flex flex-column" style="height: 60px;">
								<div class="d-flex align-center gap-1">
									<strong class="text-h6">{{ item.title }}</strong>
									<v-icon 
										v-if="item.isAdult || item.password" 
										size="small" 
										color="warning"
										icon="mdi-lock"
									/>
								</div>
								<div class="chip-container" style="min-height: 10px;">
									<v-chip 
										v-if="item.isAdult" 
										size="x-small" 
										color="warning"
									>
										18歳以上向け
									</v-chip>
								</div>
							</v-card-text>
							<v-card-actions>
								<div class="d-flex">
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-btn
											:icon="formatLike(item)"
											:color="colorIconPink(item)"
											variant="text"
											@click.stop="addLike(item)"
										/>
										<div class="text-truncate">{{ item.like_count }}</div>
									</div>
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-btn
											:icon="formatBookmark(item)"
											:color="colorIconPrimary(item)"
											variant="text"
											@click.stop="addBookmark(item)"
										/>
									</div>
								</div>
							</v-card-actions>
						</v-card>
					</v-slide-group-item>
				</v-slide-group>
				<v-alert type="info" v-else>
					ブログがありません
				</v-alert>
			</v-row>
		</v-window-item>

		<!-- つぶやきタブ -->
		<v-window-item
			value="tweets"
			transition="none"
			reverse-transition="none"
		>
			<v-row class="horizontal-scroll" no-gutters>
				<v-slide-group v-if="extendTweetList.length > 0" show-arrows>
					<v-slide-group-item
						v-for="(item, index) in extendTweetList"
						:key="index"
					>
						<v-card
							class="blog-card d-inline-block"
							@click="openPreviewTweetDialog(item)"
							outlined
							height="280"
						>
							<v-img
								:src="item.thumbUrl || '/placeholder-image.png'"
								width="200"
								height="150"
								position="top"
								aspect-ratio="16/9"
								cover
							/>
							<v-card-text class="d-flex flex-column" style="height: 60px;">
								<strong class="text-h6">{{ truncateContent(item.content) }}</strong>
							</v-card-text>
							<v-card-actions>
								<div class="d-flex">
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-btn
											:icon="formatLike(item)"
											:color="colorIconPink(item)"
											variant="text"
											@click.stop="addTweetLike(item)"
										/>
										<div class="text-truncate">{{ item.like_count }}</div>
									</div>
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-btn
											:icon="formatBookmark(item)"
											:color="colorIconPrimary(item)"
											variant="text"
											@click.stop="addMomentBookmark(item)"
										/>
									</div>
								</div>
							</v-card-actions>
						</v-card>
					</v-slide-group-item>
				</v-slide-group>
				<v-alert type="info" v-else>
					つぶやきがありません
				</v-alert>
			</v-row>
			<TweetCard
				v-if="tweetToPreview"
				v-model="isPreviewTweetDialog"
				:tweet="tweetToPreview"
				:setting="tweetToPreview.setting"
			/>
		</v-window-item>

		<v-window-item
			value="moments"
			transition="none"
			reverse-transition="none"
		>
			<v-row class="horizontal-scroll" no-gutters>
				<v-slide-group v-if="extendMomentList.length > 0" show-arrows>
					<v-slide-group-item
						v-for="(item, index) in extendMomentList"
						:key="index"
					>
						<v-card
							class="blog-card d-inline-block"
							@click="openPreviewMomentDialog(item)"
							outlined
							height="280"
							@contextmenu.prevent="copyMomentUrl(item)"
						>
							<v-img
								:src="item.thumbUrl || '/placeholder-image.png'"
								width="200"
								height="150"
								position="top"
								aspect-ratio="16/9"
								cover
							/>
							<v-card-text class="d-flex flex-column" style="height: 60px;">
								<strong class="text-h6">{{ truncateContent(item.title) }}</strong>
								<div class="chip-container" style="min-height: 10px;">
									<v-chip 
										v-if="item.isAdult" 
										size="x-small" 
										color="warning"
									>
										18歳以上向け
									</v-chip>
								</div>
							</v-card-text>
							<v-card-actions>
								<div class="d-flex">
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-btn
											:icon="formatLike(item)"
											:color="colorIconPink(item)"
											variant="text"
											@click.stop="addMomentLike(item)"
										/>
										<div class="text-truncate">{{ item.like_count }}</div>
									</div>
									<div class="d-flex align-center text-caption text-medium-emphasis me-1">
										<v-btn
											:icon="formatBookmark(item)"
											:color="colorIconPrimary(item)"
											variant="text"
											@click.stop="addMomentBookmark(item)"
										/>
									</div>
								</div>
							</v-card-actions>
						</v-card>
					</v-slide-group-item>
				</v-slide-group>
				<v-alert type="info" v-else>
					モーメントがありません
				</v-alert>
			</v-row>
			<MomentCard
				v-if="momentToPreview"
				v-model="isPreviewMomentDialog"
				:moment="momentToPreview"
			/>
		</v-window-item>
	</v-window>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useBlogStore } from '@/stores/blogStore'
import { useTweetStore } from '@/stores/tweetStore'
import { useMomentStore } from '@/stores/momentStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useUsersStore } from '@/stores/usersStore'
import { useAuthStore } from '@/stores/authStore'
import { useSearchStore } from '@/stores/searchStore'

// 型定義
interface BlogItem {
	id: string
	title: string
	thumbUrl: string | null
	isAdult: boolean
	is_like: boolean
	is_bookmark: boolean
	like_count: number
	uid: string
	password: string | null
}

interface TweetItem {
	id: string
	content: string
	thumbUrl: string
	createdAt: Date | null
	is_like: boolean
	like_count: number
	uid: string
}

interface MomentItem {
	id: string
	uid: string
	title: string
	description: string
	thumbUrl: string
	tweetIds: string[]
	tweets: any[]
	isAdult: boolean
	isPublished: boolean
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
	setting: any
	like_count: number
	is_like: boolean
	is_bookmark: boolean
	password: string | null
}

interface UserData {
	uid: string
	birthDate?: string
	[key: string]: any
}

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const tweetStore = useTweetStore()
const momentStore = useMomentStore()
const likeStore = useLikeStore()
const bookmarkStore = useBookmarkStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()
const searchStore = useSearchStore()
const {
	blogList,
	selectType
} = storeToRefs(blogStore)

const {
	tweetList
} = storeToRefs(tweetStore)

const {
	momentList
} = storeToRefs(momentStore)

const activeTab = ref('blogs')
const isBirthDateDialog = ref<boolean>(false)
const isLoginDialog = ref<boolean>(false)
const isUserCreateDialog = ref<boolean>(false)
const userData = ref<UserData | null>(null)
const isUserAdult = ref<boolean>(false)
const tweetToPreview = ref<any>(null)
const isPreviewTweetDialog = ref<boolean>(false)
const momentToPreview = ref<any>(null)
const isPreviewMomentDialog = ref<boolean>(false)
const dialogTemplateRef = ref<any>(null)

// 検索関連
const searchQuery = ref<string>("")
const searchBlogIds = ref<string[]>([])
const searchTweetIds = ref<string[]>([])
const searchMomentIds = ref<string[]>([])

// パスワード認証関連
const isPasswordDialog = ref<boolean>(false)
const isResetPasswordConfirmDialog = ref<boolean>(false)
const passwordInput = ref<string>("")
const passwordError = ref<string>("")
const passwordVerifying = ref<boolean>(false)

const initRefs = (): void => {
	passwordInput.value = ""
	passwordError.value = ""
	momentToPreview.value = null
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

const extendBlogList = computed((): BlogItem[] => {
	if (!blogList.value) {
		return []
	}
	
	// 閲覧制限フィルタリング
	let filtered = blogList.value.filter((blog: BlogItem) => {
		// 閲覧制限がないブログは常に表示
		if (!blog.isAdult) {
			return true
		}
		
		// 閲覧制限があるブログの場合、ユーザーの年齢をチェック
		// ログインしていない場合は表示しない
		if (!authStore.isLogin) {
			return false
		}
		
		// ユーザーの年齢をチェック
		return isUserAdult.value
	})
	
	// 検索クエリがある場合、検索結果でフィルタリング
	if (searchQuery.value && searchBlogIds.value.length > 0) {
		filtered = filtered.filter((blog: BlogItem) => searchBlogIds.value.includes(blog.id))
	}
	
	return filtered
})

const extendTweetList = computed((): any[] => {
	if (!tweetList.value) {
		return []
	}
	
	let filtered = tweetList.value
	
	// 検索クエリがある場合、検索結果でフィルタリング
	if (searchQuery.value && searchTweetIds.value.length > 0) {
		filtered = filtered.filter((tweet: any) => searchTweetIds.value.includes(tweet.id))
	}
	
	return filtered
})

const extendMomentList = computed((): MomentItem[] => {
	if (!momentList.value) {
		return []
	}
	
	// 閲覧制限フィルタリング
	let filtered = momentList.value.filter((moment: MomentItem) => {
		// 閲覧制限がないモーメントは常に表示
		if (!moment.isAdult) {
			return true
		}
		
		// 閲覧制限があるモーメントの場合、ユーザーの年齢をチェック
		// ログインしていない場合は表示しない
		if (!authStore.isLogin) {
			return false
		}
		
		// ユーザーの年齢をチェック
		return isUserAdult.value
	})
	
	// 検索クエリがある場合、検索結果でフィルタリング
	if (searchQuery.value && searchMomentIds.value.length > 0) {
		filtered = filtered.filter((moment: MomentItem) => searchMomentIds.value.includes(moment.id))
	}
	
	return filtered
})

// 一覧取得
const fetchBlogList = async (type: number): Promise<void> => {
	// カテゴリーIDがクエリパラメータにある場合は、カテゴリーでフィルタリング
	const categoryId = route.query.category_id as string
	if (categoryId) {
		await blogStore.getListForCategory(categoryId)
		return
	}
	
	switch (+type) {
		case 1:
			await blogStore.getListForFollow()
			break
		case 2:
			await blogStore.getListForBookmark()
			break
		case 3:
			await blogStore.getListForRecomend()
			break
		default:
			await blogStore.getListForAll()
			break
	}
}

// つぶやき一覧取得
const fetchTweetList = async (): Promise<void> => {
	await tweetStore.getListForAll()
}

// モーメント一覧取得
const fetchMomentList = async (): Promise<void> => {
	await momentStore.getListForAll()
}

// アイコン設定
const formatLike = (item: any): string => {
	return item.is_like ? "mdi-heart" : "mdi-heart-outline"
}
const formatBookmark = (item: any): string => {
	return item.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
}

// アイコン設定（カラー）
const colorIconPink = (item: any): string => {
	return item.is_like ? "pink" : "black"
}
const colorIconPrimary = (item: any): string => {
	return item.is_bookmark ? "blue" : "black"
}

// 詳細ページに移動
const goToBlogDetail = (blog: BlogItem): void => {
	router.push({path: "/blog_detail", query: {blog_id: blog.id}})
}

// プレビューダイアログを開く
const openPreviewTweetDialog = (tweet: any) => {
	tweetToPreview.value = tweet
	isPreviewTweetDialog.value = true
}

const openPreviewMomentDialog = (moment: any) => {
	momentToPreview.value = moment

	if (moment.password) {
		isPasswordDialog.value = true
		passwordInput.value = ""
		passwordError.value = ""
	} else {
		isPreviewMomentDialog.value = true
	}
}

// パスワード認証
const verifyPassword = async () => {
	if (!passwordInput.value.trim()) {
		passwordError.value = "パスワードを入力してください"
		return
	}

	passwordVerifying.value = true
	passwordError.value = ""

	try {
		const isValid = await momentStore.verifyPassword(momentToPreview.value.id, passwordInput.value)
		if (isValid) {
			// 認証成功時したら開く
			isPasswordDialog.value = false
			passwordInput.value = ""
			isPreviewMomentDialog.value = true
		} else {
			passwordError.value = "パスワードが正しくありません"
		}
	} catch (error) {
		console.error("パスワード認証エラー:", error)
		passwordError.value = "認証に失敗しました"
		momentToPreview.value = null
	} finally {
		passwordVerifying.value = false
	}
}

// いいね
const addLike = async (blog: BlogItem): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	
	if (blog.is_like) {
		await likeStore.deleteItem(blog.id)
		blog.is_like = false
		blog.like_count--
	} else {
		await likeStore.create(blog.id, blog.title, blog.uid)
		blog.is_like = true
		blog.like_count++
	}
	await fetchBlogList(selectType.value)
}

// お気に入り登録
const addBookmark = async (blog: BlogItem): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	
	if (blog.is_bookmark) {
		await bookmarkStore.deleteItem(blog.id)
		blog.is_bookmark = false
	} else {
		await bookmarkStore.create(blog.id)
		blog.is_bookmark = true
	}
	await fetchBlogList(selectType.value)
}

// つぶやきのいいね
const addTweetLike = async (tweet: TweetItem): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	
	if (tweet.is_like) {
		await likeStore.deleteItem(tweet.id)
		tweet.is_like = false
		tweet.like_count--
	} else {
		await likeStore.create(tweet.id, tweet.content, tweet.uid)
		tweet.is_like = true
		tweet.like_count++
	}
	await fetchTweetList()
}

// モーメントのいいね
const addMomentLike = async (moment: MomentItem): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	
	try {
		await momentStore.toggleLike(moment)
		await fetchMomentList()
	} catch (error) {
		console.error("モーメントいいねエラー:", error)
	}
}

// モーメントのブックマーク
const addMomentBookmark = async (moment: MomentItem): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	
	try {
		await momentStore.toggleBookmark(moment)
		await fetchMomentList()
	} catch (error) {
		console.error("モーメントブックマークエラー:", error)
	}
}

// つぶやき内容を切り詰める関数
const truncateContent = (content: string): string => {
	if (!content) return ""
	if (content.length <= 10) return content
	return content.substring(0, 10) + "..."
}

watch(() => blogStore.selectType, async (newType: number) => {
	await fetchBlogList(newType)
})

// 生年月日登録後の処理
const onBirthDateSaved = async (): Promise<void> => {
	// ユーザー情報を再取得
	await loadUserData()
	// ブログ一覧を再取得
	await fetchBlogList(selectType.value)
}

// ユーザー情報を取得して年齢チェック
const loadUserData = async (): Promise<void> => {
	if (!authStore.isLogin || !authStore.userInfo) return
	
	try {
		const userInfo = authStore.userInfo as { uid: string }
		const data = await usersStore.getUserByUid(userInfo.uid)
		userData.value = data as UserData | null
		
		if (data && data.birthDate) {
			isUserAdult.value = usersStore.isAdult(data.birthDate)
		} else {
			isUserAdult.value = false
		}
	} catch (error) {
		console.error('ユーザー情報取得エラー:', error)
	}
}

// 生年月日未登録チェック
const checkBirthDateRegistration = async (): Promise<void> => {
	if (!authStore.isLogin) return
	
	await loadUserData()
	
	if (!userData.value || !userData.value.birthDate) {
		isBirthDateDialog.value = true
	}
}

// 検索実行
const executeSearch = async (query: string): Promise<void> => {
	searchQuery.value = query.trim()
	
	if (searchQuery.value) {
		const result = await searchStore.searchForBlogList(searchQuery.value)
		searchBlogIds.value = result.blogIds
		searchTweetIds.value = result.tweetIds
		searchMomentIds.value = result.momentIds
	} else {
		searchBlogIds.value = []
		searchTweetIds.value = []
		searchMomentIds.value = []
	}
}

// ブログURLをコピー
const copyBlogUrl = async (blog: BlogItem): Promise<void> => {
	try {
		const blogUrl = `${window.location.origin}/blog_detail?blog_id=${blog.id}`
		await navigator.clipboard.writeText(blogUrl)

		// 成功メッセージを表示（簡易的な方法）
		const toast = document.createElement('div')
		toast.textContent = 'URLをコピーしました'
		toast.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background-color: #4caf50;
			color: white;
			padding: 12px 24px;
			border-radius: 4px;
			z-index: 10000;
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
		`
		document.body.appendChild(toast)
		setTimeout(() => {
			document.body.removeChild(toast)
		}, 2000)
	} catch (error) {
		console.error('URLコピーエラー:', error)
	}
}

// モーメントURLをコピー
const copyMomentUrl = async (moment: MomentItem): Promise<void> => {
	try {
		const momentUrl = `${window.location.origin}/?moment_id=${moment.id}`
		await navigator.clipboard.writeText(momentUrl)

		// 成功メッセージを表示（簡易的な方法）
		const toast = document.createElement('div')
		toast.textContent = 'URLをコピーしました'
		toast.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background-color: #4caf50;
			color: white;
			padding: 12px 24px;
			border-radius: 4px;
			z-index: 10000;
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
		`
		document.body.appendChild(toast)
		setTimeout(() => {
			document.body.removeChild(toast)
		}, 2000)
	} catch (error) {
		console.error('URLコピーエラー:', error)
	}
}

// 初回ロード
onMounted(async (): Promise<void> => {
	await fetchBlogList(selectType.value)
	await fetchTweetList()
	await fetchMomentList()
	await checkBirthDateRegistration()
	
	// ルートクエリパラメータから検索クエリを取得
	const query = route.query.q as string
	if (query) {
		searchQuery.value = query
		await executeSearch(query)
	}
	
	// カテゴリーIDの処理はwatchで監視するため、ここでは通常の一覧取得のみ
	// fetchBlogList内でcategory_idをチェックしているため、ここでも正常に動作する
})

// ルートクエリパラメータの変化を監視
watch(() => route.query.q, async (newQuery) => {
	if (newQuery) {
		searchQuery.value = newQuery as string
		await executeSearch(newQuery as string)
	} else {
		searchQuery.value = ''
		searchBlogIds.value = []
		searchTweetIds.value = []
		searchMomentIds.value = []
	}
})

// カテゴリーIDの変化を監視
watch(() => route.query.category_id, async (categoryId) => {
	if (categoryId) {
		await fetchBlogList(selectType.value)
	} else {
		// カテゴリーIDが削除された場合は、通常の一覧を取得
		await fetchBlogList(selectType.value)
	}
})

// URLパラメータにoobCodeがある場合、ダイアログを自動表示
watch(() => route.query.oobCode, (oobCode) => {
	if (oobCode) {
		isResetPasswordConfirmDialog.value = true
		// URLからoobCodeパラメータを削除（ダイアログコンポーネント内でも処理されるが、念のため）
		const newQuery = { ...route.query }
		delete newQuery.oobCode
		router.replace({ query: newQuery })
	}
}, { immediate: true })
</script>

<style scoped>
.horizontal-scroll {
	max-width: 1100px;
	overflow-x: auto;
	white-space: nowrap;
}
.blog-card {
	min-width: 200px;
	width: 200px;
	height: 280px;
	margin: 10px;
	display: flex;
	flex-direction: column;

	img {
		width: 100%;
		height: auto;
		object-position: top;
	}

	.v-responsive {
		min-width: 100%;
		min-height: 150px;
		max-height: 150px;
	}

	.v-card-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.chip-container {
		display: flex;
		align-items: center;
	}
}
</style>
