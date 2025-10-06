<template>
	<v-container>
		<!-- ブログ統計 -->
		<v-row>
			<v-col cols="12">
				<h2 class="text-h5 mb-4">
					<v-icon start icon="mdi-post" />
					ブログ統計
				</h2>
			</v-col>
		</v-row>
		<v-row>
			<v-col cols="12" md="4">
				<v-card class="pa-4" color="primary" variant="tonal">
					<v-card-title class="text-h6">総アクセス数</v-card-title>
					<v-card-text class="text-h4 font-weight-bold">
						{{ totalAccessCount.toLocaleString() }}
					</v-card-text>
				</v-card>
			</v-col>
			<v-col cols="12" md="4">
				<v-card class="pa-4" color="success" variant="tonal">
					<v-card-title class="text-h6">総記事数</v-card-title>
					<v-card-text class="text-h4 font-weight-bold">
						{{ totalBlogCount }}
					</v-card-text>
				</v-card>
			</v-col>
			<v-col cols="12" md="4">
				<v-card class="pa-4" color="info" variant="tonal">
					<v-card-title class="text-h6">平均アクセス数</v-card-title>
					<v-card-text class="text-h4 font-weight-bold">
						{{ averageAccessCount.toFixed(1) }}
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<!-- つぶやき統計 -->
		<v-row class="mt-6">
			<v-col cols="12">
				<h2 class="text-h5 mb-4">
					<v-icon start icon="mdi-twitter" />
					つぶやき統計
				</h2>
			</v-col>
		</v-row>
		<v-row>
			<v-col cols="12" md="4">
				<v-card class="pa-4" color="primary" variant="tonal">
					<v-card-title class="text-h6">総つぶやきアクセス数</v-card-title>
					<v-card-text class="text-h4 font-weight-bold">
						{{ tweetStats.totalTweetAccessCount.toLocaleString() }}
					</v-card-text>
				</v-card>
			</v-col>
			<v-col cols="12" md="4">
				<v-card class="pa-4" color="success" variant="tonal">
					<v-card-title class="text-h6">総つぶやき数</v-card-title>
					<v-card-text class="text-h4 font-weight-bold">
						{{ tweetStats.totalTweetCount }}
					</v-card-text>
				</v-card>
			</v-col>
			<v-col cols="12" md="4">
				<v-card class="pa-4" color="info" variant="tonal">
					<v-card-title class="text-h6">平均つぶやきアクセス数</v-card-title>
					<v-card-text class="text-h4 font-weight-bold">
						{{ tweetStats.averageTweetAccessCount.toFixed(1) }}
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<v-row class="mt-4">
			<v-col cols="12" md="6">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-trending-up" />
						人気記事ランキング
					</v-card-title>
					<v-card-text>
						<v-list>
							<v-list-item
								v-for="(blog, index) in popularBlogs"
								:key="blog.id"
								class="px-0"
							>
								<template v-slot:prepend>
									<v-chip
										:color="getRankColor(index + 1)"
										size="small"
										class="mr-2"
									>
										{{ index + 1 }}
									</v-chip>
								</template>
								<v-list-item-title class="text-truncate">
									{{ blog.title }}
								</v-list-item-title>
								<v-list-item-subtitle>
									<v-icon start icon="mdi-eye" size="small" />
									{{ blog.viewCount || 0 }} 回
								</v-list-item-subtitle>
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>

			<v-col cols="12" md="6">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-chart-bar" />
						記事アクセス数分布
					</v-card-title>
					<v-card-text>
						<v-list>
							<v-list-item>
								<v-list-item-title>0回</v-list-item-title>
								<v-list-item-subtitle>{{ accessDistribution.zero }} 記事</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>1-10回</v-list-item-title>
								<v-list-item-subtitle>{{ accessDistribution.low }} 記事</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>11-50回</v-list-item-title>
								<v-list-item-subtitle>{{ accessDistribution.medium }} 記事</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>51-100回</v-list-item-title>
								<v-list-item-subtitle>{{ accessDistribution.high }} 記事</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>100回以上</v-list-item-title>
								<v-list-item-subtitle>{{ accessDistribution.veryHigh }} 記事</v-list-item-subtitle>
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<!-- つぶやきランキングと分布 -->
		<v-row class="mt-4">
			<v-col cols="12" md="6">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-trending-up" />
						人気つぶやきランキング
					</v-card-title>
					<v-card-text>
						<v-list>
							<v-list-item
								v-for="(tweet, index) in tweetStats.popularTweets"
								:key="tweet.id"
								class="px-0"
							>
								<template v-slot:prepend>
									<v-chip
										:color="getRankColor(index + 1)"
										size="small"
										class="mr-2"
									>
										{{ index + 1 }}
									</v-chip>
								</template>
								<v-list-item-title class="text-truncate" style="max-width: 200px;">
									{{ tweet.content }}
								</v-list-item-title>
								<v-list-item-subtitle>
									<v-icon start icon="mdi-eye" size="small" />
									{{ tweet.viewCount || 0 }} 回
								</v-list-item-subtitle>
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>

			<v-col cols="12" md="6">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-chart-bar" />
						つぶやきアクセス数分布
					</v-card-title>
					<v-card-text>
						<v-list>
							<v-list-item>
								<v-list-item-title>0回</v-list-item-title>
								<v-list-item-subtitle>{{ tweetStats.accessDistribution.zero }} つぶやき</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>1-10回</v-list-item-title>
								<v-list-item-subtitle>{{ tweetStats.accessDistribution.low }} つぶやき</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>11-50回</v-list-item-title>
								<v-list-item-subtitle>{{ tweetStats.accessDistribution.medium }} つぶやき</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>51-100回</v-list-item-title>
								<v-list-item-subtitle>{{ tweetStats.accessDistribution.high }} つぶやき</v-list-item-subtitle>
							</v-list-item>
							<v-list-item>
								<v-list-item-title>100回以上</v-list-item-title>
								<v-list-item-subtitle>{{ tweetStats.accessDistribution.veryHigh }} つぶやき</v-list-item-subtitle>
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<v-row class="mt-4">
			<v-col cols="12">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-clock" />
						最近の記事アクセス状況
					</v-card-title>
					<v-card-text>
						<v-data-table
							:headers="recentHeaders"
							:items="recentAccessBlogs"
							:items-per-page="10"
							no-data-text="データがありません"
						>
							<template v-slot:[`item.title`]="{ item }">
								<div class="text-truncate" style="max-width: 200px;">
									{{ item.title }}
								</div>
							</template>
							<template v-slot:[`item.viewCount`]="{ item }">
								<v-chip
									:color="getViewCountColor(item.viewCount)"
									size="small"
									variant="outlined"
								>
									<v-icon start icon="mdi-eye" />
									{{ item.viewCount || 0 }}
								</v-chip>
							</template>
							<template v-slot:[`item.createdAt`]="{ item }">
								{{ formatDate(item.createdAt) }}
							</template>
							<template v-slot:[`item.isPublished`]="{ item }">
								{{ item.isPublished ? '公開' : '下書き' }}
							</template>
						</v-data-table>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>

		<!-- つぶやきの最近のアクセス状況 -->
		<v-row class="mt-4">
			<v-col cols="12">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-clock" />
						最近のつぶやきアクセス状況
					</v-card-title>
					<v-card-text>
						<v-data-table
							:headers="tweetRecentHeaders"
							:items="tweetStats.recentTweets"
							:items-per-page="10"
							no-data-text="データがありません"
						>
							<template v-slot:[`item.content`]="{ item }">
								<div class="text-truncate" style="max-width: 200px;">
									{{ item.content }}
								</div>
							</template>
							<template v-slot:[`item.viewCount`]="{ item }">
								<v-chip
									:color="getViewCountColor(item.viewCount)"
									size="small"
									variant="outlined"
								>
									<v-icon start icon="mdi-eye" />
									{{ item.viewCount || 0 }}
								</v-chip>
							</template>
							<template v-slot:[`item.createdAt`]="{ item }">
								{{ formatDate(item.createdAt) }}
							</template>
							<template v-slot:[`item.isPublished`]="{ item }">
								{{ item.isPublished ? '公開' : '下書き' }}
							</template>
						</v-data-table>
					</v-card-text>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { useBlogStore } from '@/stores/blogStore'
