<template>
	<v-container>
		<v-card class="category-list">
			<v-data-table
				v-if="!isLoading"
				class="category-list"
				:headers="headers"
				:items="categoryList"
				items-per-page="30"
				no-data-text="カテゴリーがありません"
			>
				<template v-slot:top>
					<v-toolbar flat>
						<v-toolbar-title>カテゴリー一覧</v-toolbar-title>
						<v-divider class="mx-4" inset vertical />
						<v-spacer></v-spacer>
						<v-btn
							class="mx-2"
							color="success"
							variant="flat"
							@click="openCreateDialog"
						>
							新しいカテゴリーを作る
						</v-btn>
					</v-toolbar>
				</template>
				<template v-slot:[`item.name`]="{ item }">
					<v-icon
						v-if="item.pre_category_id"
						icon="mdi-subdirectory-arrow-right"
						style="margin-left: 20px"
					/>
					<a @click.prevent="openUpdateDialog(item)" class="folder-title" href="#">
						{{ item.name }}（{{ item.blog_count }}）
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
				<v-card-title>カテゴリー作成</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="カテゴリー名を入力して下さい"
						v-model="category.name"
					/>
				</v-card-text>
				<v-card-text v-if="categoryList.length > 0">
					<v-select
						label="親カテゴリーを設定する場合は選択して下さい"
						:items="categoryList"
						item-title="name"
						item-value="id"
						v-model="selectedPreCategoryID"
						hide-details
					/>
				</v-card-text>
				<v-divider />
				<div class="d-flex justify-end my-2">
					<v-btn class="mx-2" color="grey-lighten-2" @click="createDialog = false">閉じる</v-btn>
					<v-btn class="mx-2" color="success" @click="createCategory">作成</v-btn>
				</div>
			</v-card>
		</v-dialog>

		<v-dialog v-model="updateDialog" max-width="400px">
			<v-card>
				<v-card-title>カテゴリー編集</v-card-title>
				<v-card-text>
					<v-text-field
						type="text"
						label="カテゴリー名を入力して下さい"
						v-model="categoryToUpdate?.name"
					/>
				</v-card-text>
				<v-card-text v-if="categoryList.length > 0">
					<v-select
						label="親カテゴリーを設定する場合は選択して下さい"
						:items="categoryList"
						item-title="name"
						item-value="id"
						v-model="categoryToUpdate?.pre_category_id"
						hide-details
					/>
				</v-card-text>
				<v-divider />
				<div class="d-flex justify-end my-2">
					<v-btn class="mx-2" color="grey-lighten-2" @click="updateDialog = false">閉じる</v-btn>
					<v-btn class="mx-2" color="success" @click="updateCategory">更新</v-btn>
				</div>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup lang="ts">
import { useBlogCategoryStore } from '@/stores/blogCategoryStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'

// 型定義
interface BlogCategoryData {
	id: string
	uid: string
	pre_category_id: string | null
	name: string
	blog_count: number
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

interface CreateCategoryData {
	pre_category_id: string | null
	name: string
}

interface HeaderItem {
	title: string
	value: string
	sortable?: boolean
}

const blogCategoryStore = useBlogCategoryStore()
const {
	categoryList
} = storeToRefs(blogCategoryStore)

const isLoading = ref<boolean>(true)

const createDialog = ref<boolean>(false)
const category = ref<CreateCategoryData>({
	pre_category_id: null,
	name: ""
})
const selectedPreCategoryID = ref<string | null>(null)

const updateDialog = ref<boolean>(false)
const categoryToUpdate = ref<BlogCategoryData | null>(null)

const categoryToDelete = ref<BlogCategoryData | null>(null)

const headers: HeaderItem[] = [
	{title: "カテゴリー名", value: "name" },
	{title: "作成日時", value: "createdAt" },
	{title: "削除", value: "actions", sortable: false },
]

// 日時フォーマット関数
const formatDate = (date: any): string => {
	return format(new Date(date), 'yyyy/MM/dd HH:mm:ss')
}

// カテゴリー作成確認ダイアログを開く
const openCreateDialog = (): void => {
	createDialog.value = true
}

// カテゴリー更新確認ダイアログを開く
const openUpdateDialog = (category: BlogCategoryData): void => {
	categoryToUpdate.value = category
	updateDialog.value = true
}

// カテゴリー削除確認ダイアログを開く
const openDeleteDialog = async (category: BlogCategoryData): Promise<void> => {
	categoryToDelete.value = category
	
	const result = await Swal.fire({
		title: '削除確認',
		text: 'このカテゴリーを本当に削除しますか？',
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

	if (result.isConfirmed && categoryToDelete.value) {
		await blogCategoryStore.deleteItem(categoryToDelete.value)
		await fetchCategoryList()
		
		// 削除完了メッセージ
		Swal.fire({
			title: '削除完了',
			text: 'カテゴリーを削除しました',
			icon: 'success',
			timer: 1500,
			confirmButtonColor: '#27C1A3',
		})
	}
}

// 新規カテゴリー作成
const createCategory = async (): Promise<void> => {
	createDialog.value = false
	category.value.pre_category_id = selectedPreCategoryID.value

	await blogCategoryStore.create(category.value)
	await fetchCategoryList()

	selectedPreCategoryID.value = null
	category.value = { pre_category_id: null, name: "" }
	await Swal.fire({
		title: '成功',
		text: 'カテゴリーが作成されました',
		icon: 'success',
		timer: 1500,
		confirmButtonColor: '#27C1A3',
	})
}

// カテゴリー更新
const updateCategory = async (): Promise<void> => {
	if (!categoryToUpdate.value) return
	
	updateDialog.value = false

	// 親と同一IDはNG
	if (categoryToUpdate.value.pre_category_id == categoryToUpdate.value.id) {
		await Swal.fire({
			title: 'エラー',
			text: '同じカテゴリーは選択出来ません',
			icon: 'error',
			confirmButtonColor: '#27C1A3',
		})
		return
	}

	await blogCategoryStore.update(categoryToUpdate.value)
	await fetchCategoryList()

	categoryToUpdate.value = null
	await Swal.fire({
		title: '成功',
		text: 'カテゴリーを更新しました',
		icon: 'success',
		timer: 1500,
		confirmButtonColor: '#27C1A3',
	})
}

// 再取得
const fetchCategoryList = async (): Promise<void> => {
	await blogCategoryStore.getList()
}

onMounted(async (): Promise<void> => {
	await fetchCategoryList()
	isLoading.value = false
})
</script>

<style scoped>
	.delete-icon {
		color: red;
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
