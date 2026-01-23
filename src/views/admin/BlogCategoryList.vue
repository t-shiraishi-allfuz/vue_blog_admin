<template>
	<v-container>
		<v-card class="category-list">
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
			<v-divider />
			<template v-if="!isLoading && sortedCategoryList.length > 0">
				<template v-for="(parentCategory, parentIndex) in parentCategories" :key="parentCategory.id">
					<v-list-item class="parent-category-item">
						<template v-slot:prepend>
							<v-icon color="primary">mdi-folder</v-icon>
						</template>
						<v-list-item-title>
							<a @click.prevent="openUpdateDialog(parentCategory)" class="folder-title" href="#">
								{{ parentCategory.name }}（{{ parentCategory.blog_count }}）
							</a>
						</v-list-item-title>
						<v-list-item-subtitle>
							{{ formatDate(parentCategory.createdAt) }}
						</v-list-item-subtitle>
						<template v-slot:append>
							<v-btn
								icon="mdi-delete"
								color="red"
								variant="text"
								@click="openDeleteDialog(parentCategory)"
							/>
						</template>
					</v-list-item>
					<v-divider />
					<v-list v-if="getChildCategories(parentCategory.id).length > 0">
						<draggable
							v-model="childCategoriesMap[parentCategory.id]"
							item-key="id"
							@end="() => onDragEnd(parentCategory.id)"
							tag="div"
						>
							<template #item="{ element: item, index }">
								<div>
									<v-list-item class="category-item child-category">
										<template v-slot:prepend>
											<v-icon color="grey">mdi-drag</v-icon>
											<v-icon
												icon="mdi-subdirectory-arrow-right"
												style="margin-left: 8px"
											/>
										</template>
										<v-list-item-title>
											<a @click.prevent="openUpdateDialog(item)" class="folder-title" href="#">
												{{ item.name }}（{{ item.blog_count }}）
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
													:disabled="index === childCategoriesMap[parentCategory.id].length - 1"
													@click="moveDown(item.id)"
													class="mr-2"
												/>
												<v-btn
													icon="mdi-delete"
													color="red"
													variant="text"
													@click="openDeleteDialog(item)"
												/>
											</div>
										</template>
									</v-list-item>
									<v-divider v-if="index < childCategoriesMap[parentCategory.id].length - 1" />
								</div>
							</template>
						</draggable>
					</v-list>
					<v-divider v-if="parentIndex < parentCategories.length - 1" class="my-2" />
				</template>
			</template>
			<v-card-text v-if="!isLoading && sortedCategoryList.length === 0" class="text-center">
				カテゴリーがありません
			</v-card-text>
			<v-card-text v-if="isLoading" class="text-center">
				<v-progress-circular indeterminate />
			</v-card-text>
		</v-card>
	</v-container>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="カテゴリー作成"
		v-model:dialog="isCreateDialog"
	>
		<template v-slot:contents>
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
				<v-btn class="mx-2" color="grey-lighten-2" @click="closeDialog">閉じる</v-btn>
				<v-btn class="mx-2" color="success" @click="createCategory">作成</v-btn>
			</div>
		</template>
	</DialogTemplate>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="カテゴリー編集"
		v-model:dialog="isEditDialog"
	>
		<template v-slot:contents>
			<v-card-text v-if="categoryToUpdate">
				<v-text-field
					type="text"
					label="カテゴリー名を入力して下さい"
					v-model="categoryToUpdate.name"
				/>
			</v-card-text>
			<v-card-text v-if="categoryList.length > 0 && categoryToUpdate">
				<v-select
					label="親カテゴリーを設定する場合は選択して下さい"
					:items="categoryList"
					item-title="name"
					item-value="id"
					v-model="categoryToUpdate.pre_category_id"
					hide-details
				/>
			</v-card-text>
			<v-divider />
			<div class="d-flex justify-end my-2">
				<v-btn class="mx-2" color="grey-lighten-2" @click="closeDialog">閉じる</v-btn>
				<v-btn class="mx-2" color="success" @click="updateCategory">更新</v-btn>
			</div>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useBlogCategoryStore } from '@/stores/blogCategoryStore'