import { useAccessLogStore } from '@/stores/accessLogStore'
import { format } from 'date-fns'

const blogStore = useBlogStore()
const accessLogStore = useAccessLogStore()
const {
	blogList
} = storeToRefs(blogStore)

// つぶやき統計データの型定義
interface TweetStats {
	totalTweetCount: number
	totalTweetAccessCount: number
	averageTweetAccessCount: number
	popularTweets: Array<{
		id: string
		content: string
		viewCount: number
		createdAt: Date
		isPublished: boolean
	}>
	recentTweets: Array<{
		id: string
		content: string
		viewCount: number
		createdAt: Date
		isPublished: boolean
	}>
	accessDistribution: {
		zero: number
		low: number
		medium: number
		high: number
		veryHigh: number
	}
}

const tweetStats = ref<TweetStats>({
	totalTweetCount: 0,
	totalTweetAccessCount: 0,
	averageTweetAccessCount: 0,
	popularTweets: [],
	recentTweets: [],
	accessDistribution: {
		zero: 0,
		low: 0,
		medium: 0,
		high: 0,
		veryHigh: 0
	}
})

const recentHeaders = [
	{ title: "記事タイトル", value: "title" },
	{ title: "アクセス数", value: "viewCount" },
	{ title: "投稿日時", value: "createdAt" },
	{ title: "ステータス", value: "isPublished" }
]

