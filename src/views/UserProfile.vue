<template>
	<v-container>
		<v-row justify="center">
			<v-col cols="12" md="8" lg="6">
				<!-- プロフィール情報 -->
				<v-card class="mb-6">
					<v-card-text class="text-center pa-8">
						<v-avatar
							:image="userProfile?.profileUrl"
							size="120"
							class="mb-4"
						></v-avatar>
						
						<h2 class="text-h4 mb-2">{{ userProfile?.title || 'ユーザー' }}</h2>
						<p class="text-body-1 text-grey mb-4">
							{{ userProfile?.description || 'プロフィール情報がありません' }}
						</p>
						
						<v-row class="text-center">
							<v-col cols="4">
								<div class="text-h6">{{ userStats?.blogCount || 0 }}</div>
								<div class="text-caption text-grey">記事</div>
							</v-col>
							<v-col cols="4">
								<div class="text-h6">{{ userStats?.followerCount || 0 }}</div>
								<div class="text-caption text-grey">フォロワー</div>
							</v-col>
							<v-col cols="4">
								<div class="text-h6">{{ userStats?.followingCount || 0 }}</div>
								<div class="text-caption text-grey">フォロー中</div>
							</v-col>
						</v-row>
						<div class="mt-6" v-if="!isOwnProfile">
							<v-btn
								:color="isFollowing ? 'grey' : 'success'"
								:variant="isFollowing ? 'outlined' : 'flat'"
								@click="toggleFollow"
								:loading="followLoading"
								:disabled="followLoading"
							>
								<v-icon class="mr-2">
									{{ isFollowing ? 'mdi-account-minus' : 'mdi-account-plus' }}
								</v-icon>
								{{ isFollowing ? 'フォロー解除' : 'フォロー' }}
							</v-btn>
						</div>
					</v-card-text>
				</v-card>
				
				<v-card>
					<v-card-title>
						<v-icon class="mr-2">mdi-post</v-icon>
						記事一覧
					</v-card-title>
					<v-card-text>
						<div v-if="userBlogs.length === 0" class="text-center pa-8">
							<v-icon size="64" color="grey-lighten-1">mdi-post-outline</v-icon>
							<p class="text-grey mt-4">まだ記事がありません</p>
						</div>
						<div v-else>
							<v-list>
								<v-list-item
									v-for="blog in userBlogs"
									:key="blog.id"
									@click="goToBlogDetail(blog.id)"
									class="cursor-pointer"
								>
									<template #prepend>
										<v-avatar
											:image="blog.thumbUrl"
											size="60"
											class="mr-3"
											rounded
										/>
									</template>
									<div class="d-flex justify-start">
										<v-list-item-title class="font-weight-medium">
											{{ blog.title }}
										</v-list-item-title>
									</div>
									<v-list-item-subtitle class="mt-1">
										<template v-if="isOwnProfile">
											<v-chip
												:color="blog.isPublished ? 'success' : 'warning'"
												size="x-small"
												variant="outlined"
												class="ml-2"
											>
												{{ blog.isPublished ? '公開中' : '下書き' }}
											</v-chip>
										</template>
									</v-list-item-subtitle>
										
									<template #append>
										<div class="d-flex align-center text-caption text-grey">
											<div class="d-flex align-center mx-2 stats-item">
												<v-icon size="16" class="mr-1">mdi-heart</v-icon>
												<span class="stats-number">{{ blog.like_count || 0 }}</span>
											</div>
											<div class="d-flex align-center mx-2 stats-item">
												<v-icon size="16" class="mr-1">mdi-comment</v-icon>
												<span class="stats-number">{{ blog.comment_count || 0 }}</span>
											</div>
											<template v-if="isOwnProfile">
												<div class="d-flex align-center mx-2 stats-item">
													<v-icon size="16" class="mr-1">mdi-eye</v-icon>
													<span class="stats-number">{{ blog.viewCount || 0 }}</span>
												</div>
											</template>
										</div>
									</template>
								</v-list-item>
							</v-list>
						</div>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const blogStore = useBlogStore()
const followUsersStore = useFollowUsersStore()
const blogSettingStore = useBlogSettingStore()

