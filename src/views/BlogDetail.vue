<template>
	<LoginDialog 
		v-model:dialog="isLoginDialog"
		@open-user-create="isUserCreateDialog = true"
	/>

	<UserCreateDialog 
		v-model:dialog="isUserCreateDialog"
		@open-login="isLoginDialog = true"
	/>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="コメント"
		v-model:dialog="isCommentDialog"
	>
		<template v-slot:contents>
			<v-list>
				<v-list-item>
					<v-textarea
						label="コメント"
						type="string"
						v-model="comment.body"
						solo
					/>
				</v-list-item>
				<v-divider />
				<div class="d-flex justify-end my-2">
					<v-btn
						class="mx-2"
						color="grey-lighten-2"
						@click="closeDialog"
					>
						閉じる
					</v-btn>
					<v-btn
						class="mx-2"
						color="success"
						@click="executeComment"
					>
						コメント
					</v-btn>
				</div>
			</v-list>
		</template>
	</DialogTemplate>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="パスワード認証"
		:persistent="true"
		v-model:dialog="isPasswordDialog"
	>
		<template v-slot:contents>
			<v-card-text>
				<p class="text-body-1 mb-4">このブログはパスワードで保護されています。</p>
				<v-text-field
					v-model="passwordInput"
					label="パスワード"
					type="password"
					variant="outlined"
					@keyup.enter="verifyPassword"
					autofocus
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn
					color="grey-lighten-4"
					variant="flat"
					@click="cancelPasswordAuth"
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

	<v-dialog v-model="isShareDialog" max-width="500px">
		<v-list>
			<v-list-item
				prepend-icon="mdi-link-variant"
				title="リンクをコピー"
				value="copy"
				@click="copyUrl"
			/>
			<v-divider />
			<v-list-item
				prepend-icon="mdi-twitter"
				title="Xでシェア"
				@click="handleXShare"
			/>
			<ShareNetwork
				ref="shareNetworkRef"
				network="twitter"
				:url="blogShareUrl"
				:title="blogShareTitle"
				:hashtags="blogShareHashtags"
				style="display: none;"
				@open="onShareOpen"
			/>
			<v-divider />
			<v-list-item
				prepend-icon="mdi-bulletin-board"
				title="掲示板に投稿"
				@click="postToBoard"
			/>
			<v-divider />
			<div class="d-flex justify-end my-2">
				<v-btn
					class="mx-2"
					color="grey-lighten-2"
					@click="isShareDialog = false"
				>
					閉じる
				</v-btn>
			</div>
		</v-list>
	</v-dialog>

	<v-sheet
		v-if="isLoading"
		class="pa-6 mx-auto"
		border="md"
		max-width="800"
	>
		<div class="header-image mb-4" v-if="blogDetail.thumbUrl">
			<img
				:src="blogDetail.thumbUrl"
				aspect-ratio="16/9"
				cover
			/>
		</div>
		<h4 class="text-h5 font-weight-bold mb-4">{{ blogDetail.title }}</h4>
		<div class="mb-4 text-body-3">{{ blogDetail.summary }}</div>
		<div class="mb-4 d-flex">
			<v-row>
				<v-avatar
					class="mt-2"
					size="48"
					:image="blogDetail.setting?.profileUrl || '/default-avatar.png'"
					end
				/>
				<v-col cols="3">
					<div class="ml-1 mb-1">
						{{ blogDetail.setting?.name || 'ユーザー名不明' }}
					</div>
					<div class="ml-1 mb-1">
						<v-icon icon="mdi-clock" start />
						{{ formatDate(blogDetail.createdAt) }}
					</div>
				</v-col>
				<div v-if="userInfo?.uid !== blogDetail.uid">
					<v-col>
						<div v-if="blogDetail.setting?.is_follower === true">
							<v-btn @click="deleteFollowUser">フォロー中</v-btn>
						</div>
						<div v-else-if="blogDetail.setting?.is_following === true">
							<v-btn @click="followUser">フォローバック</v-btn>
						</div>
						<div v-else>
							<v-btn @click="followUser">フォロー</v-btn>
						</div>
					</v-col>
				</div>
			</v-row>
		</div>
		<BlogCard
			v-if="blogDetail.shareBlog"
			class="mb-5"
			:blog="blogDetail.shareBlog as any"
			:setting="blogDetail.shareBlog.setting"
		/>
		<div class="mb-4 text-body-1" v-html="blogDetail.content"></div>
		<div class="d-flex">
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatLike"
					:color="colorIconPink('like')"
					variant="text"
					@click="addLike"
				/>
				<div class="text-truncate">{{ blogDetail.like_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-eye"
					color="grey-lighten-4"
					variant="text"
				/>
				<div class="text-truncate">{{ blogDetail.viewCount || 0 }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-share-outline"
					color="black"
					variant="text"
					@click="addShare"
				/>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatComment"
					:color="colorIconPink('comment')"
					variant="text"
					@click="addComment"
				/>
				<div class="text-truncate">{{ blogDetail.comment_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatBookmark"
					:color="colorIconPrimary"
					variant="text"
					@click="addBookmark"
				/>
			</div>
		</div>
		<!-- カテゴリー -->
		<v-card v-if="currentCategory" class="mt-8">
			<v-card-title>
				<v-icon class="mr-2">mdi-tag</v-icon>
				カテゴリー
			</v-card-title>
			<v-card-text>
				<v-chip
					:color="'primary'"
					variant="flat"
					class="cursor-pointer"
					@click="selectCategory(currentCategory.id)"
				>
					{{ currentCategory.name }}
				</v-chip>
			</v-card-text>
		</v-card>
		<v-divider />
		<div class="my-4">
			<div class="pa-4">
				コメント数&nbsp;{{ blogDetail.comment_count }}
				<v-divider />
				<v-btn
					class="mt-2"
					color="success"
					variant="flat"
					@click="addComment()"
				>
					コメントする
				</v-btn>
			</div>
			<div v-if="commentList.length > 0">
				<div v-for="(comment, index) in commentList" :key="index">
					<div class="pa-4 mb-4">
						<v-row class="d-flex">
							<v-avatar
								class="mt-2"
								size="48"
								:image="comment.setting?.profileUrl || '/default-avatar.png'"
								end
							/>
							<v-col>
								<div class="ml-1 mb-1">
									{{ comment.setting?.name || 'ユーザー名不明' }}
								</div>
								<div class="ml-1 mb-1">
									<v-icon icon="mdi-clock" start />
									{{ formatDate(comment.createdAt) }}
								</div>
								<div class="ml-1 mb-1">
									<div v-if="comment.reply_id">
										<div class="pa-4 mb-2 bg-pink-lighten-5 rounded">
											<v-icon icon="mdi-message-reply-text" start />
											<div v-html="comment.reply?.body?.replace(/\n/g, '<br>') || ''"></div>
										</div>
									</div>
									<div v-html="(comment.body || '').replace(/\n/g, '<br>')"></div>
								</div>
							</v-col>
							<v-col>
								<v-row class="d-flex justify-end ma-2">
									<div class="mx-2">
										<v-icon
											icon="mdi-reply-outline"
											start
											@click="replyComment(comment)"
										/>
									</div>
									<div class="mx-2">
										<v-icon
											icon="mdi-delete"
											start
											@click="deleteComment(comment)"
										/>
									</div>
								</v-row>
							</v-col>
						</v-row>
					</div>
				</div>
			</div>
			<div v-else>
				<div class="pa-4">
					コメントはありません
				</div>
			</div>
		</div>
		<v-divider />
		<v-card-actions>
			<v-btn @click="goBack">{{ backButtonText }}</v-btn>
		</v-card-actions>
	</v-sheet>
	<v-sheet v-if="!isLoading" class="pa-6 mx-auto text-center">
		<v-progress-circular indeterminate />
	</v-sheet>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useLikeStore } from '@/stores/likeStore'
import { useCommentStore } from '@/stores/commentStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useBlogCategoryStore } from '@/stores/blogCategoryStore'
import { format } from 'date-fns'
import { useHead } from '@unhead/vue'
import { ShareNetwork } from 'vue3-social-sharing'
import { AppSwal } from '@/utils/swal'

interface CommentData {
	id: string
	body: string
	createdAt: Date
	reply_id?: string
	reply?: {
		body: string
		[key: string]: any
	}
	setting?: {
		name: string
		profileUrl: string
		[key: string]: any
	}
	[key: string]: any
}

const route = useRoute()
const router = useRouter()

const blog_id = route.query.blog_id as string

const authStore = useAuthStore()
const blogStore = useBlogStore()
const likeStore = useLikeStore()
const commentStore = useCommentStore()
const bookmarkStore = useBookmarkStore()
const followUsersStore = useFollowUsersStore()
const blogCategoryStore = useBlogCategoryStore()

const {
	userInfo
} = storeToRefs(authStore)

const {
	blogDetail
} = storeToRefs(blogStore)

const {
	commentList
} = storeToRefs(commentStore)

const isLoading = ref<boolean>(false)
const isLoginDialog = ref<boolean>(false)
const isUserCreateDialog = ref<boolean>(false)
const isCommentDialog = ref<boolean>(false)
const isPasswordDialog = ref<boolean>(false)
const isShareDialog = ref<boolean>(false)
const dialogTemplateRef = ref<any>(null)

const reply_id = ref<string | null>(null)
const comment = ref<Partial<CommentData>>({
	uid: '',
	body: '',
	blog_id: '',
	reply_id: '',
	createdAt: new Date(),
	updatedAt: new Date(),
})

// パスワード認証関連
const passwordInput = ref<string>('')
const passwordVerifying = ref<boolean>(false)
const isPasswordVerified = ref<boolean>(false)

// カテゴリー関連
const currentCategory = ref<any>(null)
const isLoadingCategory = ref<boolean>(false)
const shareNetworkRef = ref<any>(null)

// シェア用のデータ
const blogShareUrl = computed(() => {
	return `${window.location.origin}/blog_detail?blog_id=${blogDetail.value.id}`
})

const blogShareTitle = computed(() => {
	return `${blogDetail.value.title}をシェアしました！`
})

const blogShareHashtags = computed(() => {
	return 'ブログ,シェア'
})

// useHeadをsetup内で呼び出して、シェア用のメタタグを管理
useHead({
	title: computed(() => blogDetail.value.title || 'ブログ記事'),
	meta: computed(() => [
		{ property: 'og:title', content: blogDetail.value.title || 'ブログ記事' },
		{ property: 'og:description', content: blogDetail.value.summary || '' },
		{ property: 'og:image', content: blogDetail.value.thumbUrl || '' },
		{ property: 'og:url', content: blogShareUrl.value },
		{ name: 'twitter:card', content: 'summary_large_image' },
		{ name: 'twitter:title', content: blogDetail.value.title || 'ブログ記事' },
		{ name: 'twitter:description', content: blogDetail.value.summary || '' },
		{ name: 'twitter:image', content: blogDetail.value.thumbUrl || '' },
	])
})

// 日時フォーマット関数
const formatDate = (date: Date | null): string => {
	if (!date) return '日付不明'
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// アイコン設定
const formatLike = computed((): string => {
	return blogDetail.value.is_like ? "mdi-heart" : "mdi-heart-outline"
})

const formatComment = computed((): string => {
	return blogDetail.value.comment_count > 0 ? "mdi-comment" : "mdi-comment-outline"
})

const formatBookmark = computed((): string => {
	return blogDetail.value.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
})

// アイコン設定（カラー）
const colorIconPink = computed(() => (type: string): string => {
	if (type === "like") {
		return blogDetail.value.is_like ? "pink" : "black"
	} else if (type === "comment") {
		return blogDetail.value.comment_count > 0 ? "pink" : "black"
	} else {
		return "black"
	}
})

const colorIconPrimary = computed((): string => {
	return blogDetail.value.is_bookmark ? "blue" : "black"
})

const initRefs = (): void => {
	isCommentDialog.value = false
	isPasswordDialog.value = false
	isShareDialog.value = false
	passwordInput.value = ''
	passwordError.value = ''
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

// いいね
const addLike = async (): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}

	if (blogDetail.value.is_like) {
		await likeStore.deleteItem(blogDetail.value.id)
		blogDetail.value.is_like = false
		blogDetail.value.like_count--
	} else {
		await likeStore.create(
			blogDetail.value.id,
			blogDetail.value.title,
			blogDetail.value.uid
		)
		blogDetail.value.is_like = true
		blogDetail.value.like_count++
	}
}

// シェア
const addShare = (): void => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	isShareDialog.value = true
}

// リンクをコピー
const copyUrl = async (): Promise<void> => {
	initRefs()

	try {
		await navigator.clipboard.writeText(window.location.href)
		AppSwal.fire({
			title: '成功',
			text: 'リンクをコピーしました',
			icon: 'success',
			timer: 1500,
		})
	} catch (error) {
		AppSwal.fire({
			title: 'エラー',
			text: 'リンクのコピーに失敗しました',
			icon: 'error'
		})
	}
}

// Xでシェア
const handleXShare = (): void => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}

	// ShareNetworkコンポーネントのクリックをトリガー
	if (shareNetworkRef.value) {
		shareNetworkRef.value.$el.click()
	}
	
	// シェアダイアログを閉じる
	isShareDialog.value = false
}

// シェアウィンドウが開いた時の処理
const onShareOpen = (): void => {
}

// 掲示板に投稿
const postToBoard = (): void => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}

	// ブログのURLを生成
	const blogUrl = `${window.location.origin}/blog_detail?blog_id=${blogDetail.value.id}`
	
	// 掲示板ページに遷移し、URLパラメータでURLを渡す
	router.push({
		path: '/board',
		query: {
			tab: 'article',
			url: blogUrl,
			title: blogDetail.value.title || ''
		}
	})
	
	// シェアダイアログを閉じる
	isShareDialog.value = false
}

