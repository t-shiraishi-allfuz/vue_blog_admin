<template>
	<v-container>
		<TweetCreateDialog
			v-model="isTweetDialogOpen"
			:tweet="tweetToEdit"
			@saved="updateTweet"
		/>
		<TweetCard
			v-if="tweetToPreview"
			v-model="isPreviewDialogOpen"
			:tweet="tweetToPreview"
			:setting="tweetToPreview.setting as any"
		/>
		<v-card class="tweet-list">
			<v-data-table
				class="tweet-list"
				:headers="headers"
				:items="filteredTweetList"
				:items-per-page="30"
				no-data-text="つぶやきがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>つぶやき一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-text-field
							label="検索"
							v-model="search"
							append-inner-icon="mdi-magnify"
							single-line
							hide-details
						/>
					</v-toolbar>
				</template>
				<template v-slot:[`item.content`]="{ item }">
					<div 
						class="tweet-content clickable-content"
						@click="openEditDialog(item)"
					>
						{{ truncateContent(item.content) }}
					</div>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.isPublished`]="{ item }">
					<v-chip
						:color="item.isPublished ? 'success' : 'warning'"
						size="small"
						variant="outlined"
					>
						{{ item.isPublished ? '公開中' : '下書き' }}
					</v-chip>
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
				<template v-slot:[`item.like_count`]="{ item }">
					<div v-if="item.like_count > 0">
						<a href="#" @click.prevent="goToLikeList(item)">
							{{ item.like_count }}
						</a>
					</div>
					<div v-else>
						<span>{{ item.like_count }}</span>
					</div>
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<div class="action-buttons">
						<v-icon
							color="info"
							icon="mdi-eye"
							aria-label="プレビュー"
							role="button"
							@click="openPreviewDialog(item)"
						/>
						<v-icon
							color="blue"
							icon="mdi-pencil"
							aria-label="編集"
							role="button"
							@click="openEditDialog(item)"
						/>
						<v-icon
							color="red"
							icon="mdi-delete"
							aria-label="削除"
							role="button"
							@click="openDeleteDialog(item)"
						/>
					</div>
				</template>
			</v-data-table>
		</v-card>
	</v-container>
</template>

<script setup lang="ts">
import { useTweetStore } from '@/stores/tweetStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'

const router = useRouter()
const tweetStore = useTweetStore()

const {
	tweetList
} = storeToRefs(tweetStore)

const search = ref('')
const tweetToDelete = ref<any>(null)
const isTweetDialogOpen = ref<boolean>(false)
const tweetToEdit = ref<any>(null)
const tweetToPreview = ref<any>(null)
const isPreviewDialogOpen = ref<boolean>(false)

const headers = [
	{title: "つぶやき内容", value: "content" },
	{title: "投稿日時", value: "createdAt", sortable: true },
	{title: "ステータス", value: "isPublished", sortable: true },
	{title: "アクセス数", value: "viewCount", sortable: true },
	{title: "いいね", value: "like_count", sortable: true },
	{title: "操作", value: "actions", sortable: false },
]

// 一覧取得
const fetchTweetList = async () => {
	await tweetStore.getPublishedListForAdmin()
}

// プレビューダイアログを開く
const openPreviewDialog = (tweet: any) => {
	tweetToPreview.value = tweet
	isPreviewDialogOpen.value = true
}

// 編集ダイアログを開く
const openEditDialog = (tweet: any) => {
	tweetToEdit.value = tweet
	isTweetDialogOpen.value = true
}

// 編集ダイアログを閉じる
const closeEditDialog = () => {
	isTweetDialogOpen.value = false
	tweetToEdit.value = null
}

// つぶやきを更新（savedイベントのハンドラー）
const updateTweet = async () => {
	await fetchTweetList()
	closeEditDialog()
}

// ダイアログが閉じられたときの処理
watch(isTweetDialogOpen, (newValue) => {
	if (!newValue) {
		// ダイアログが閉じられたとき、編集データをクリア
		tweetToEdit.value = null
	}
})

// 個別削除確認ダイアログを開く
const openDeleteDialog = async (tweet: any) => {
	tweetToDelete.value = tweet
	
	const result = await Swal.fire({
		title: '削除確認',
		text: 'このつぶやきを本当に削除しますか？',
		showCancelButton: true,
		confirmButtonColor: '#27C1A3',
		cancelButtonColor: '#9e9e9e',
		confirmButtonText: '削除',
		cancelButtonText: 'キャンセル',
		reverseButtons: true,
		buttonsStyling: true,
		customClass: {
			confirmButton: 'swal2-confirm-fixed-width',
			cancelButton: 'swal2-cancel-fixed-width'
		},
		didOpen: () => {
			// ダイアログが開いた後にボタンのスタイルを適用
			const confirmBtn = document.querySelector('.swal2-confirm-fixed-width') as HTMLElement
			const cancelBtn = document.querySelector('.swal2-cancel-fixed-width') as HTMLElement
			if (confirmBtn) {
				confirmBtn.style.minWidth = '150px'
				confirmBtn.style.width = '150px'
			}
			if (cancelBtn) {
				cancelBtn.style.minWidth = '150px'
				cancelBtn.style.width = '150px'
			}
		}
	})

	if (result.isConfirmed && tweetToDelete.value) {
		try {
			await tweetStore.deleteItem(tweetToDelete.value.id)
			await fetchTweetList()
			
			// 削除完了メッセージ
			Swal.fire({
				title: '削除完了',
				text: 'つぶやきを削除しました',
				icon: 'success',
				timer: 1500,
				showConfirmButton: false
			})
		} catch (error) {
			console.error('つぶやき削除エラー:', error)
			Swal.fire({
				title: 'エラー',
				text: 'つぶやきの削除に失敗しました',
				icon: 'error'
			})
		}
	}
}

// 検索条件に基づくつぶやきフィルタリング
const filteredTweetList = computed(() => {
	if (!search.value) return tweetList.value

	return tweetList.value.filter(tweet =>
		tweet.content.toLowerCase().includes(search.value.toLowerCase())
	)
})

// 日時フォーマット関数
const formatDate = (date: any) => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss');
}

// アクセス数に応じた色を返す関数
const getViewCountColor = (viewCount: any) => {
	if (!viewCount || viewCount === 0) return 'grey'
	if (viewCount < 10) return 'blue'
	if (viewCount < 50) return 'green'
	if (viewCount < 100) return 'orange'
	return 'red'
}

// つぶやき内容を切り詰める関数
const truncateContent = (content: any) => {
	if (!content) return ''
	if (content.length <= 10) return content
	return content.substring(0, 10) + '...'
}

// いいね一覧に移動
const goToLikeList = (tweet: any) => {
	router.push({path: "/admin/like_list", query: {tweet_id: tweet.id}});
}

onMounted(async () => {
	await fetchTweetList()
})
</script>

<style scoped>
	.action-buttons {
		display: flex;
		gap: 8px;
	}

	.tweet-content {
		max-width: 300px;
		word-wrap: break-word;
	}

	.clickable-content {
		cursor: pointer;
		transition: background-color 0.2s ease;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.clickable-content:hover {
		background-color: rgba(0, 0, 0, 0.04);
	}

	/* SweetAlert2ボタンの固定幅スタイル */
	:deep(.swal2-confirm-fixed-width) {
		min-width: 150px !important;
		width: 150px !important;
		box-sizing: border-box !important;
	}

	:deep(.swal2-cancel-fixed-width) {
		min-width: 150px !important;
		width: 150px !important;
		box-sizing: border-box !important;
	}
</style>

<style>
/* グローバルスタイルでSweetAlert2ボタンの幅を固定 */
.swal2-confirm-fixed-width {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}

.swal2-cancel-fixed-width {
	min-width: 150px !important;
	width: 150px !important;
	box-sizing: border-box !important;
}
</style>
