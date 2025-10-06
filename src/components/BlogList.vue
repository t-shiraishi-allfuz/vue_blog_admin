<template>
	<v-container fluid>
		<!-- 生年月日入力ダイアログ -->
		<BirthDateDialog 
			v-model="showBirthDateDialog" 
			@saved="onBirthDateSaved"
		/>
		
		<!-- タブ切り替え -->
		<v-tabs v-model="activeTab" color="primary" class="mb-4">
			<v-tab value="blogs">
				<v-icon start icon="mdi-post" />
				ブログ記事
			</v-tab>
			<v-tab value="tweets">
				<v-icon start icon="mdi-twitter" />
				つぶやき
			</v-tab>
		</v-tabs>

		<v-window v-model="activeTab">
			<!-- ブログ記事タブ -->
			<v-window-item value="blogs">
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
								<v-img :src="item.thumbUrl" aspect-ratio="16/9" cover />
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
			<v-window-item value="tweets">
				<v-row class="horizontal-scroll" no-gutters>
					<v-slide-group v-if="extendTweetList.length > 0" show-arrows>
						<v-slide-group-item
							v-for="(item, index) in extendTweetList"
							:key="index"
						>
							<v-card
								class="blog-card d-inline-block"
								@click="goToTweetDetail(item)"
								outlined
								height="280"
							>
								<v-img :src="item.thumbUrl" aspect-ratio="16/9" cover />
								<v-card-text class="d-flex flex-column" style="height: 60px;">
									<strong class="text-h6">{{ truncateContent(item.content) }}</strong>
								</v-card-text>
								<v-card-actions>
									<div class="d-flex">
										<div class="d-flex align-center text-caption text-medium-emphasis me-1">
											<v-btn
												:icon="formatTweetLike(item)"
												:color="colorTweetIconPink(item)"
												variant="text"
												@click.stop="addTweetLike(item)"
											/>
											<div class="text-truncate">{{ item.like_count }}</div>
										</div>
										<div class="d-flex align-center text-caption text-medium-emphasis me-1">
											<v-btn
												:icon="formatTweetBookmark(item)"
												:color="colorTweetIconPrimary(item)"
												variant="text"
												@click.stop="addTweetBookmark(item)"
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
			</v-window-item>
		</v-window>
	</v-container>
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'
import { useTweetStore } from '@/stores/tweetStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useUsersStore } from '@/stores/usersStore'
import { useAuthStore } from '@/stores/authStore'
import BirthDateDialog from '@/components/BirthDateDialog.vue'
import { format } from 'date-fns'

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
	createdAt: Date | null
	is_like: boolean
	is_bookmark: boolean
	like_count: number
	uid: string
}

interface UserData {
	uid: string
	birthDate?: string
	[key: string]: any
}

const router = useRouter()
const blogStore = useBlogStore()
const tweetStore = useTweetStore()
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

const activeTab = ref('blogs')
const showBirthDateDialog = ref<boolean>(false)
const userData = ref<UserData | null>(null)
const isUserAdult = ref<boolean>(false)

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

const extendTweetList = computed((): TweetItem[] => {
	if (!tweetList.value) {
		return []
	}
	
	return tweetList.value
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

// アイコン設定
const formatLike = (blog: BlogItem): string => {
	return blog.is_like ? "mdi-heart" : "mdi-heart-outline"
}
const formatBookmark = (blog: BlogItem): string => {
	return blog.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
}

// アイコン設定（カラー）
const colorIconPink = (blog: BlogItem): string => {
	return blog.is_like ? "pink" : "black"
}
const colorIconPrimary = (blog: BlogItem): string => {
	return blog.is_bookmark ? "blue" : "black"
}

// 詳細ページに移動
const goToBlogDetail = (blog: BlogItem): void => {
	router.push({path: "/blog_detail", query: {blog_id: blog.id}})
}

const goToTweetDetail = (tweet: TweetItem): void => {
	router.push({path: "/tweet_detail", query: {tweet_id: tweet.id}})
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

// つぶやき用のアイコン設定
const formatTweetLike = (tweet: TweetItem): string => {
	return tweet.is_like ? "mdi-heart" : "mdi-heart-outline"
}
const formatTweetBookmark = (tweet: TweetItem): string => {
	return tweet.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
}

// つぶやき用のアイコン設定（カラー）
const colorTweetIconPink = (tweet: TweetItem): string => {
	return tweet.is_like ? "pink" : "black"
}
const colorTweetIconPrimary = (tweet: TweetItem): string => {
	return tweet.is_bookmark ? "blue" : "black"
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

// つぶやきのお気に入り登録
const addTweetBookmark = async (tweet: TweetItem): Promise<void> => {
	if (tweet.is_bookmark) {
		await bookmarkStore.deleteItem(tweet.id)
		tweet.is_bookmark = false
	} else {
		await bookmarkStore.create(tweet.id)
		tweet.is_bookmark = true
	}
	await fetchTweetList()
}

// つぶやき内容を切り詰める関数
const truncateContent = (content: string): string => {
	if (!content) return ''
	if (content.length <= 10) return content
	return content.substring(0, 10) + '...'
}

// 日時フォーマット関数
const formatDate = (date: Date | null): string => {
	if (!date) return ''
	return format(new Date(date), 'yyyy/MM/dd HH:mm')
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