// コメント
const addComment = (): void => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	isCommentDialog.value = true
}

const replyComment = (comment: CommentData): void => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	reply_id.value = comment.id
	isCommentDialog.value = true
}

const deleteComment = async (comment: CommentData): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}
	await commentStore.deleteItem(comment.id)
	await fetchCommentList()
	blogDetail.value.comment_count--
}

const executeComment = async (): Promise<void> => {
	if (!comment.value.body || !userInfo.value) return

	comment.value.uid = userInfo.value.uid
	comment.value.blog_id = blogDetail.value.id
	comment.value.createdAt = new Date()
	comment.value.updatedAt = new Date()

	if (reply_id.value) {
		comment.value.reply_id = reply_id.value
		reply_id.value = ''
	}

	await commentStore.create(
		comment.value,
		blogDetail.value.title,
		blogDetail.value.uid
	)
	await fetchCommentList()
	blogDetail.value.comment_count++

	isCommentDialog.value = false
}

const fetchCommentList = async (): Promise<void> => {
	try {
		await commentStore.getList(blogDetail.value.id)
	} catch (error) {
		console.error('コメントの取得に失敗しました:', error)
		AppSwal.fire({
			title: 'エラー',
			text: 'コメントの取得に失敗しました',
			icon: 'error'
		})
	}
}

