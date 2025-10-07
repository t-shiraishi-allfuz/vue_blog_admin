<template>
	<v-overlay
		class="d-flex justify-center mt-4"
		width="460"
	>
		<v-card
			class="tweet-card"
			width="460"
		>
			<div class="header-image-container">
				<v-img
					:src="tweet.thumbUrl"
					aspect-ratio="16/9"
					cover
				/>
				<div class="overlay-text">
					<div class="tweet-content-overlay">{{ tweet.content }}</div>
				</div>
			</div>
			<v-card-text>
				<v-row class="d-flex">
					<v-avatar
						class="mt-2"
						size="48"
						:image="setting.profileUrl"
						end
					/>
					<v-col>
						<div class="ml-1 mb-1">
							{{ setting.name }}
						</div>
						<div class="ml-1 mb-1">
							<v-icon icon="mdi-clock" start />
							{{ formatDate(tweet.createdAt) }}
						</div>
					</v-col>
				</v-row>
			</v-card-text>
			<v-card-actions class="px-4 pb-4">
				<div class="d-flex align-center text-caption text-medium-emphasis me-1">
					<v-btn
						:icon="formatLike(tweet)"
						:color="colorIconPink(tweet.is_like)"
						variant="text"
						@click.stop="addLike(tweet)"
					/>
					<div class="text-truncate">{{ tweet.like_count }}</div>
				</div>
				<v-spacer></v-spacer>
				<div class="d-flex align-center text-caption text-medium-emphasis">
					<v-icon icon="mdi-eye" start />
					{{ tweet.viewCount }}
				</div>
			</v-card-actions>
		</v-card>
	</v-overlay>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useLikeStore } from '@/stores/likeStore'

// 型定義
interface TweetData {
	id: string
	content: string
	thumbUrl: string
	createdAt: Date
	is_like: boolean
	like_count: number
	viewCount: number
	[key: string]: any
}

interface SettingData {
	name: string
	profileUrl: string
	[key: string]: any
}

// Props定義
interface Props {
	tweet: TweetData
	setting: SettingData
}

const props = defineProps<Props>()

const router = useRouter()
const likeStore = useLikeStore()

// 日時フォーマット関数
const formatDate = (date: Date): string => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm')
}

// いいねアイコン設定
const formatLike = (tweet: TweetData): string => {
	return tweet.is_like ? "mdi-heart" : "mdi-heart-outline"
}

// いいねアイコンカラー設定
const colorIconPink = (flag: boolean): string => {
	return flag ? "pink" : "black"
}


// いいね追加/削除
const addLike = async (tweet: TweetData): Promise<void> => {
	try {
		if (tweet.is_like) {
			await likeStore.deleteLike(tweet.id)
			tweet.is_like = false
			tweet.like_count--
		} else {
			await likeStore.addLike(tweet.id)
			tweet.is_like = true
			tweet.like_count++
		}
	} catch (error) {
		console.error('いいね処理エラー:', error)
		alert('いいねの処理に失敗しました')
	}
}


// つぶやき詳細ページへ遷移
const goToTweetDetail = (): void => {
	router.push({ path: '/tweet_detail', query: { id: props.tweet.id } })
}
</script>

<style scoped>
.header-image-container {
	position: relative;
	width: 100%;
	height: 460px;
}

.overlay-text {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	color: white;
	padding: 16px;
	display: flex;
	align-items: flex-start;
	justify-content: flex-start;
	overflow-y: auto;
	max-height: 100%;
	backdrop-filter: blur(2px);
	transition: background-color 0.3s ease;
}

.tweet-content-overlay {
	text-align: left;
	line-height: 1.5;
	word-break: break-word;
	white-space: pre-wrap;
	font-size: 14px;
	font-weight: 500;
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
	max-width: 100%;
}

/* スクロールバーのスタイリング */
.overlay-text::-webkit-scrollbar {
	width: 4px;
}

.overlay-text::-webkit-scrollbar-track {
	background: rgba(255, 255, 255, 0.1);
	border-radius: 2px;
}

.overlay-text::-webkit-scrollbar-thumb {
	background: rgba(255, 255, 255, 0.3);
	border-radius: 2px;
}

.overlay-text::-webkit-scrollbar-thumb:hover {
	background: rgba(255, 255, 255, 0.5);
}
</style>
