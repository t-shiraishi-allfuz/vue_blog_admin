<template>
	<v-card
		class="tweet-card"
		outlined
		@click="goToTweetDetail"
	>
		<div class="header-image">
			<v-img
				:src="tweet.thumbUrl"
				aspect-ratio="16/9"
				cover
			/>
		</div>
		<v-card-text>
			<div class="mb-3 text-body-1 tweet-content">{{ tweet.content }}</div>
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
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					icon="mdi-comment-outline"
					color="black"
					variant="text"
					@click.stop="goToTweetDetail"
				/>
				<div class="text-truncate">{{ tweet.comment_count }}</div>
			</div>
			<div class="d-flex align-center text-caption text-medium-emphasis me-1">
				<v-btn
					:icon="formatBookmark(tweet)"
					:color="colorIconBlue(tweet.is_bookmark)"
					variant="text"
					@click.stop="addBookmark(tweet)"
				/>
			</div>
			<v-spacer></v-spacer>
			<div class="d-flex align-center text-caption text-medium-emphasis">
				<v-icon icon="mdi-eye" start />
				{{ tweet.viewCount }}
			</div>
		</v-card-actions>
	</v-card>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'

// 型定義
interface TweetData {
	id: string
	content: string
	thumbUrl: string
	createdAt: Date
	is_like: boolean
	like_count: number
	is_bookmark: boolean
	comment_count: number
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
const bookmarkStore = useBookmarkStore()

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

// ブックマークアイコン設定
const formatBookmark = (tweet: TweetData): string => {
	return tweet.is_bookmark ? "mdi-bookmark" : "mdi-bookmark-outline"
}

// ブックマークアイコンカラー設定
const colorIconBlue = (flag: boolean): string => {
	return flag ? "blue" : "black"
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

// ブックマーク追加/削除
const addBookmark = async (tweet: TweetData): Promise<void> => {
	try {
		if (tweet.is_bookmark) {
			await bookmarkStore.deleteBookmark(tweet.id)
			tweet.is_bookmark = false
		} else {
			await bookmarkStore.addBookmark(tweet.id)
			tweet.is_bookmark = true
		}
	} catch (error) {
		console.error('ブックマーク処理エラー:', error)
		alert('ブックマークの処理に失敗しました')
	}
}

// つぶやき詳細ページへ遷移
const goToTweetDetail = (): void => {
	router.push({ path: '/tweet_detail', query: { id: props.tweet.id } })
}
</script>

<style scoped>
.tweet-card {
	min-width: 200px;
	max-width: 400px;
	cursor: pointer;
	transition: transform 0.2s ease-in-out;
}

.tweet-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-image {
	.v-responsive {
		min-width: 100%;
		min-height: 200px;
		max-height: 200px;
	}
}

.tweet-content {
	line-height: 1.5;
	word-break: break-word;
	white-space: pre-wrap;
}
</style>
