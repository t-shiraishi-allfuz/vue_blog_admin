<template>
	<v-container v-if="loading" class="text-center">
		<v-progress-circular
			indeterminate
			color="success"
			size="64"
		/>
		<p class="mt-4">読み込み中...</p>
	</v-container>

	<v-sheet
		v-if="!loading"
		class="pa-6 mx-auto"
		border="md"
		max-width="800"
	>
		<div class="header-image mb-4">
			<img
				:src="tweetDetail.thumbUrl"
				aspect-ratio="16/9"
				cover
			/>
		</div>
		<div class="mb-4 d-flex">
			<v-row>
				<v-avatar
					class="mt-2"
					size="48"
					:image="tweetDetail.setting.profileUrl"
					end
				/>
				<v-col cols="3">
					<div class="ml-1 mb-1">
						{{ tweetDetail.setting.name }}
					</div>
					<div class="ml-1 mb-1">
						<v-icon icon="mdi-clock" start />
						{{ formatDate(tweetDetail.createdAt) }}
					</div>
				</v-col>
				<div v-if="userInfo?.uid !== tweetDetail.uid">
					<v-col>
						<div v-if="tweetDetail.setting.is_follower === true">
							<v-btn @click="deleteFollowUser">フォロー中</v-btn>
						</div>
						<div v-else-if="tweetDetail.setting.is_following === true">
							<v-btn @click="followUser">フォローバック</v-btn>
						</div>
						<div v-else>
							<v-btn @click="followUser">フォロー</v-btn>
						</div>
					</v-col>
				</div>
			</v-row>
		</div>
		<div class="mb-4 text-body-1 tweet-content">{{ tweetDetail.content }}</div>
		<div class="d-flex">
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatLike(tweetDetail)"
					:color="colorIconPink(tweetDetail.is_like)"
					variant="text"
					@click="addLike"
				/>
				<div class="text-truncate">{{ tweetDetail.like_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-eye"
					color="grey"
					variant="text"
				/>
				<div class="text-truncate">{{ tweetDetail.viewCount }}</div>
			</div>
		</div>
		<v-divider />
		<v-card-actions>
			<v-btn @click="goBack">一覧に戻る</v-btn>
		</v-card-actions>
	</v-sheet>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { useTweetStore } from '@/stores/tweetStore'
import { useLikeStore } from '@/stores/likeStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'

// 型定義
interface TweetData {
	id: string
	uid: string
	content: string
	thumbUrl: string
	isPublished: boolean
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
	like_count: number
	is_like: boolean
	setting: any
}

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const tweetStore = useTweetStore()
const likeStore = useLikeStore()
const followUsersStore = useFollowUsersStore()


const {
	userInfo
} = storeToRefs(authStore)

const {
	tweetDetail
} = storeToRefs(tweetStore)

const loading = ref<boolean>(true)

// 日時フォーマット関数
const formatDate = (date: Date | null | undefined): string => {
	if (!date) return ''
	return format(new Date(date), 'yyyy年MM月dd日 HH:mm')
}

// いいねアイコン設定
const formatLike = (tweet: TweetData | null | undefined): string => {
	return tweet?.is_like ? "mdi-heart" : "mdi-heart-outline"
}

// いいねアイコンカラー設定
const colorIconPink = (flag: boolean | null | undefined): string => {
	return flag ? "pink" : "black"
}

// いいね追加/削除
const addLike = async (): Promise<void> => {
	try {
		if (!tweetDetail.value.id) {
			console.error('つぶやきIDが取得できません')
			return
		}
		
		if (tweetDetail.value.is_like) {
			await likeStore.deleteLike(tweetDetail.value.id)
			tweetDetail.value.is_like = false
			tweetDetail.value.like_count--
		} else {
			await likeStore.addLike(tweetDetail.value.id)
			tweetDetail.value.is_like = true
			tweetDetail.value.like_count++
		}
	} catch (error) {
		console.error('いいね処理エラー:', error)
		alert('いいねの処理に失敗しました')
	}
}

// フォロー
const followUser = async (): Promise<void> => {
	await followUsersStore.create(tweetDetail.value.uid)
}

// フォロー外す
const deleteFollowUser = async (): Promise<void> => {
	await followUsersStore.deleteItem(tweetDetail.value.uid)
}

// 戻る
const goBack = (): void => {
	router.push({ path: '/' })
}

// つぶやき詳細取得
const fetchTweetDetail = async (): Promise<void> => {
	const tweetId = route.query.tweet_id as string
	if (!tweetId) {
		console.error('つぶやきIDが指定されていません')
		return
	}
	
	try {
		await tweetStore.getDetailWithAccessCount(tweetId)
	} catch (error) {
		console.error('つぶやき詳細取得エラー:', error)
		alert('つぶやきの取得に失敗しました')
	} finally {
		loading.value = false
	}
}

// 初回ロード
onMounted(async (): Promise<void> => {
	await fetchTweetDetail()
})
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

.tweet-content {
	line-height: 1.5;
	word-break: break-word;
	white-space: pre-wrap;
}
</style>