// お気に入り登録
const addBookmark = async (): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}

	if (blogDetail.value.is_bookmark) {
		await bookmarkStore.deleteItem(blogDetail.value.id)
		blogDetail.value.is_bookmark = false
	} else {
		await bookmarkStore.create(blogDetail.value.id)
		blogDetail.value.is_bookmark = true
	}
}

// フォロー
const followUser = async (): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}

	if (!userInfo.value) return
	await followUsersStore.create(blogDetail.value.uid)
}

// フォロー外す
const deleteFollowUser = async (): Promise<void> => {
	// ログインチェック
	if (!authStore.isLogin) {
		isUserCreateDialog.value = true
		return
	}

	if (!userInfo.value) return
	await followUsersStore.deleteItem(blogDetail.value.uid)
}

// パスワード認証
const verifyPassword = async (): Promise<void> => {
	if (!passwordInput.value.trim()) {
		await AppSwal.fire({
			title: '確認',
			text: 'パスワードを入力してください',
			icon: 'error'
		})
		return
	}
	passwordVerifying.value = true

	try {
		const isValid = await blogStore.verifyPassword(blog_id, passwordInput.value)
		if (isValid) {
			initRefs()
			isPasswordVerified.value = true

			isLoading.value = true
			await fetchCommentList()
		} else {
			AppSwal.fire({
				title: 'エラー',
				text: 'パスワードが正しくありません',
				icon: 'error'
			})
		}
	} catch (error) {
		console.error('パスワード認証エラー:', error)
		AppSwal.fire({
			title: 'エラー',
			text: '認証に失敗しました',
			icon: 'error'
		})
	} finally {
		passwordVerifying.value = false
	}
}

