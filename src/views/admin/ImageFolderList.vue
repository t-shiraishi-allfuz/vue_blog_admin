<template>
	<v-container>
		<v-card class="folder-list">
			<v-toolbar flat>
				<v-toolbar-title>画像フォルダ一覧</v-toolbar-title>
				<v-divider class="mx-4" inset vertical />
				<v-spacer></v-spacer>
				<v-btn color="success" variant="flat" @click="openCreateDialog">新しい画像フォルダを作る</v-btn>
			</v-toolbar>
			<v-divider />
			<v-list v-if="folderList.length > 0">
				<draggable
					v-model="sortedFolderList"
					item-key="id"
					@end="onDragEnd"
					tag="div"
				>
				<template #item="{ element: item, index }">
					<div>
						<v-list-item class="folder-item">
							<template v-slot:prepend>
								<v-icon color="grey">mdi-drag</v-icon>
							</template>
							<v-list-item-title>
								<a @click.prevent="openUpdateDialog(item)" class="folder-title" href="#">
									{{ item.name }}（{{ item.image_count }}）
								</a>
							</v-list-item-title>
							<v-list-item-subtitle>
								{{ formatDate(item.createdAt) }}
							</v-list-item-subtitle>
							<template v-slot:append>
								<div class="d-flex align-center">
									<v-btn
										icon="mdi-chevron-up"
										variant="text"
										size="small"
										:disabled="index === 0"
										@click="moveUp(item.id)"
										class="mr-1"
									/>
									<v-btn
										icon="mdi-chevron-down"
										variant="text"
										size="small"
										:disabled="index === sortedFolderList.length - 1"
										@click="moveDown(item.id)"
										class="mr-2"
									/>
									<v-icon
										class="delete-icon"
										icon="mdi-delete"
										aria-label="削除"
										role="button"
										@click="openDeleteDialog(item)"
									/>
								</div>
							</template>
						</v-list-item>
						<v-divider v-if="index < folderList.length - 1" />
					</div>
				</template>
			</draggable>
			</v-list>
			<v-card-text v-if="folderList.length === 0" class="text-center">
				画像フォルダがありません
			</v-card-text>
		</v-card>
	</v-container>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="画像フォルダ作成"
		v-model:dialog="isCreateDialog"
	>
		<template v-slot:contents>
			<v-card-text>
				<v-text-field
					type="text"
					label="フォルダ名を入力して下さい"
					v-model="folder.name"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="grey-lighten-2" variant="flat" @click="closeDialog">閉じる</v-btn>
				<v-btn color="success" variant="flat" @click="createFolder">作成</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="画像フォルダ編集"
		v-model:dialog="isEditDialog"
	>
		<template v-slot:contents>
			<v-card-text>
				<v-text-field
					type="text"
					label="フォルダ名を入力して下さい"
					v-model="changeName"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="grey-lighten-2" variant="flat" @click="closeDialog">閉じる</v-btn>
				<v-btn color="success" variant="flat" @click="updateFolder">更新</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useImagesFolderStore } from '@/stores/imagesFolderStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import draggable from 'vuedraggable'

// 型定義
interface FolderData {
	id: string
	name: string
	image_count: number
	order?: number
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

const imagesFolderStore = useImagesFolderStore()
const {
	folderList
} = storeToRefs(imagesFolderStore)

// 並び替え用のリスト（ドラッグ操作で直接変更可能にするためrefを使用）
const sortedFolderList = ref<FolderData[]>([])

// folderListが変更されたらsortedFolderListも更新
watch(folderList, (newList) => {
	sortedFolderList.value = [...newList]
}, { immediate: true, deep: true })

const isCreateDialog = ref<boolean>(false)
const folder = ref<CreateFolderData>({
	name: ""
})

const isEditDialog = ref<boolean>(false)
const folderToUpdate = ref<FolderData | null>(null)
const changeName = ref<string>("")
const folderToDelete = ref<FolderData | null>(null)
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

// 日時フォーマット関数
const formatDate = (date: any): string => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

const initRefs = (): void => {
	isCreateDialog.value = false
	isEditDialog.value = false
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

// フォルダ作成確認ダイアログを開く
const openCreateDialog = (): void => {
	isCreateDialog.value = true
}

// フォルダ更新確認ダイアログを開く
const openUpdateDialog = (folder: FolderData): void => {
	folderToUpdate.value = folder
	changeName.value = folder.name
	isEditDialog.value = true
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
	closeDialog()

	await imagesFolderStore.create(folder.value)
	await fetchList()

	folder.value.name = ""
}

const updateFolder = async (): Promise<void> => {
	if (!folderToUpdate.value) {
		console.error('更新するフォルダが選択されていません')
		return
	}

	closeDialog()

	// フォルダ名を更新
	folderToUpdate.value.name = changeName.value
	await imagesFolderStore.update(folderToUpdate.value as UpdateFolderData)
	await fetchList()

	folderToUpdate.value = null
}

const fetchList = async (): Promise<void> => {
	await imagesFolderStore.getList()
}

// ドラッグ&ドロップ終了時の処理
const onDragEnd = async (): Promise<void> => {
	// ドラッグ後の新しい順序でIDリストを作成
	const folderIds = sortedFolderList.value.map(f => f.id)
	await imagesFolderStore.updateOrder(folderIds)
	
	Swal.fire({
		title: '順序を更新しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false,
		confirmButtonColor: '#27C1A3',
	})
}

// 上に移動
const moveUp = async (folderId: string): Promise<void> => {
	const currentIndex = sortedFolderList.value.findIndex(f => f.id === folderId)
	if (currentIndex === -1 || currentIndex === 0) return

	// 配列内で要素を入れ替え
	const newList = [...sortedFolderList.value]
	const [movedItem] = newList.splice(currentIndex, 1)
	newList.splice(currentIndex - 1, 0, movedItem)
	
	// 新しい順序でIDリストを作成して保存
	const folderIds = newList.map(f => f.id)
	await imagesFolderStore.updateOrder(folderIds)
	
	Swal.fire({
		title: '順序を更新しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false,
		confirmButtonColor: '#27C1A3',
	})
}

// 下に移動
const moveDown = async (folderId: string): Promise<void> => {
	const currentIndex = sortedFolderList.value.findIndex(f => f.id === folderId)
	if (currentIndex === -1 || currentIndex === sortedFolderList.value.length - 1) return

	// 配列内で要素を入れ替え
	const newList = [...sortedFolderList.value]
	const [movedItem] = newList.splice(currentIndex, 1)
	newList.splice(currentIndex + 1, 0, movedItem)
	
	// 新しい順序でIDリストを作成して保存
	const folderIds = newList.map(f => f.id)
	await imagesFolderStore.updateOrder(folderIds)
	
	Swal.fire({
		title: '順序を更新しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false,
		confirmButtonColor: '#27C1A3',
	})
}

onMounted(async (): Promise<void> => {
	await fetchList()
})
</script>

<style scoped>
	.delete-icon {
		color: red;
		cursor: pointer;
	}
	
	.folder-item {
		cursor: move;
	}
	
	.folder-title {
		text-decoration: none;
		color: inherit;
	}
	
	.folder-title:hover {
		text-decoration: underline;
	}
</style>
