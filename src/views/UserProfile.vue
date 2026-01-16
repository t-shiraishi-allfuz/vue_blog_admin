<template>
	<v-row justify="center">
		<v-col cols="12" md="8" lg="6">
			<v-card class="mb-4">
				<v-card-text class="text-center pa-8">
					<v-avatar
						:image="userProfile?.profileUrl"
						size="120"
						class="mb-4"
					/>
					
					<h2 class="text-h4 mb-2">{{ userProfile?.title || 'ユーザー' }}</h2>
					<p class="text-body-1 text-grey mb-4">
						{{ userProfile?.description || 'プロフィール情報がありません' }}
					</p>
					
					<!-- ソーシャルリンク -->
					<div 
						v-if="userProfile && (userProfile.xUrl || userProfile.youtubeUrl || userProfile.instagramUrl)"
						class="d-flex justify-center align-center mb-4 social-links"
					>
						<v-btn
							v-if="userProfile.xUrl"
							@click="openSocialLink('X', userProfile.xUrl)"
							icon="mdi-twitter"
							variant="text"
							color="grey-darken-1"
							size="large"
							class="mx-2"
						>
							<v-icon>mdi-twitter</v-icon>
						</v-btn>
						<v-btn
							v-if="userProfile.youtubeUrl"
							@click="openSocialLink('YouTube', userProfile.youtubeUrl)"
							icon="mdi-youtube"
							variant="text"
							color="red-darken-1"
							size="large"
							class="mx-2"
						>
							<v-icon>mdi-youtube</v-icon>
						</v-btn>
						<v-btn
							v-if="userProfile.instagramUrl"
							@click="openSocialLink('Instagram', userProfile.instagramUrl)"
							icon="mdi-instagram"
							variant="text"
							color="pink-darken-1"
							size="large"
							class="mx-2"
						>
							<v-icon>mdi-instagram</v-icon>
						</v-btn>
					</div>
					
					<v-row class="text-center">
						<v-col cols="4">
							<div class="text-h6">{{ userStats?.blogCount || 0 }}</div>
							<div class="text-caption text-grey">記事</div>
						</v-col>
						<v-col cols="4">
							<div 
								class="text-h6 cursor-pointer hover-text"
								@click="openFollowersDialog"
							>
								{{ userStats?.followerCount || 0 }}
							</div>
							<div class="text-caption text-grey">フォロワー</div>
						</v-col>
						<v-col cols="4">
							<div 
								class="text-h6 cursor-pointer hover-text"
								@click="openFollowingDialog"
							>
								{{ userStats?.followingCount || 0 }}
							</div>
							<div class="text-caption text-grey">フォロー中</div>
						</v-col>
					</v-row>
					<div class="mt-6" v-if="!isOwnProfile">
						<v-row>
							<v-col cols="6">
								<v-btn
									:color="isFollowing ? 'grey-lighten-4' : 'success'"
									@click="toggleFollow"
									:loading="followLoading"
									:disabled="followLoading"
									variant="flat"
									block
								>
									<v-icon class="mr-2">
										{{ isFollowing ? 'mdi-account-minus' : 'mdi-account-plus' }}
									</v-icon>
									{{ isFollowing ? 'フォロー解除' : 'フォロー' }}
								</v-btn>
							</v-col>
							<v-col cols="6">
								<v-btn
									color="success"
									variant="flat"
									@click="goToDmPage"
									block
								>
									<v-icon class="mr-2">mdi-message-text</v-icon>
									DM
								</v-btn>
							</v-col>
						</v-row>
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
										:image="blog.thumbUrl || undefined"
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
	
	<FollowListDialog
		v-model:dialog="isFollowersDialog"
		dialog-type="followers"
		:target-user-id="profileUserId"
	/>
	<FollowListDialog
		v-model:dialog="isFollowingDialog"
		dialog-type="following"
		:target-user-id="profileUserId"
	/>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import Swal from 'sweetalert2'

// 型定義
interface UserProfile {
	uid: string
	title: string
	description: string
	profileUrl: string
	xUrl?: string | null
	youtubeUrl?: string | null
	instagramUrl?: string | null
	[key: string]: any
}

interface UserStats {
	blogCount: number
	followerCount: number
	followingCount: number
}

interface BlogData {
	id: string
	title: string
	summary: string
	thumbUrl: string | null
	createdAt: Date | null
	like_count: number
	comment_count: number
	viewCount?: number
	isPublished?: boolean
	[key: string]: any
}

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const blogStore = useBlogStore()
const followUsersStore = useFollowUsersStore()
const blogSettingStore = useBlogSettingStore()

