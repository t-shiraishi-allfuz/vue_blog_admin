<template>
	<v-container class="image-upload">
		<v-card class="post-image-list">
			<v-card-title>アップロード済みの画像</v-card-title>
			<v-card-text>
				<v-toolbar flat>
					<v-btn
						color="success"
						variant="flat"
						@click="openBatchDeleteDialog"
					>
						一括削除
					</v-btn>
					<v-checkbox
						label="全選択"
						v-if="imageList.length > 0"
						v-model="isAllSelectedComputed"
						hide-details
					/>
					<v-divider class="mx-4" inset vertical />
					<v-spacer></v-spacer>
					<v-select
						v-if="extendedFolderList && extendedFolderList.length > 0"
						label="画像フォルダ選択"
						:items="extendedFolderList"
						item-title="name"
						item-value="id"
						v-model="selectedFolderId"
						hide-details
					/>
				</v-toolbar>
				<div class="fileBox">
					<v-row
						v-if="imageList.length > 0"
						class="image-list"
						align="start"
						align-content="start"
						justify="start"
						no-gutters
					>
						<v-col
							v-for="(image, index) in imageList"
							:key="index"
							class="thumbnail"
							align-self="start"
							cols="auto"
						>
							<v-card
								class="selection-card"
								:class="{ 
									'selected': selectedCardIds.includes(image),
									'used-as-thumbnail': isImageUsedAsThumbnail(image)
								}"
								width="100"
								height="150"
								@click="openImageViewer(image.url)"
							>
								<div class="checkbox-overlay">
									<v-checkbox
										color="success"
										base-color="white"
										:model-value="selectedCardIds.includes(image)"
										@click.stop="toggleCardSelection(image)"
										hide-details
									/>
								</div>
								<div class="usage-indicator" v-if="isImageUsedAsThumbnail(image)">
									<v-chip
										size="x-small"
										color="warning"
										variant="elevated"
										class="usage-chip"
									>
										サムネイル
									</v-chip>
								</div>
								<div class="action-overlay">
									<v-btn
										icon="mdi-folder-move"
										size="small"
										color="primary"
										variant="elevated"
										@click.stop="openMoveDialog(image)"
										class="action-btn"
									/>
									<v-btn
										icon="mdi-delete"
										size="small"
										:color="isImageDeletable(image) ? 'red' : 'grey'"
										variant="elevated"
										:disabled="!isImageDeletable(image)"
										@click.stop="openDeleteDialog(image)"
										class="action-btn"
										:class="{ 'disabled-btn': !isImageDeletable(image) }"
									/>
								</div>
								<v-img
									:src="image.url"
									aspect-ratio="16/9"
									cover
									height="150"
								/>
							</v-card>
						</v-col>
					</v-row>
					<div v-else class="pa-4">アップロードされた画像はありません。</div>
				</div>
			</v-card-text>
		</v-card>
	</v-container>

	<v-dialog
		class="openImageViewer"
		v-model="isImageViewerDialog"
		max-width="800px"
		overlay-color="rgba(0, 0, 0, 0.5)"
		scrollable
	>
		<v-card>
			<v-card-text>
				<img :src="currentImage" alt="Preview" style="width:100%; height:auto;" @click="isImageViewerDialog = false" />
			</v-card-text>
		</v-card>
	</v-dialog>

	<DialogTemplate
		ref="dialogTemplateRef"
		label="画像移動"
		v-model:dialog="isMoveDialog"
	>
		<template v-slot:contents>
			<v-card-text>
				<v-select
					v-if="extendedFolderList && extendedFolderList.length > 0"
					label="移動先のフォルダを選択してください"
					:items="extendedFolderList"
					item-title="name"
					item-value="id"
					v-model="selectedMoveFolderId"
					hide-details
				/>
			</v-card-text>
			<v-divider />
			<div class="d-flex justify-end my-2">
				<v-btn class="mx-2" color="grey-lighten-2" @click="closeDialog">閉じる</v-btn>
				<v-btn class="mx-2" color="success" @click="moveImage">移動</v-btn>
			</div>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useImagesStore } from '@/stores/imagesStore'
import { AppSwal } from '@/utils/swal'

