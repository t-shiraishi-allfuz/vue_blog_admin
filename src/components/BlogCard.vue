<template>
	<v-card
		class="blog-card"
		outlined
		@contextmenu.prevent="copyBlogUrl"
	>
		<div class="header-image">
			<v-img
				:src="props.blog.thumbUrl"
				aspect-ratio="16/9"
				cover
			/>
		</div>
		<v-card-text>
			<h4 class="text-h5 font-weight-bold mb-4">{{ props.blog.title }}</h4>
			<div class="mb-5 text-body-3">{{ props.blog.summary }}</div>
			<v-row class="d-flex">
				<v-avatar
					class="mt-2"
					size="48"
					:image="props.setting.profileUrl"
					end
				/>
				<v-col>
					<div class="ml-1 mb-1">
						{{ props.setting.name }}
					</div>
					<div class="ml-1 mb-1">
						<v-icon icon="mdi-clock" start />
						{{ formatDate(props.blog.createdAt) }}
					</div>
				</v-col>
			</v-row>
		</v-card-text>
		<div class="d-flex">
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatLike(props.blog)"
					:color="colorIconPink(props.blog.is_like)"
					variant="text"
					@click="addLike(props.blog)"
				/>
				<div class="text-truncate">{{ props.blog.like_count }}</div>
			</div>
		</div>
	</v-card>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

// 型定義
interface BlogData {
	id: string
	title: string
	summary: string
	thumbUrl: string
	createdAt: Date
	is_like: boolean
	like_count: number
	[key: string]: any
}

interface SettingData {
	name: string
	profileUrl: string
	[key: string]: any
}

// Props定義
interface Props {
	blog: BlogData
	setting: SettingData
}

const props = defineProps<Props>()

// 日時フォーマット関数
const formatDate = (date: Date): string => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// アイコン設定
const formatLike = (blog: BlogData): string => {
	return blog.is_like ? "mdi-heart" : "mdi-heart-outline"
}

// アイコン設定（カラー）
const colorIconPink = (flag: boolean): string => {
	return flag ? "pink" : "black"
}

// いいね機能（仮実装）
const addLike = (blog: BlogData): void => {
	// TODO: いいね機能の実装
	console.log('いいね機能:', blog.id)
}

// ブログURLをコピー
const copyBlogUrl = async (): Promise<void> => {
	try {
		const blogUrl = `${window.location.origin}/blog_detail?blog_id=${props.blog.id}`
		await navigator.clipboard.writeText(blogUrl)
		
		// 成功メッセージを表示（簡易的な方法）
		const toast = document.createElement('div')
		toast.textContent = 'URLをコピーしました'
		toast.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background-color: #4caf50;
			color: white;
			padding: 12px 24px;
			border-radius: 4px;
			z-index: 10000;
			box-shadow: 0 2px 8px rgba(0,0,0,0.2);
		`
		document.body.appendChild(toast)
		setTimeout(() => {
			document.body.removeChild(toast)
		}, 2000)
	} catch (error) {
		console.error('URLコピーエラー:', error)
	}
}
</script>

<style scoped>
.blog-card {
	min-width: 200px;
	min-height: 250px;
	max-width: 300px;

	.v-responsive {
		min-width: 100%;
		min-height: 150px;
		max-height: 150px;
	}
}
</style>
