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
import { useRoute, useRouter } from 'vue-router'
import { useLikeStore } from '@/stores/likeStore'

const route = useRoute()
const router = useRouter()
const likeStore = useLikeStore()
const likeList = ref([])

const headers = [
	{title: "ユーザー名", value: "user" }
]

// 一覧取得
const fetchLikeList = async () => {
	likeList.value = await likeStore.getListForBlog(route.params.blog_id)
}

// ブログ一覧ページに移動
const goToList = () => {
	router.push({path: "/admin", query: {id: "1"}})
}

onMounted(async () => {
	await fetchLikeList()
})
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
