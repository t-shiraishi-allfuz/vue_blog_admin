<template>
	<v-container>
		<v-card>
			<v-data-table
				:headers="headers"
				:items="announcements"
				:loading="loading"
				item-key="id"
				class="elevation-1"
				:items-per-page="30"
				no-data-text="お知らせがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>お知らせ一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-btn
							color="success"
							variant="elevated"
							@click="openCreateDialog"
						>
							新規作成
						</v-btn>
					</v-toolbar>
				</template>
				<template v-slot:item.priority="{ item }">
					<v-chip
						:color="getPriorityColor(item.priority)"
						size="small"
						variant="tonal"
					>
						{{ getPriorityText(item.priority) }}
					</v-chip>
				</template>
				
				<template v-slot:item.isPublished="{ item }">
					<v-chip
						:color="item.isPublished ? 'success' : 'grey'"
						size="small"
						variant="tonal"
					>
						{{ item.isPublished ? '公開中' : '非公開' }}
					</v-chip>
				</template>
				
				<template v-slot:item.createdAt="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				
				<template v-slot:item.actions="{ item }">
					<v-btn
						color="blue"
						icon="mdi-pencil"
						variant="text"
						@click="openEditDialog(item as any)"
					/>
					<v-btn
						color="red"
						icon="mdi-delete"
						variant="text"
						@click="deleteAnnouncement(item as any)"
					/>
				</template>
			</v-data-table>
		</v-card>
	</v-container>
	
	<AnnouncementCreateDialog
		v-model:dialog="isCreateDialog"
		@saved="onAnnouncementSaved"
	/>
	
	<AnnouncementEditDialog
		v-model:dialog="isEditDialog"
		:announcement-data="selectedAnnouncement as any"
		@updated="onAnnouncementUpdated"
	/>
	
	<v-dialog v-model="isDeleteDialog" max-width="400">
		<v-card>
			<v-card-title>削除確認</v-card-title>
			<v-card-text>
				このお知らせを削除しますか？この操作は取り消せません。
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="grey-lighten-4"
					variant="text"
					@click="isDeleteDialog = false"
				>
					キャンセル
				</v-btn>
				<v-btn
					color="error"
					variant="elevated"
					@click="confirmDelete"
					:loading="deleting"
				>
					削除
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useAnnouncementStore } from '@/stores/announcementStore'

// 型定義
interface AnnouncementData {
	id: string
	title: string
	content: string
	priority: 'low' | 'normal' | 'high' | 'urgent'
	isPublished: boolean
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

interface HeaderItem {
	title: string
	key: string
	sortable: boolean
}

const announcementStore = useAnnouncementStore()
const {
	announcements
} = storeToRefs(announcementStore)

const loading = ref<boolean>(false)
const isCreateDialog = ref<boolean>(false)
const isEditDialog = ref<boolean>(false)
const isDeleteDialog = ref<boolean>(false)
const deleting = ref<boolean>(false)
const selectedAnnouncement = ref<AnnouncementData | null>(null)

const headers: HeaderItem[] = [
	{ title: 'タイトル', key: 'title', sortable: true },
	{ title: '優先度', key: 'priority', sortable: true },
	{ title: '公開状態', key: 'isPublished', sortable: true },
	{ title: '作成日時', key: 'createdAt', sortable: true },
	{ title: '操作', key: 'actions', sortable: false }
]

const getPriorityColor = (priority: string): string => {
	const colors: Record<string, string> = {
		low: 'grey',
		normal: 'blue',
		high: 'orange',
		urgent: 'red'
	}
	return colors[priority] || 'grey'
}

const getPriorityText = (priority: string): string => {
	const texts: Record<string, string> = {
		low: '低',
		normal: '通常',
		high: '高',
		urgent: '緊急'
	}
	return texts[priority] || '通常'
}

const formatDate = (date: any): string => {
	if (!date) return ''
	const d = date.toDate ? date.toDate() : new Date(date)
	return d.toLocaleString('ja-JP')
}

const loadAnnouncements = async (): Promise<void> => {
	loading.value = true

	try {
		await announcementStore.getList()
	} catch (error) {
		console.error('お知らせ一覧取得エラー:', error)
		alert('お知らせ一覧の取得に失敗しました')
	} finally {
		loading.value = false
	}
}

const openCreateDialog = (): void => {
	isCreateDialog.value = true
}

const openEditDialog = (announcement: AnnouncementData): void => {
	selectedAnnouncement.value = announcement
	isEditDialog.value = true
}

const onAnnouncementSaved = async (): Promise<void> => {
	await loadAnnouncements()
}

const onAnnouncementUpdated = async (): Promise<void> => {
	await loadAnnouncements()
}

const deleteAnnouncement = (announcement: AnnouncementData): void => {
	selectedAnnouncement.value = announcement
	isDeleteDialog.value = true
}

const confirmDelete = async (): Promise<void> => {
	if (!selectedAnnouncement.value) return
	
	deleting.value = true
	try {
		await announcementStore.deleteAnnouncement(selectedAnnouncement.value.id)
		await loadAnnouncements()
		alert('お知らせを削除しました')
	} catch (error) {
		console.error('お知らせ削除エラー:', error)
		alert('お知らせの削除に失敗しました')
	} finally {
		deleting.value = false
		isDeleteDialog.value = false
		selectedAnnouncement.value = null
	}
}

onMounted(async (): Promise<void> => {
	await loadAnnouncements()
})
</script>

<style scoped>
.v-card {
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-card-title {
	background-color: #f5f5f5;
	border-bottom: 1px solid #e0e0e0;
}
</style>
