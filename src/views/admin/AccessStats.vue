<template>
	<v-container>
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
						アクセス数分布
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

		<v-row class="mt-4">
			<v-col cols="12">
				<v-card>
					<v-card-title>
						<v-icon start icon="mdi-clock" />
						最近のアクセス状況
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
	</v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from "pinia"
import { useBlogStore } from '@/stores/blogStore'
import { format } from 'date-fns'

const blogStore = useBlogStore()
const {
	blogList
} = storeToRefs(blogStore)

const recentHeaders = [
	{ title: "記事タイトル", value: "title" },
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
		.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
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
const getRankColor = (rank) => {
	if (rank === 1) return 'gold'
	if (rank === 2) return 'silver'
	if (rank === 3) return 'bronze'
	return 'grey'
}

// アクセス数に応じた色を返す関数
const getViewCountColor = (viewCount) => {
	if (!viewCount || viewCount === 0) return 'grey'
	if (viewCount < 10) return 'blue'
	if (viewCount < 50) return 'green'
	if (viewCount < 100) return 'orange'
	return 'red'
}

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm')
}

// データ取得
const fetchData = async () => {
	await blogStore.getList()
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
