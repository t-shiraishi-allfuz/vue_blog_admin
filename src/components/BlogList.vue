<template>
	<v-container fluid>
		<!-- 生年月日入力ダイアログ -->
		<BirthDateDialog 
			v-model="showBirthDateDialog" 
			@saved="onBirthDateSaved"
		/>
		
		<v-row class="horizontal-scroll" no-gutters>
			<v-slide-group v-if="extendBlogList.length > 0" show-arrows>
				<v-slide-group-item
					v-for="(item, index) in extendBlogList"
					:key="index"
				>
					<v-card
						class="blog-card d-inline-block"
						@click="goToDetail(item)"
						outlined
						height="280"
					>
						<v-img :src="item.thumbUrl" aspect-ratio="16/9" cover></v-img>
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
	</v-container>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from "pinia"
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blogStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useUsersStore } from '@/stores/usersStore'
import { useAuthStore } from '@/stores/authStore'
import BirthDateDialog from '@/components/BirthDateDialog.vue'

const router = useRouter()
const blogStore = useBlogStore()
const likeStore = useLikeStore()
const bookmarkStore = useBookmarkStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()
const {
	blogList,
	selectType
} = storeToRefs(blogStore)

const showBirthDateDialog = ref(false)
const userData = ref(null)
const isUserAdult = ref(false)

const extendBlogList = computed(() => {
	if (!blogList.value) {
		return []
	}
	
	// 閲覧制限フィルタリング
	return blogList.value.filter(blog => {
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

// 一覧取得
const fetchBlogList = async (type) => {
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

// アイコン設定
const formatLike = (blog) => {
	return blog.is_like ? "mdi-heart" : "mdi-heart-outline"
}
const formatBookmark = (blog) => {
	return blog.is_bookmark ? "mdi-bookmark-plus" : "mdi-bookmark-plus-outline"
}

// アイコン設定（カラー）
const colorIconPink = (blog) => {
	return blog.is_like ? "pink" : "black"
}
const colorIconPrimary = (blog) => {
	return blog.is_bookmark ? "blue" : "black"
}

// 詳細ページに移動
const goToDetail = (blog) => {
	router.push({path: "/blog_detail", query: {blog_id: blog.id}})
}

// いいね
const addLike = async (blog) => {
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
const addBookmark = async (blog) => {
	if (blog.is_bookmark) {
		await bookmarkStore.deleteItem(blog.id)
		blog.is_bookmark = false
	} else {
		await bookmarkStore.create(blog.id)
		blog.is_bookmark = true
	}
	await fetchBlogList(selectType.value)
}

watch(() => blogStore.selectType, async (newType) => {
	await fetchBlogList(newType)
})

// 生年月日登録後の処理
const onBirthDateSaved = async () => {
	// ユーザー情報を再取得
	await loadUserData()
	// ブログ一覧を再取得
	await fetchBlogList(selectType.value)
}

// ユーザー情報を取得して年齢チェック
const loadUserData = async () => {
	if (!authStore.isLogin) return
	
	try {
		const data = await usersStore.getUserByUid(authStore.userInfo.uid)
		userData.value = data
		
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
const checkBirthDateRegistration = async () => {
	if (!authStore.isLogin) return
	
	await loadUserData()
	
	if (!userData.value || !userData.value.birthDate) {
		showBirthDateDialog.value = true
	}
}

// 初回ロード
onMounted(async () => {
	await fetchBlogList(selectType.value)
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
