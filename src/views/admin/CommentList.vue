<template>
	<v-container>
		<v-card class="comment-list">
			<v-data-table class="comment-list" :headers="headers" :items="commentList" :items-per-page="30" no-data-text="コメントがありません">
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>コメント一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
					</v-toolbar>
				</template>
				<template v-slot:[`item.comment`]="{ item }">
					<a @click.prevent="goToList(item)" class="blog-title" href="#">
						{{ item.title }}
					</a>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.reply_count`]="{ item }">
					<span>{{ item.reply_count }}</span>
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<v-icon class="delete-icon" :icon="mdiDelete" aria-label="削除" role="button" @click="openDeleteDialog(item)" />
				</template>
			</v-data-table>
		</v-card>
		<v-dialog v-model="deleteDialog" max-width="400px">
			<v-card>
				<v-card-title>削除確認</v-card-title>
				<v-card-text>このコメントを本当に削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="deleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="deleteComment">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCommentStore } from '@/stores/commentStore'
import { format } from 'date-fns'

const route = useRoute()
const router = useRouter()
const commentStore = useCommentStore()
const commentList = ref([])

const deleteDialog = ref(false)
const commentToDelete = ref(null)

const headers = [
	{title: "コメント", value: "comment" },
	{title: "投稿日時", value: "createdAt" },
	{title: "返信数", value: "reply_count" },
	{title: "削除", value: "actions", sortable: false },
]

// 一覧取得
const fetchCommentList = async () => {
	try {
		commentList.value = await commentStore.getList(route.params.blog_id)
	} catch (error) {
		alert(error)
	}
}

// 個別削除確認ダイアログを開く
const openDeleteDialog = (blog) => {
	commentToDelete.value = blog
	deleteDialog.value = true
}

// 個別削除を確定する
const deleteComment = async () => {
	try {
		await commentStore.deleteItem(commentToDelete.value.id)
		commentList.value = commentList.value.filter(comment => comment.id !== commentToDelete.value.id)
	} catch (error) {
		alert(error)
	}
	deleteDialog.value = false
}

// 日時フォーマット関数
const formatDate = (date) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// ブログ一覧ページに移動
const goToList = () => {
	router.push({path: "/admin", query: {id: "3"}})
}

onMounted(async () => {
	await fetchCommentList()
})
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