// 型定義
interface ImageData {
	id: string
	url: string
	folder_id: string
	createdAt: Date
	updatedAt: Date
	isUsedAsThumbnail?: boolean // サムネイルとして使用されているか
	usedInBlogs?: string[] // 使用されているブログのIDリスト
	usedInMoments?: string[] // 使用されているつぶやきのIDリスト
}

interface FolderData {
	id: string
	name: string
	image_count: number
	createdAt: Date
	updatedAt: Date
}

interface Props {
	selectedFolderId: string | null
}

const props = defineProps<Props>()
const selectedFolderId = ref<string | null>(props.selectedFolderId)
const emit = defineEmits<{
	changeFolderList: [folderId: string | null]
}>()

const extendedFolderList = defineModel<FolderData[]>("folderList")
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

// 画像取得
const imagesStore = useImagesStore()
const {
	imageList,
} = storeToRefs(imagesStore)

// モーダル用データ
const isImageViewerDialog = ref<boolean>(false)
const currentImage = ref<string>("")

const selectedCardIds = ref<ImageData[]>([])

const selectedMoveFolderId = ref<string | null>(null)
const isMoveDialog = ref<boolean>(false)
const imageToMove = ref<ImageData | null>(null)

const selectedForDelete = ref<ImageData[]>([]) // 削除用の選択画像リスト
const imageToDelete = ref<ImageData | null>(null)

const isAllSelectedComputed = computed({
	get: () => selectedForDelete.value.length === imageList.value.length && imageList.value.length > 0,
	set: (value: boolean) => {
		selectedForDelete.value = value ? [...imageList.value] : []
	},
})

const toggleCardSelection = (image: ImageData): void => {
	const index = selectedCardIds.value.indexOf(image)
	if (index > -1) {
		selectedCardIds.value.splice(index, 1)
	} else {
		selectedCardIds.value.push(image)
	}
}

// 画像が削除可能かどうかを判定
const isImageDeletable = (image: ImageData): boolean => {
	return !image.isUsedAsThumbnail && 
		   (!image.usedInBlogs || image.usedInBlogs.length === 0) && 
		   (!image.usedInMoments || image.usedInMoments.length === 0)
}

// 画像がサムネイルとして使用されているかどうかを判定
const isImageUsedAsThumbnail = (image: ImageData): boolean => {
	return image.isUsedAsThumbnail === true
}

