<template>
	<CommonTemplate>
		<v-container>
			<v-row>
				<v-col cols="12">
					<v-card class="mb-6">
						<v-card-title class="text-h4 text-center py-8">
							<v-icon size="large" class="mr-3">mdi-moment</v-icon>
							モーメント
						</v-card-title>
						<v-card-text class="text-center text-body-1">
							複数のつぶやきをまとめたストーリーをお楽しみください
						</v-card-text>
					</v-card>
				</v-col>
			</v-row>
			
			<v-row v-if="loading">
				<v-col cols="12" class="d-flex justify-center">
					<v-progress-circular indeterminate color="primary" size="64" />
				</v-col>
			</v-row>
			
			<v-row v-else-if="momentList.length === 0">
				<v-col cols="12">
					<v-card variant="outlined" class="text-center pa-8">
						<v-icon size="64" color="grey">mdi-moment</v-icon>
						<v-card-title class="text-h6 mt-4">モーメントがありません</v-card-title>
						<v-card-text>
							まだモーメントが作成されていません。
						</v-card-text>
					</v-card>
				</v-col>
			</v-row>
			
			<v-row v-else>
				<v-col
					v-for="moment in filteredMomentList"
					:key="moment.id"
					cols="12"
					md="6"
					lg="4"
				>
					<v-card
						class="moment-card"
						elevation="2"
						@click="goToMomentDetail(moment.id)"
						style="cursor: pointer;"
					>
						<!-- サムネイル画像 -->
						<div class="moment-thumbnail">
							<v-img
								:src="getMomentThumbnail(moment)"
								aspect-ratio="16/9"
								cover
							/>
							<div class="moment-overlay">
								<v-icon size="32" color="white">mdi-play</v-icon>
							</div>
						</div>
						
						<v-card-title class="moment-title">
							{{ moment.title }}
						</v-card-title>
						
						<v-card-text class="moment-description">
							{{ truncateContent(moment.description) }}
						</v-card-text>
						
						<v-card-actions class="moment-footer">
							<div class="d-flex align-center">
								<v-avatar size="24" class="mr-2">
									<v-img :src="moment.setting?.profileUrl || '/default-avatar.png'" />
								</v-avatar>
								<span class="text-caption">{{ moment.setting?.name || 'ユーザー名不明' }}</span>
							</div>
							
							<div class="d-flex align-center ml-auto">
								<v-btn
									:icon="formatLike(moment)"
									:color="colorIconPink(moment)"
									variant="text"
									size="small"
									@click.stop="addMomentLike(moment)"
								/>
								<span class="text-caption ml-1">{{ moment.like_count || 0 }}</span>
								
								<v-btn
									:icon="formatBookmark(moment)"
									:color="colorIconPrimary(moment)"
									variant="text"
									size="small"
									class="ml-2"
									@click.stop="addMomentBookmark(moment)"
								/>
								
								<v-icon size="small" class="ml-3 mr-1">mdi-message-text</v-icon>
								<span class="text-caption">{{ moment.tweets?.length || 0 }}</span>
								<v-icon size="small" class="ml-3 mr-1">mdi-eye</v-icon>
								<span class="text-caption">{{ moment.viewCount || 0 }}</span>
							</div>
						</v-card-actions>
					</v-card>
				</v-col>
			</v-row>
		</v-container>
	</CommonTemplate>
</template>

<script setup lang="ts">
import { useMomentStore } from '@/stores/momentStore'
import { useAuthStore } from '@/stores/authStore'
import { useUsersStore } from '@/stores/usersStore'
import CommonTemplate from '@/components/CommonTemplate.vue'

const router = useRouter()
const momentStore = useMomentStore()
const authStore = useAuthStore()
const usersStore = useUsersStore()

const {
	momentList
} = storeToRefs(momentStore)

const loading = ref(true)
const userData = ref<any>(null)
const isUserAdult = ref<boolean>(false)

// 閲覧制限フィルタリング
const filteredMomentList = computed(() => {
	if (!momentList.value) {
		return []
	}
	
	return momentList.value.filter((moment: any) => {
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

// ユーザー情報を取得して年齢チェック
const loadUserData = async (): Promise<void> => {
	if (!authStore.isLogin || !authStore.userInfo) return
	
	try {
		const userInfo = authStore.userInfo as { uid: string }
		const data = await usersStore.getUserByUid(userInfo.uid)
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

// モーメント一覧を取得
const fetchMomentList = async () => {
	try {
		await momentStore.getListForAll()
	} catch (error) {
		console.error('モーメント一覧の取得に失敗しました:', error)
	} finally {
		loading.value = false
	}
}

// モーメント詳細ページに遷移
const goToMomentDetail = (momentId: string) => {
	router.push(`/moment/${momentId}`)
}

// モーメントのサムネイル画像を取得
const getMomentThumbnail = (moment: any) => {
	if (moment.tweets && moment.tweets.length > 0) {
		return moment.tweets[0].thumbUrl
	}
	return '/default-moment-thumbnail.png'
}

// 内容を切り詰める
const truncateContent = (content: string) => {
	if (!content) return ''
	if (content.length <= 100) return content
	return content.substring(0, 100) + '...'
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

// モーメントのいいね
const addMomentLike = async (moment: any): Promise<void> => {
	try {
		await momentStore.toggleLike(moment)
		await fetchMomentList()
	} catch (error) {
		console.error('モーメントいいねエラー:', error)
	}
}

// モーメントのブックマーク
const addMomentBookmark = async (moment: any): Promise<void> => {
	try {
		await momentStore.toggleBookmark(moment)
		await fetchMomentList()
	} catch (error) {
		console.error('モーメントブックマークエラー:', error)
	}
}

onMounted(async () => {
	await Promise.all([
		fetchMomentList(),
		loadUserData()
	])
})
</script>

<style scoped>
.moment-card {
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	height: 100%;
}

.moment-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.moment-thumbnail {
	position: relative;
	overflow: hidden;
}

.moment-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.moment-card:hover .moment-overlay {
	opacity: 1;
}

.moment-title {
	font-size: 1.1rem;
	font-weight: 600;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.moment-description {
	color: #666;
	line-height: 1.5;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.moment-footer {
	padding: 12px 16px;
	background-color: #f8f9fa;
	border-top: 1px solid #e0e0e0;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
	.moment-title {
		font-size: 1rem;
	}
	
	.moment-description {
		font-size: 0.9rem;
	}
}
</style>
