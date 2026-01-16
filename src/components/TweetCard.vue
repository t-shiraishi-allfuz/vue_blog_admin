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
					:src="props.tweet.thumbUrl"
					aspect-ratio="16/9"
					cover
				/>
				<div class="overlay-text">
					<div class="tweet-content-overlay">{{ props.tweet.content }}</div>
				</div>
			</div>
			<v-card-actions class="tweet-actions">
				<div class="d-flex align-center">
					<v-btn
						:icon="formatLike(props.tweet)"
						:color="colorIconPink(props.tweet)"
						variant="text"
						@click="addTweetLike(props.tweet)"
					/>
					<span class="text-caption ml-1">{{ props.tweet.like_count || 0 }}</span>
					<v-btn
						:icon="formatBookmark(props.tweet)"
						:color="colorIconPrimary(props.tweet)"
						variant="text"
						class="ml-3"
						@click="addTweetBookmark(props.tweet)"
					/>
				</div>
			</v-card-actions>
		</v-card>
	</v-overlay>
</template>

<script setup lang="ts">
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'

// 型定義
interface TweetData {
	id: string
	content: string
	thumbUrl: string
	createdAt: Date
	is_like: boolean
	is_bookmark: boolean
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

const likeStore = useLikeStore()
const bookmarkStore = useBookmarkStore()

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

// ツイートのいいね
const addTweetLike = async (tweet: any): Promise<void> => {
	try {
		if (tweet.is_like) {
			await likeStore.deleteItem(tweet.id)
			tweet.is_like = false
			tweet.like_count--
		} else {
			await likeStore.create(tweet.id, tweet.title, tweet.uid)
			tweet.is_like = true
			tweet.like_count++
		}
	} catch (error) {
		console.error('いいねエラー:', error)
	}
}

const addTweetBookmark = async (tweet: any): Promise<void> => {
	try {
		if (tweet.is_bookmark) {
			await bookmarkStore.deleteItem(tweet.id)
			tweet.is_bookmark = false
		} else {
			await bookmarkStore.create(tweet.id)
			tweet.is_bookmark = true
		}
	} catch (error) {
		console.error('ブックマークエラー:', error)
	}
}
</script>

<style scoped>
.header-image-container {
	position: relative;
	width: 100%;
	height: 560px;
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

.tweet-actions {
	padding: 12px 16px;
	background-color: #f8f9fa;
	border-top: 1px solid #e0e0e0;
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
