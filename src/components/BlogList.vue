<template>
	<v-container fluid>
		<!-- 生年月日入力ダイアログ -->
		<BirthDateDialog 
			v-model="showBirthDateDialog" 
			@saved="onBirthDateSaved"
		/>
		
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
							>
								<v-img :src="item.thumbUrl || '/default-thumbnail.png'" aspect-ratio="16/9" cover />
								<v-card-text class="d-flex flex-column" style="height: 60px;">
									<strong class="text-h6">{{ item.title }}</strong>
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
								<v-img :src="item.thumbUrl || '/default-thumbnail.png'" aspect-ratio="16/9" cover />
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
					v-model="isPreviewTweetDialogOpen"
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
							>
								<v-img :src="item.thumbUrl || '/default-thumbnail.png'" aspect-ratio="16/9" cover />
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
					v-model="isPreviewMomentDialogOpen"
					:moment="momentToPreview"
				/>
			</v-window-item>
		</v-window>
	</v-container>
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'
import { useTweetStore } from '@/stores/tweetStore'
import { useMomentStore } from '@/stores/momentStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useUsersStore } from '@/stores/usersStore'
import { useAuthStore } from '@/stores/authStore'
import BirthDateDialog from '@/components/BirthDateDialog.vue'
import TweetCard from '@/components/TweetCard.vue'
import MomentCard from '@/components/MomentCard.vue'

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
}

interface UserData {
	uid: string
	birthDate?: string
	[key: string]: any
}

const router = useRouter()
const blogStore = useBlogStore()
const tweetStore = useTweetStore()
const momentStore = useMomentStore()
const likeStore = useLikeStore()
const bookmarkStore = useBookmarkStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()
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
const showBirthDateDialog = ref<boolean>(false)
const userData = ref<UserData | null>(null)
const isUserAdult = ref<boolean>(false)
const tweetToPreview = ref<any>(null)
const isPreviewTweetDialogOpen = ref<boolean>(false)
const momentToPreview = ref<any>(null)
const isPreviewMomentDialogOpen = ref<boolean>(false)

const extendBlogList = computed((): BlogItem[] => {
	if (!blogList.value) {
		return []
	}
	
	// 閲覧制限フィルタリング
	return blogList.value.filter((blog: BlogItem) => {
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
})

const extendTweetList = computed((): any[] => {
	if (!tweetList.value) {
		return []
	}
	return tweetList.value
})

const extendMomentList = computed((): MomentItem[] => {
	console.log(momentList.value)
	if (!momentList.value) {
		return []
	}
	
	// 閲覧制限フィルタリング
	return momentList.value.filter((moment: MomentItem) => {
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
})

// 一覧取得
const fetchBlogList = async (type: number): Promise<void> => {
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
	isPreviewTweetDialogOpen.value = true
}

const openPreviewMomentDialog = (moment: any) => {
	momentToPreview.value = moment
	isPreviewMomentDialogOpen.value = true
}

// いいね
const addLike = async (blog: BlogItem): Promise<void> => {
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
	try {
		await momentStore.toggleLike(moment)
		await fetchMomentList()
	} catch (error) {
		console.error('モーメントいいねエラー:', error)
	}
}

// モーメントのブックマーク
const addMomentBookmark = async (moment: MomentItem): Promise<void> => {
	try {
		await momentStore.toggleBookmark(moment)
		await fetchMomentList()
	} catch (error) {
		console.error('モーメントブックマークエラー:', error)
	}
}

// つぶやき内容を切り詰める関数
const truncateContent = (content: string): string => {
	if (!content) return ''
	if (content.length <= 10) return content
	return content.substring(0, 10) + '...'
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
		showBirthDateDialog.value = true
	}
}

// 初回ロード
onMounted(async (): Promise<void> => {
	await fetchBlogList(selectType.value)
	await fetchTweetList()
	await fetchMomentList()
	await checkBirthDateRegistration()
})
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
		vertical-align: top;
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