const tweetRecentHeaders = [
	{ title: "つぶやき内容", value: "content" },
	{ title: "アクセス数", value: "viewCount" },
	{ title: "投稿日時", value: "createdAt" },
	{ title: "ステータス", value: "isPublished" }
]

// 総アクセス数
const totalAccessCount = computed(() => {
	return blogList.value.reduce((sum, blog) => sum + (blog.viewCount || 0), 0)
})

// 総記事数
const totalBlogCount = computed(() => {
	return blogList.value.length
})

// 平均アクセス数
const averageAccessCount = computed(() => {
	if (totalBlogCount.value === 0) return 0
	return totalAccessCount.value / totalBlogCount.value
})

// 人気記事ランキング（アクセス数順）
const popularBlogs = computed(() => {
	return [...blogList.value]
		.filter(blog => blog.isPublished)
		.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
		.slice(0, 10)
})

// 最近のアクセス状況（公開記事のみ）
const recentAccessBlogs = computed(() => {
	return [...blogList.value]
		.filter(blog => blog.isPublished)
		.sort((a, b) => {
			try {
				const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt ? new Date(a.createdAt) : new Date(0))
				const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt ? new Date(b.createdAt) : new Date(0))
				
				// 無効な日付の場合は0を返す
				if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
					return 0
				}
				
				return dateB.getTime() - dateA.getTime()
			} catch (error) {
				console.error('日付ソートエラー:', error)
				return 0
			}
		})
		.slice(0, 20)
})

// アクセス数分布
const accessDistribution = computed(() => {
	const distribution = {
		zero: 0,
		low: 0,
		medium: 0,
		high: 0,
		veryHigh: 0
	}

	blogList.value.forEach(blog => {
		const count = blog.viewCount || 0
		if (count === 0) {
			distribution.zero++
		} else if (count <= 10) {
			distribution.low++
		} else if (count <= 50) {
			distribution.medium++
		} else if (count <= 100) {
			distribution.high++
		} else {
			distribution.veryHigh++
		}
	})
	return distribution
})

// ランキング色を返す関数
const getRankColor = (rank: number): string => {
	if (rank === 1) return 'gold'
	if (rank === 2) return 'silver'
	if (rank === 3) return 'bronze'
	return 'grey'
}

// アクセス数に応じた色を返す関数
const getViewCountColor = (viewCount: number): string => {
	if (!viewCount || viewCount === 0) return 'grey'
	if (viewCount < 10) return 'blue'
	if (viewCount < 50) return 'green'
	if (viewCount < 100) return 'orange'
	return 'red'
}

// 日時フォーマット関数
const formatDate = (date: Date | null): string => {
	if (!date) return '不明'
	
	try {
		// 既にDateオブジェクトの場合はそのまま使用
		const dateObj = date instanceof Date ? date : new Date(date)
		
		// 無効な日付の場合は不明を返す
		if (isNaN(dateObj.getTime())) {
			return '不明'
		}
		
		return format(dateObj, 'yyyy/MM/dd HH:mm')
	} catch (error) {
		console.error('日付フォーマットエラー:', error)
		return '不明'
	}
}

// データ取得
const fetchData = async () => {
	await blogStore.getList()
	// つぶやき統計を取得
	try {
		const stats = await accessLogStore.getTweetStats()
		tweetStats.value = stats as TweetStats
	} catch (error) {
		console.error('つぶやき統計の取得に失敗しました:', error)
	}
}

onMounted(async () => {
	await fetchData()
})
</script>

<style scoped>
.v-card {
	margin-bottom: 16px;
}
</style>