// パスワード認証をキャンセル
const cancelPasswordAuth = (): void => {
	closeDialog()

	router.push({ path: '/' })
}

// パスワード認証が必要かチェック
const checkPasswordRequired = (): boolean => {
	// パスワードが設定されており、かつ空文字列でない場合のみ認証が必要
	if (blogDetail.value.password && blogDetail.value.password.trim() !== '' && !isPasswordVerified.value) {
		isPasswordDialog.value = true
		return false
	}
	return true
}

// ブログに設定されているカテゴリーを取得
const fetchCategory = async (): Promise<void> => {
	try {
		isLoadingCategory.value = true
		
		// ブログにカテゴリーIDが設定されているか確認
		if (!blogDetail.value.category_id) {
			currentCategory.value = null
			return
		}
		
		// カテゴリー情報を取得
		const category = await blogCategoryStore.getCategoryById(blogDetail.value.category_id)
		if (category) {
			currentCategory.value = category
		} else {
			currentCategory.value = null
		}
	} catch (error) {
		console.error('カテゴリー取得エラー:', error)
		currentCategory.value = null
	} finally {
		isLoadingCategory.value = false
	}
}

// カテゴリーをクリックしてカテゴリー一覧を表示
const selectCategory = (categoryId: string): void => {
	router.push({ 
		path: '/',
		query: { category_id: categoryId }
	})
}

// ブログデータ取得
onMounted(async (): Promise<void> => {
	await blogStore.getDetailWithAccessCount(blog_id)

	// パスワード認証が必要かチェック
	if (!checkPasswordRequired()) {
		return
	}
	// パスワード認証が不要で、コイン消費も完了した場合のみブログ内容を表示
	isLoading.value = true
	await fetchCommentList()
	await fetchCategory()
})

// 戻るボタンのテキストを計算
const backButtonText = computed((): string => {
	const from = route.query.from
	if (from === 'profile') {
		return 'プロフィールに戻る'
	}
	return '一覧に戻る'
})

// 戻る処理
const goBack = (): void => {
	const from = route.query.from
	if (from === 'profile') {
		const profileUid = route.query.profile_uid
		router.push({ 
			path: '/user_profile', 
			query: { uid: profileUid } 
		})
	} else {
		router.push({ path: '/' })
	}
}
</script>

<style scoped>
.header-image {
	width: 100%;
	height: 400px;
	overflow: hidden;

	img {
		width: 100%;
		height: auto;
		vertical-align: top;
	}
}
</style>

