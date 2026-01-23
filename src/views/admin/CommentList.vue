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
					<a @click.prevent="goToList" class="blog-title" href="#">
						{{ item.body }}
					</a>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.reply_count`]="{ item }">
					<span>{{ (item as any).reply_count || 0 }}</span>
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<v-icon class="delete-icon" icon="mdi-delete" aria-label="削除" role="button" @click="openDeleteDialog(item)" />
				</template>
			</v-data-table>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import { useCommentStore } from '@/stores/commentStore'
import { format } from 'date-fns'
import { AppSwal } from '@/utils/swal'

// 型定義
interface CommentData {
	id: string
	uid: string
	blog_id: string
	body: string
	reply_id?: string
	createdAt: Date
	updatedAt: Date
	setting?: any
	reply?: any
	title?: string
	reply_count?: number
}

interface HeaderItem {
	title: string
	value: string
	sortable?: boolean
}

const route = useRoute()
const router = useRouter()
const commentStore = useCommentStore()

const {
	commentList
} = storeToRefs(commentStore)

const commentToDelete = ref<CommentData | null>(null)

const headers: HeaderItem[] = [
	{title: "コメント", value: "comment" },
	{title: "投稿日時", value: "createdAt" },
	{title: "返信数", value: "reply_count" },
	{title: "削除", value: "actions", sortable: false },
]

// 一覧取得
const fetchCommentList = async (): Promise<void> => {
	const blogId = route.params.blog_id as string
	if (!blogId) {
		console.error('ブログIDが取得できません')
		return
	}
	await commentStore.getList(blogId)
}

// 個別削除確認ダイアログを開く
const openDeleteDialog = async (comment: CommentData): Promise<void> => {
	commentToDelete.value = comment

	const result = await AppSwal.fire({
		title: '削除確認',
		text: 'このコメントを本当に削除しますか？',
		showConfirmButton: true,
		confirmButtonText: '削除',
	})

	if (result.isConfirmed && commentToDelete.value) {
		await commentStore.deleteItem(commentToDelete.value.id)
		await fetchCommentList()
		
		// 削除完了メッセージ
		AppSwal.fire({
			title: '削除完了',
			text: 'コメントを削除しました',
			icon: 'success',
			timer: 1500,
		})
	}
}

// 日時フォーマット関数
const formatDate = (date: any): string => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// ブログ一覧ページに移動
const goToList = (): void => {
	router.push({path: "/admin", query: {id: "3"}})
}

onMounted(async (): Promise<void> => {
	await fetchCommentList()
})
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
