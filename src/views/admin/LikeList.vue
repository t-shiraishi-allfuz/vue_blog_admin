<template>
	<v-container>
		<v-card class="like-list">
			<v-data-table class="like-list" :headers="headers" :items="likeList" :items-per-page="30" no-data-text="いいねがありません">
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>いいね一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
					</v-toolbar>
				</template>
				<template v-slot:[`item.user`]="{ item }">
					{{ item.user.name }}
				</template>
			</v-data-table>
		</v-card>
		<v-card-actions>
			<v-btn @click="goToList">一覧に戻る</v-btn>
		</v-card-actions>
	</v-container>
</template>

<script setup lang="ts">
import { useLikeStore } from '@/stores/likeStore'

// 型定義
interface LikeData {
	id: string
	uid: string
	blog_id: string
	user: {
		name: string
	}
	createdAt: Date
	updatedAt: Date
}

interface HeaderItem {
	title: string
	value: string
}

const route = useRoute()
const router = useRouter()
const likeStore = useLikeStore()
const likeList = ref<LikeData[]>([])

const headers: HeaderItem[] = [
	{title: "ユーザー名", value: "user" }
]

// 一覧取得
const fetchLikeList = async (): Promise<void> => {
	const blogId = route.params.blog_id as string
	if (!blogId) {
		console.error('ブログIDが取得できません')
		return
	}
	likeList.value = await likeStore.getListForBlog(blogId) as LikeData[]
}

// ブログ一覧ページに移動
const goToList = (): void => {
	router.push({path: "/admin", query: {id: "1"}})
}

onMounted(async (): Promise<void> => {
	await fetchLikeList()
})
</script>