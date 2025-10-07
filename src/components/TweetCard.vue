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
		</v-card>
	</v-overlay>
</template>

<script setup lang="ts">
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
