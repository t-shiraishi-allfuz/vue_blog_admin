<template>
	<v-overlay
		class="d-flex justify-center mt-4"
		width="460"
	>
		<v-card
			class="moment-card"
			width="460"
		>
			<v-carousel
				height="560"
				color="info"
				crossfade
			>
				<v-carousel-item
					v-for="(tweet, index) in moment.tweets"
					:key="tweet.id"
					cover
				>
					<div class="tweet-image-container">
						<v-img
							:src="tweet.thumbUrl"
							aspect-ratio="16/9"
							cover
							class="tweet-image"
						/>
						<div class="tweet-overlay">
							<div class="tweet-content">{{ tweet.content }}</div>
						</div>
					</div>
				</v-carousel-item>
			</v-carousel>
			
			<!-- いいね・ブックマークボタン -->
			<v-card-actions class="moment-actions">
				<div class="d-flex align-center">
					<v-btn
						:icon="formatLike(moment)"
						:color="colorIconPink(moment)"
						variant="text"
						@click="addMomentLike(moment)"
					/>
					<span class="text-caption ml-1">{{ moment.like_count || 0 }}</span>
					
					<v-btn
						:icon="formatBookmark(moment)"
						:color="colorIconPrimary(moment)"
						variant="text"
						class="ml-3"
						@click="addMomentBookmark(moment)"
					/>
				</div>
				
				<div class="d-flex align-center ml-auto">
					<v-icon size="small" class="mr-1">mdi-message-text</v-icon>
					<span class="text-caption">{{ moment.tweets?.length || 0 }}</span>
					<v-icon size="small" class="ml-3 mr-1">mdi-eye</v-icon>
					<span class="text-caption">{{ moment.viewCount || 0 }}</span>
				</div>
			</v-card-actions>
		</v-card>
	</v-overlay>
</template>

<script setup lang="ts">
import { useMomentStore } from '@/stores/momentStore'

// 型定義
interface TweetData {
	id: string
	content: string
	thumbUrl: string
	createdAt: Date
	viewCount: number
	like_count: number
}

interface MomentData {
	id: string
	title: string
	description: string
	tweets: TweetData[]
	viewCount: number
	createdAt: Date
	setting: {
		name: string
		profileUrl: string
	}
	like_count: number
	is_like: boolean
	is_bookmark: boolean
}

// Props定義
interface Props {
	moment: MomentData
}
const props = defineProps<Props>()

const momentStore = useMomentStore()

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
const addLike = async (moment: any): Promise<void> => {
	if (moment.is_like) {
		await likeStore.deleteItem(moment.id)
		moment.is_like = false
		moment.like_count--
	} else {
		await likeStore.create(moment.id, moment.title, moment.uid)
		moment.is_like = true
		moment.like_count++
	}
}

// モーメントのブックマーク
const addBookmark = async (moment: any): Promise<void> => {
	if (moment.is_bookmark) {
		await bookmarkStore.deleteItem(moment.id)
		moment.is_bookmark = false
	} else {
		await bookmarkStore.create(moment.id)
		moment.is_bookmark = true
	}
}
</script>

<style scoped>
.moment-card {
	overflow: hidden;
}

.tweet-image-container {
	position: relative;
	width: 100%;
	height: 560px;
}

.tweet-image {
	width: 100%;
	height: 100%;
}

.tweet-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	color: white;
	padding: 20px;
	display: flex;
	align-items: flex-start;
	justify-content: flex-start;
	backdrop-filter: blur(2px);
}

.tweet-content {
	font-size: 16px;
	line-height: 1.6;
	word-break: break-word;
	white-space: pre-wrap;
	text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
	max-width: 100%;
}

.moment-actions {
	padding: 12px 16px;
	background-color: #f8f9fa;
	border-top: 1px solid #e0e0e0;
}
</style>