const initRefs = (): void => {
	isImageViewerDialog.value = true
	isMoveDialog.value = false
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

const openImageViewer = (imageUrl: string): void => {
	currentImage.value = imageUrl
	isImageViewerDialog.value = true
}

// 移動確認ダイアログを開く
const openMoveDialog = (image: ImageData): void => {
	imageToMove.value = image
	isMoveDialog.value = true
}

// 画像移動
const moveImage = async (): Promise<void> => {
	if (!imageToMove.value || !selectedMoveFolderId.value) {
		console.error('移動する画像またはフォルダが選択されていません')
		return
	}
	
	isMoveDialog.value = false

	await imagesStore.update(imageToMove.value, selectedMoveFolderId.value)
	emit('changeFolderList', selectedFolderId.value)
	
	// 移動完了メッセージ
	AppSwal.fire({
		title: '移動完了',
		text: '画像を移動しました',
		icon: 'success',
		timer: 1500,
	})
	
	imageToMove.value = null
	selectedMoveFolderId.value = null
}

// 個別削除確認ダイアログを開く
const openDeleteDialog = async (image: ImageData): Promise<void> => {
	// 削除不可の画像の場合は警告を表示
	if (!isImageDeletable(image)) {
		let message = 'この画像は削除できません。\n'
		if (image.isUsedAsThumbnail) {
			message += '・ブログまたはつぶやきのサムネイルとして使用されています。'
		}
		if (image.usedInBlogs && image.usedInBlogs.length > 0) {
			message += `・${image.usedInBlogs.length}件のブログで使用されています。`
		}
		if (image.usedInMoments && image.usedInMoments.length > 0) {
			message += `・${image.usedInMoments.length}件のつぶやきで使用されています。`
		}
		
		await AppSwal.fire({
			title: '削除不可',
			text: message,
			icon: 'warning',
		})
		return
	}

	imageToDelete.value = image
	
	const result = await AppSwal.fire({
		title: '削除確認',
		text: 'この画像を本当に削除しますか？',
		showConfirmButton: true,
		confirmButtonText: '削除',
	})

	if (result.isConfirmed && imageToDelete.value) {
		await imagesStore.deleteItem(imageToDelete.value)
		imageToDelete.value = null
		emit('changeFolderList', selectedFolderId.value)
		
		// 削除完了メッセージ
		AppSwal.fire({
			title: '削除完了',
			text: '画像を削除しました',
			icon: 'success',
			timer: 1500,
		})
	}
}

// 一括削除確認ダイアログを開く
const openBatchDeleteDialog = async (): Promise<void> => {
	if (selectedForDelete.value.length === 0) return
	
	// 削除可能な画像のみをフィルタリング
	const deletableImages = selectedForDelete.value.filter(image => isImageDeletable(image))
	const nonDeletableImages = selectedForDelete.value.filter(image => !isImageDeletable(image))
	
	if (deletableImages.length === 0) {
		await AppSwal.fire({
			title: '削除不可',
			text: '選択した画像はすべて削除できません。\nブログやつぶやきで使用されている画像は削除できません。',
			icon: 'warning',
		})
		return
	}
	
	let confirmMessage = `${deletableImages.length}件の画像を削除しますか？`
	if (nonDeletableImages.length > 0) {
		confirmMessage += `\n\n※${nonDeletableImages.length}件の画像は使用中のため削除されません。`
	}
	
	const result = await AppSwal.fire({
		title: '一括削除確認',
		text: confirmMessage,
		showConfirmButton: true,
		confirmButtonText: '削除',
	})

	if (result.isConfirmed) {
		await deleteSelectedImages()
	}
}

// 一括削除
const deleteSelectedImages = async (): Promise<void> => {
	if (selectedForDelete.value.length === 0) return

	// 削除可能な画像のみをフィルタリングして削除
	const deletableImages = selectedForDelete.value.filter(image => isImageDeletable(image))
	const nonDeletableImages = selectedForDelete.value.filter(image => !isImageDeletable(image))

	await Promise.all(deletableImages.map((image) => imagesStore.deleteItem(image)))
	selectedForDelete.value = []
	emit('changeFolderList', selectedFolderId.value)
	
	// 削除完了メッセージ
	let message = `${deletableImages.length}件の画像を削除しました`
	if (nonDeletableImages.length > 0) {
		message += `\n※${nonDeletableImages.length}件の画像は使用中のため削除されませんでした`
	}
	
	AppSwal.fire({
		title: '削除完了',
		text: message,
		icon: 'success',
		timer: 2000,
	})
}

watch(selectedFolderId, (newValue) => {
	emit('changeFolderList', newValue)
})

watch(() => props.selectedFolderId, (newValue) => {
	selectedFolderId.value = newValue
})
</script>

<style scoped lang="scss">
.fileBox {
	padding-top: 16px;
	clear: both;
}

.image-list {
	justify-content: flex-start !important;
}

.thumbnail {
	flex: 0 0 auto;
	margin-right: 8px;
	margin-bottom: 8px;
}

.selection-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.selection-card.selected {
	border-color: #27C1A3;
	background-color: rgba(39,193,163, 0.8);
}
.checkbox-overlay {
	position: absolute;
	top: 5px;
	left: 5px;
	z-index: 10;
}

.checkbox-overlay .v-checkbox {
	margin: 0;
}

.action-overlay {
	position: absolute;
	top: 5px;
	right: 5px;
	z-index: 10;
	display: flex;
	flex-direction: column;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.selection-card:hover .action-overlay {
	opacity: 1;
}

.action-btn {
	min-width: 32px !important;
	width: 32px !important;
	height: 32px !important;
}

.disabled-btn {
	opacity: 0.5 !important;
	cursor: not-allowed !important;
}

.used-as-thumbnail {
	border: 2px solid #ff9800 !important;
}

.usage-indicator {
	position: absolute;
	bottom: 5px;
	left: 5px;
	z-index: 10;
}

.usage-chip {
	font-size: 10px !important;
	height: 18px !important;
}
</style>