// 状態管理
const userProfile = ref(null)
const userStats = ref(null)
const userBlogs = ref([])
const isFollowing = ref(false)
const followLoading = ref(false)

// プロフィールのユーザーID
const profileUserId = computed(() => route.query.uid)

// 自分のプロフィールかどうか
const isOwnProfile = computed(() => {
	return authStore.userInfo?.uid === profileUserId.value
})

// ユーザープロフィールを取得
const fetchUserProfile = async () => {
	try {
		if (!profileUserId.value) return
		
		// ユーザー設定を取得
		userProfile.value = await blogSettingStore.getForUid(profileUserId.value)
		
		// ユーザー統計を取得
		await fetchUserStats()
		
		// ユーザーの記事一覧を取得
		await fetchUserBlogs()
		
		// フォロー状態を確認
		if (!isOwnProfile.value) {
			await checkFollowStatus()
		}
	} catch (error) {
		console.error('ユーザープロフィールの取得に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'ユーザー情報の取得に失敗しました',
			icon: 'error'
		})
	}
}

// ユーザー統計を取得
const fetchUserStats = async () => {
	try {
		let blogCount
		
		if (isOwnProfile.value) {
			// 自分のプロフィールの場合は全ての記事をカウント（管理画面と一致させる）
			await blogStore.getList()
			blogCount = blogStore.blogList.length
		} else {
			// 他のユーザーのプロフィールの場合は公開中の記事のみをカウント
			blogCount = await blogStore.getCountForUser(profileUserId.value)
		}
		
		// フォロワー数・フォロー数
		const followStats = await followUsersStore.getFollowStats(profileUserId.value)
		
		userStats.value = {
			blogCount,
			followerCount: followStats.followerCount,
			followingCount: followStats.followingCount
		}
	} catch (error) {
		console.error('ユーザー統計の取得に失敗しました:', error)
		userStats.value = {
			blogCount: 0,
			followerCount: 0,
			followingCount: 0
		}
	}
}

// ユーザーの記事一覧を取得
const fetchUserBlogs = async () => {
	try {
		if (isOwnProfile.value) {
			// 自分のプロフィールの場合は全ての記事を取得（管理画面と一致させる）
			await blogStore.getList()
			userBlogs.value = blogStore.blogList
		} else {
			// 他のユーザーのプロフィールの場合は公開中の記事のみを取得
			userBlogs.value = await blogStore.getListForUser(profileUserId.value)
		}
	} catch (error) {
		console.error('ユーザー記事の取得に失敗しました:', error)
		userBlogs.value = []
	}
}

// フォロー状態を確認
const checkFollowStatus = async () => {
	try {
		isFollowing.value = await followUsersStore.isFollower(profileUserId.value)
	} catch (error) {
		console.error('フォロー状態の確認に失敗しました:', error)
		isFollowing.value = false
	}
}

// フォロー/フォロー解除
const toggleFollow = async () => {
	try {
		followLoading.value = true
		
		if (isFollowing.value) {
			await followUsersStore.delete(profileUserId.value)
			isFollowing.value = false
			userStats.value.followerCount = Math.max(0, userStats.value.followerCount - 1)
		} else {
			await followUsersStore.create(profileUserId.value)
			isFollowing.value = true
			userStats.value.followerCount = (userStats.value.followerCount || 0) + 1
		}
	} catch (error) {
		console.error('フォロー操作に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'フォロー操作に失敗しました',
			icon: 'error'
		})
	} finally {
		followLoading.value = false
	}
}

// 記事詳細に遷移
const goToBlogDetail = (blogId) => {
	router.push({ 
		path: '/blog_detail', 
		query: { 
			blog_id: blogId,
			from: 'profile',
			profile_uid: profileUserId.value
		} 
	})
}

// コンポーネントマウント時にデータを取得
onMounted(async () => {
	await fetchUserProfile()
})
</script>

<style scoped>
.cursor-pointer {
	cursor: pointer;
}

.cursor-pointer:hover {
	background-color: rgba(0, 0, 0, 0.04);
}

.blog-title-left {
	text-align: left !important;
	justify-content: flex-start !important;
}

.stats-item {
	min-width: 50px;
}

.stats-number {
	display: inline-block;
	min-width: 20px;
	text-align: right;
}
</style>