// 状態管理
const userProfile = ref<UserProfile | null>(null)
const userStats = ref<UserStats | null>(null)
const userBlogs = ref<BlogData[]>([])
const isFollowing = ref<boolean>(false)
const followLoading = ref<boolean>(false)
const isFollowersDialog = ref<boolean>(false)
const isFollowingDialog = ref<boolean>(false)

// プロフィールのユーザーID
const profileUserId = computed((): string => route.query.uid as string)

// 自分のプロフィールかどうか
const isOwnProfile = computed((): boolean => {
	return authStore.userInfo?.uid === profileUserId.value
})

// ユーザープロフィールを取得
const fetchUserProfile = async (): Promise<void> => {
	try {
		if (!profileUserId.value) return
		
		// ユーザー設定を取得
		userProfile.value = await blogSettingStore.getForUid(profileUserId.value) as UserProfile
		
		// ユーザー統計を取得
		await fetchUserStats()
		
		// ユーザーの記事一覧を取得
		await fetchUserBlogs()
		
		// フォロー状態を確認
		if (!isOwnProfile.value) {
			await checkFollowStatus()
		}
	} catch (error: any) {
		console.error('ユーザープロフィールの取得に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'ユーザー情報の取得に失敗しました',
			icon: 'error'
		})
	}
}

// ユーザー統計を取得
const fetchUserStats = async (): Promise<void> => {
	try {
		let blogCount: number
		
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
const fetchUserBlogs = async (): Promise<void> => {
	try {
		if (isOwnProfile.value) {
			// 自分のプロフィールの場合は全ての記事を取得（管理画面と一致させる）
			await blogStore.getList()
			userBlogs.value = blogStore.blogList as BlogData[]
		} else {
			// 他のユーザーのプロフィールの場合は公開中の記事のみを取得
			userBlogs.value = await blogStore.getListForUser(profileUserId.value) as BlogData[]
		}
	} catch (error) {
		console.error('ユーザー記事の取得に失敗しました:', error)
		userBlogs.value = []
	}
}

// フォロー状態を確認
const checkFollowStatus = async (): Promise<void> => {
	try {
		isFollowing.value = await followUsersStore.isFollower(profileUserId.value)
	} catch (error) {
		console.error('フォロー状態の確認に失敗しました:', error)
		isFollowing.value = false
	}
}

// フォロー/フォロー解除
const toggleFollow = async (): Promise<void> => {
	try {
		followLoading.value = true
		
		if (isFollowing.value) {
			await followUsersStore.deleteItem(profileUserId.value)
			isFollowing.value = false
			if (userStats.value) {
				userStats.value.followerCount = Math.max(0, userStats.value.followerCount - 1)
			}
		} else {
			await followUsersStore.create(profileUserId.value)
			isFollowing.value = true
			if (userStats.value) {
				userStats.value.followerCount = (userStats.value.followerCount || 0) + 1
			}
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
const goToBlogDetail = (blogId: string): void => {
	router.push({ 
		path: '/blog_detail', 
		query: { 
			blog_id: blogId,
			from: 'profile',
			profile_uid: profileUserId.value
		} 
	})
}

// フォロワーダイアログを開く
const openFollowersDialog = (): void => {
	isFollowersDialog.value = true
}

// フォロー中ダイアログを開く
const openFollowingDialog = (): void => {
	isFollowingDialog.value = true
}

// DMページに遷移
const goToDmPage = (): void => {
	router.push({ 
		path: '/dm',
		query: { 
			targetUserId: profileUserId.value
		} 
	})
}

// ソーシャルリンクを開く
const openSocialLink = async (platform: string, url: string): Promise<void> => {
	const result = await Swal.fire({
		title: '外部サイトに遷移します',
		html: `${platform}のページへ移動しますか？<br><small class="text-grey">${url}</small>`,
		icon: 'info',
		showCancelButton: true,
		confirmButtonColor: '#27C1A3',
		confirmButtonText: '遷移する',
		cancelButtonText: '閉じる',
		reverseButtons: true
	})

	if (result.isConfirmed) {
		window.open(url, '_blank', 'noopener,noreferrer')
	}
}

// コンポーネントマウント時にデータを取得
onMounted(async (): Promise<void> => {
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

.hover-text:hover {
	color: rgb(var(--v-theme-primary));
	text-decoration: underline;
}
</style>