import { AppSwal } from '@/utils/swal'
import { format } from 'date-fns'
import draggable from 'vuedraggable'

// 型定義
interface BlogCategoryData {
	id: string
	uid: string
	pre_category_id: string | null
	name: string
	blog_count: number
	order?: number
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

interface CreateCategoryData {
	pre_category_id: string | null
	name: string
}

const blogCategoryStore = useBlogCategoryStore()
const {
	categoryList
} = storeToRefs(blogCategoryStore)

// 並び替え用のリスト（ドラッグ操作で直接変更可能にするためrefを使用）
const sortedCategoryList = ref<BlogCategoryData[]>([])

// 親カテゴリーごとの子カテゴリーリストを管理
const childCategoriesMap = ref<Record<string, BlogCategoryData[]>>({})

// 親カテゴリーのみを取得
const parentCategories = computed(() => {
	return sortedCategoryList.value.filter(c => !c.pre_category_id)
})

// 子カテゴリーを取得（親カテゴリーIDでフィルタ）
const getChildCategories = (parentId: string): BlogCategoryData[] => {
	return sortedCategoryList.value.filter(c => c.pre_category_id === parentId)
}

// categoryListが変更されたらsortedCategoryListとchildCategoriesMapも更新
watch(categoryList, (newList) => {
	sortedCategoryList.value = [...newList]
	
	// 親カテゴリーごとに子カテゴリーリストを更新
	const newMap: Record<string, BlogCategoryData[]> = {}
	parentCategories.value.forEach(parent => {
		newMap[parent.id] = getChildCategories(parent.id)
	})
	childCategoriesMap.value = newMap
}, { immediate: true, deep: true })

const isLoading = ref<boolean>(true)

const isCreateDialog = ref<boolean>(false)
const category = ref<CreateCategoryData>({
	pre_category_id: null,
	name: ""
})
const selectedPreCategoryID = ref<string | null>(null)

const isEditDialog = ref<boolean>(false)
const categoryToUpdate = ref<BlogCategoryData | null>(null)
const categoryToDelete = ref<BlogCategoryData | null>(null)
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

// カテゴリー作成確認ダイアログを開く
const openCreateDialog = (): void => {
	isCreateDialog.value = true
}

// カテゴリー更新確認ダイアログを開く
const openUpdateDialog = (category: BlogCategoryData): void => {
	categoryToUpdate.value = category
	isEditDialog.value = true
}

// カテゴリー削除確認ダイアログを開く
const openDeleteDialog = async (category: BlogCategoryData): Promise<void> => {
	categoryToDelete.value = category
	
	const result = await AppSwal.fire({
		title: '削除確認',
		text: 'このカテゴリーを本当に削除しますか？',
		showConfirmButton: true,
		confirmButtonText: '削除',
	})

	if (result.isConfirmed && categoryToDelete.value) {
		await blogCategoryStore.deleteItem(categoryToDelete.value as BlogCategoryData)
		await fetchCategoryList()
		
		// 削除完了メッセージ
		AppSwal.fire({
			title: '削除完了',
			text: 'カテゴリーを削除しました',
			icon: 'success',
			timer: 1500,
		})
	}
}

// 新規カテゴリー作成
const createCategory = async (): Promise<void> => {
	if (!category.value.name.trim()) {
		await AppSwal.fire({
			title: 'エラー',
			text: 'カテゴリー名を入力してください',
			icon: 'error',
		})
		return
	}

	try {
		closeDialog()
		category.value.pre_category_id = selectedPreCategoryID.value

		await blogCategoryStore.create(category.value)
		await fetchCategoryList()

		selectedPreCategoryID.value = null
		category.value = { pre_category_id: null, name: "" }
		await AppSwal.fire({
			title: '成功',
			text: 'カテゴリーが作成されました',
			icon: 'success',
			timer: 1500,
		})
	} catch (error) {
		console.error('カテゴリー作成エラー:', error)
		await AppSwal.fire({
			title: 'エラー',
			text: 'カテゴリーの作成に失敗しました',
			icon: 'error',
		})
	}
}

// カテゴリー更新
const updateCategory = async (): Promise<void> => {
	if (!categoryToUpdate.value) return
	
	if (!categoryToUpdate.value.name.trim()) {
		await AppSwal.fire({
			title: 'エラー',
			text: 'カテゴリー名を入力してください',
			icon: 'error',
		})
		return
	}

	try {
		closeDialog()

		// 親と同一IDはNG
		if (categoryToUpdate.value.pre_category_id == categoryToUpdate.value.id) {
			await AppSwal.fire({
				title: 'エラー',
				text: '同じカテゴリーは選択出来ません',
				icon: 'error',
			})
			return
		}

		if (!categoryToUpdate.value) return
		await blogCategoryStore.update(categoryToUpdate.value)
		await fetchCategoryList()

		categoryToUpdate.value = null
		await AppSwal.fire({
			title: '成功',
			text: 'カテゴリーを更新しました',
			icon: 'success',
			timer: 1500,
		})
	} catch (error) {
		console.error('カテゴリー更新エラー:', error)
		await AppSwal.fire({
			title: 'エラー',
			text: 'カテゴリーの更新に失敗しました',
			icon: 'error',
		})
	}
}

// 再取得
const fetchCategoryList = async (): Promise<void> => {
	try {
		await blogCategoryStore.getList()
	} catch (error) {
		console.error('カテゴリー一覧取得エラー:', error)
		await AppSwal.fire({
			title: 'エラー',
			text: 'カテゴリー一覧の取得に失敗しました',
			icon: 'error',
		})
	}
}

// ドラッグ&ドロップ終了時の処理
const onDragEnd = async (parentCategoryId: string): Promise<void> => {
	// ドラッグ後の新しい順序で、同じ親カテゴリー内の子カテゴリーのIDリストを作成
	const childCategories = childCategoriesMap.value[parentCategoryId] || []
	const childCategoryIds = childCategories.map(c => c.id)
	
	// sortedCategoryListも更新
	const otherCategories = sortedCategoryList.value.filter(c => 
		c.pre_category_id !== parentCategoryId && !c.pre_category_id
	)
	const parentCategory = sortedCategoryList.value.find(c => c.id === parentCategoryId)
	if (parentCategory) {
		// 親カテゴリーとその子カテゴリーを正しい順序で配置
		const newList: BlogCategoryData[] = []
		otherCategories.forEach(parent => {
			newList.push(parent)
			const children = sortedCategoryList.value.filter(c => c.pre_category_id === parent.id)
			newList.push(...children)
		})
		newList.push(parentCategory)
		newList.push(...childCategories)
		sortedCategoryList.value = newList
	}
	
	await blogCategoryStore.updateOrder(childCategoryIds)
	
	AppSwal.fire({
		title: '順序を更新しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false,
	})
}

// 上に移動
const moveUp = async (categoryId: string): Promise<void> => {
	await blogCategoryStore.moveOrder(categoryId, 'up')
	
	AppSwal.fire({
		title: '順序を更新しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false,
	})
}

// 下に移動
const moveDown = async (categoryId: string): Promise<void> => {
	await blogCategoryStore.moveOrder(categoryId, 'down')
	
	AppSwal.fire({
		title: '順序を更新しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false,
	})
}

onMounted(async (): Promise<void> => {
	try {
		await fetchCategoryList()
		isLoading.value = false
	} catch (error) {
		console.error('初期化エラー:', error)
		isLoading.value = false
	}
})
</script>

<style scoped>
	.category-item {
		cursor: move;
	}
	
	.child-category {
		cursor: default;
	}
	
	.folder-title {
		text-decoration: none;
		color: inherit;
	}
	
	.folder-title:hover {
		text-decoration: underline;
	}
</style>
