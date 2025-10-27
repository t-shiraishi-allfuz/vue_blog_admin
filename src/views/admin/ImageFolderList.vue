<template>
	<v-container>
		<v-card class="folder-list">
			<v-data-table
				class="folder-list"
				:headers="headers"
				:items="folderList"
				:items-per-page="30"
				no-data-text="画像フォルダがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>画像フォルダ一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-btn color="success" variant="flat" @click="openCreateDialog">新しい画像フォルダを作る</v-btn>
					</v-toolbar>
				</template>
				<template v-slot:[`item.name`]="{ item }">
					<a @click.prevent="openUpdateDialog(item)" class="folder-title" href="#">
						{{ item.name }}（{{ item.image_count }}）
					</a>
				</template>
				<template v-slot:[`item.createdAt`]="{ item }">
					{{ formatDate(item.createdAt) }}
				</template>
				<template v-slot:[`item.actions`]="{ item }">
					<v-icon
						class="delete-icon"
						icon="mdi-delete"
						aria-label="削除"
						role="button"
						@click="openDeleteDialog(item)"
					/>
				</template>
			</v-data-table>
		</v-card>
		<v-dialog v-model="createDialog" max-width="400px">
			<v-card>
				<v-card-title>画像フォルダ作成</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="フォルダ名を入力して下さい"
						v-model="folder.name"
					/>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="createDialog = false">閉じる</v-btn>
					<v-btn color="success" variant="flat" @click="createFolder">作成</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
		<v-dialog v-model="updateDialog" max-width="400px">
			<v-card>
				<v-card-title>画像フォルダ編集</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="フォルダ名を入力して下さい"
						v-model="changeName"
					/>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="updateDialog = false">閉じる</v-btn>
					<v-btn color="success" variant="flat" @click="updateFolder">更新</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup lang="ts">
import { useImagesFolderStore } from '@/stores/imagesFolderStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'

// 型定義
interface FolderData {
	id: string
	name: string
	image_count: number
	createdAt: Date
	updatedAt: Date
}

interface CreateFolderData {
	name: string
}

interface UpdateFolderData {
	id: string
	name: string
	image_count: number
	createdAt: Date
	updatedAt: Date
}

interface HeaderItem {
	title: string
	value: string
	sortable: boolean
}

const imagesFolderStore = useImagesFolderStore()
const {
	folderList
} = storeToRefs(imagesFolderStore)

const createDialog = ref<boolean>(false)
const folder = ref<CreateFolderData>({
	name: ""
})

const updateDialog = ref<boolean>(false)
const folderToUpdate = ref<FolderData | null>(null)
const changeName = ref<string>("")

const folderToDelete = ref<FolderData | null>(null)

const headers: HeaderItem[] = [
	{title: "フォルダ名", value: "name", sortable: true },
	{title: "作成日時", value: "createdAt", sortable: true },
	{title: "削除", value: "actions", sortable: false },
]

// 日時フォーマット関数
const formatDate = (date: any): string => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// フォルダ作成確認ダイアログを開く
const openCreateDialog = (): void => {
	createDialog.value = true
}

// フォルダ更新確認ダイアログを開く
const openUpdateDialog = (folder: FolderData): void => {
	folderToUpdate.value = folder
	changeName.value = folder.name
	updateDialog.value = true
}

// フォルダ削除確認ダイアログを開く
const openDeleteDialog = async (folder: FolderData): Promise<void> => {
	folderToDelete.value = folder
	
	const result = await Swal.fire({
		title: '削除確認',
		text: 'この画像フォルダを本当に削除しますか？',
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
			if (confirmBtn) confirmBtn.style.width = '150px'
			if (cancelBtn) cancelBtn.style.width = '150px'
		}
	})

	if (result.isConfirmed && folderToDelete.value) {
		await imagesFolderStore.deleteItem(folderToDelete.value.id)
		await fetchList()
		
		// 削除完了メッセージ
		Swal.fire({
			title: '削除完了',
			text: '画像フォルダを削除しました',
			icon: 'success',
			timer: 1500,
			confirmButtonColor: '#27C1A3',
		})
		
		folderToDelete.value = null
	}
}

// 新規フォルダ作成
const createFolder = async (): Promise<void> => {
	createDialog.value = false

	await imagesFolderStore.create(folder.value)
	await fetchList()

	folder.value.name = ""
}

const updateFolder = async (): Promise<void> => {
	if (!folderToUpdate.value) {
		console.error('更新するフォルダが選択されていません')
		return
	}

	updateDialog.value = false

	// フォルダ名を更新
	folderToUpdate.value.name = changeName.value
	await imagesFolderStore.update(folderToUpdate.value as UpdateFolderData)
	await fetchList()

	folderToUpdate.value = null
}

const fetchList = async (): Promise<void> => {
	await imagesFolderStore.getList()
}

onMounted(async (): Promise<void> => {
	await fetchList()
})
</script>

<style scoped>
	.delete-icon {
		color: red;
	}
</style>
