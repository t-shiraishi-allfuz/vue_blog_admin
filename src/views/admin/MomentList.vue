<template>
	<v-container>
		<v-card class="moment-list">
			<v-data-table
				class="moment-list"
				:headers="headers"
				:items="filteredMomentList"
				:items-per-page="30"
				no-data-text="モーメントがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>モーメント一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-btn
							color="success"
							variant="flat"
							@click="goToCreatePage"
						>
							新規作成
						</v-btn>
						<v-text-field
							class="ml-4"
							label="検索"
							v-model="search"
							append-inner-icon="mdi-magnify"
							single-line
							hide-details
						/>
					</v-toolbar>
				</template>
				
				<template v-slot:[`item.title`]="{ item }">
					<div 
						class="moment-title clickable-content"
						@click="goToEditPage(item)"
					>
						{{ truncateContent(item.title) }}
					</div>
				</template>
				
				<template v-slot:[`item.description`]="{ item }">
					<div class="moment-description">
						{{ truncateContent(item.description) }}
					</div>
				</template>
				
				<template v-slot:[`item.tweetCount`]="{ item }">
					<v-chip
						color="info"
						size="small"
						variant="outlined"
					>
						<v-icon start icon="mdi-message-text" />
						{{ item.tweets?.length || 0 }}
					</v-chip>
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
				
				<template v-slot:[`item.actions`]="{ item }">
					<div class="action-buttons">
						<v-btn
							color="info"
							icon="mdi-eye"
							variant="text"
							@click="openPreviewDialog(item)"
						/>
						<v-btn
							color="blue"
							icon="mdi-pencil"
							variant="text"
							@click="goToEditPage(item)"
						/>
						<v-btn
							color="red"
							icon="mdi-delete"
							variant="text"
							@click="openDeleteDialog(item)"
						/>
					</div>
				</template>
			</v-data-table>
		</v-card>
		<MomentCard
			v-if="momentDetail"
			v-model="isPreviewDialogOpen"
			:moment="momentDetail"
		/>
	</v-container>
</template>

<script setup lang="ts">
import { useMomentStore } from '@/stores/momentStore'
import { format } from 'date-fns'
import { AppSwal } from '@/utils/swal'

const router = useRouter()
const momentStore = useMomentStore()

const {
	momentList
} = storeToRefs(momentStore)

const search = ref('')
const momentDetail = ref<any>(null)
const isPreviewDialogOpen = ref<boolean>(false)

const headers = [
	{title: "タイトル", value: "title" },
	{title: "説明", value: "description" },
	{title: "つぶやき数", value: "tweetCount", sortable: false },
	{title: "作成日時", value: "createdAt", sortable: true },
	{title: "ステータス", value: "isPublished", sortable: true },
	{title: "アクセス数", value: "viewCount", sortable: true },
	{title: "操作", value: "actions", sortable: false },
]

// 一覧取得
const fetchMomentList = async () => {
	await momentStore.getPublishedListForAdmin()
}

// 新規作成ページに遷移
const goToCreatePage = () => {
	router.push({path: '/admin/moment_create', query: {from: 'admin'}})
}

// 編集ページに遷移
const goToEditPage = (moment: any) => {
	router.push({path: '/admin/moment_edit', query: {id: moment.id, from: 'admin'}})
}

// プレビューダイアログを開く
const openPreviewDialog = (moment: any) => {
	momentDetail.value = moment
	isPreviewDialogOpen.value = true
}


// 削除確認ダイアログを開く
const openDeleteDialog = async (moment: any) => {
	const result = await AppSwal.fire({
		title: '削除確認',
		text: 'このモーメントを本当に削除しますか？',
		showConfirmButton: true,
		confirmButtonText: '削除',
	})

	if (result.isConfirmed) {
		try {
			await momentStore.deleteItem(moment.id)
			await fetchMomentList()
			
			AppSwal.fire({
				title: '削除完了',
				text: 'モーメントを削除しました',
				icon: 'success',
				timer: 1500,
			})
		} catch (error) {
			console.error('モーメント削除エラー:', error)
			AppSwal.fire({
				title: 'エラー',
				text: 'モーメントの削除に失敗しました',
				icon: 'error'
			})
		}
	}
}

// 検索条件に基づくモーメントフィルタリング
const filteredMomentList = computed(() => {
	if (!search.value) return momentList.value

	return momentList.value.filter(moment =>
		moment.title.toLowerCase().includes(search.value.toLowerCase()) ||
		moment.description.toLowerCase().includes(search.value.toLowerCase())
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

// 内容を切り詰める関数
const truncateContent = (content: any) => {
	if (!content) return ''
	if (content.length <= 20) return content
	return content.substring(0, 20) + '...'
}

onMounted(async () => {
	await fetchMomentList()
})
</script>

<style scoped>
.action-buttons {
	display: flex;
	gap: 8px;
}

.moment-title {
	max-width: 200px;
	word-wrap: break-word;
}

.moment-description {
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
</style>