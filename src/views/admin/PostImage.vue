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
						v-if="extendedFolderList.length > 0"
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
								:class="{ 'selected': selectedCardIds.includes(image) }"
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

		<v-dialog
			class="openImageViewer"
			v-model="imageViewerDialog"
			max-width="800px"
			overlay-color="rgba(0, 0, 0, 0.5)"
			scrollable
		>
			<v-card>
				<v-card-text>
					<img :src="currentImage" alt="Preview" style="width:100%; height:auto;" @click="imageViewerDialog = false" />
				</v-card-text>
			</v-card>
		</v-dialog>

		<v-dialog v-model="moveDialog" max-width="400px">
			<v-card>
				<v-card-title>移動確認</v-card-title>
				<v-card-text>
					<v-select
						v-if="extendedFolderList.length > 0"
						label="移動する画像フォルダ選択を選択して下さい"
						:items="extendedFolderList"
						item-title="name"
						item-id="id"
						v-model="selectedMoveFolderId"
						hide-details
					/>
				</v-card-text>
				<v-divider />
				<div class="d-flex justify-end my-2">
					<v-btn class="mx-2" color="grey-lighten-2" @click="moveDialog = false">閉じる</v-btn>
					<v-btn class="mx-2" color="success" @click="moveImage">移動</v-btn>
				</div>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup lang="ts">
import { useImagesStore } from '@/stores/imagesStore'
import { useImagesFolderStore } from '@/stores/imagesFolderStore'
import Swal from 'sweetalert2'

const props = defineProps({
	selectedFolderId: {
		type: [String, null],
		default: null
	}
})
const selectedFolderId = ref(props.selectedFolderId)
const emit = defineEmits(["changeFolderList"])

const extendedFolderList = defineModel("folderList")

// 画像取得
const imagesStore = useImagesStore()
const imagesFolderStore = useImagesFolderStore()
const {
	imageList,
} = storeToRefs(imagesStore)

// モーダル用データ
const imageViewerDialog = ref(false)
const currentImage = ref(null)

const selectedCardIds = ref<string[]>([])

const selectedMoveFolderId = ref(null)
const moveDialog = ref(false)
const imageToMove = ref(null)

const selectedForDelete = ref([]) // 削除用の選択画像リスト
const imageToDelete = ref(null)

const isAllSelectedComputed = computed({
	get: () => selectedForDelete.value.length === imageList.value.length && imageList.value.length > 0,
	set: (value) => {
		selectedForDelete.value = value ? [...imageList.value] : []
	},
})

const toggleCardSelection = (image: any) => {
	const index = selectedCardIds.value.indexOf(image)
	if (index > -1) {
		selectedCardIds.value.splice(index, 1)
	} else {
		selectedCardIds.value.push(image)
	}
}

const openImageViewer = (imageUrl) => {
	currentImage.value = imageUrl
	imageViewerDialog.value = true
}

// 移動確認ダイアログを開く
const openMoveDialog = (image) => {
	imageToMove.value = image
	moveDialog.value = true
}

// 画像移動
const moveImage = async () => {
	moveDialog.value = false

	await imagesStore.update(imageToMove.value, selectedMoveFolderId.value)
	emit('changeFolderList', selectedFolderId.value)
}

// 個別削除確認ダイアログを開く
const openDeleteDialog = async (image) => {
	imageToDelete.value = image
	
	const result = await Swal.fire({
		title: '削除確認',
		text: 'この画像を本当に削除しますか？',
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
			const confirmBtn = document.querySelector('.swal2-confirm-fixed-width')
			const cancelBtn = document.querySelector('.swal2-cancel-fixed-width')
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

	if (result.isConfirmed) {
		await imagesStore.deleteItem(imageToDelete.value)
		imageToDelete.value = null
		emit('changeFolderList', selectedFolderId.value)
		
		// 削除完了メッセージ
		Swal.fire({
			title: '削除完了',
			text: '画像を削除しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
	}
}

// 一括削除確認ダイアログを開く
const openBatchDeleteDialog = async () => {
	if (selectedForDelete.value.length === 0) return
	
	const result = await Swal.fire({
		title: '一括削除確認',
		text: '選択した画像をすべて削除しますか？',
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
			const confirmBtn = document.querySelector('.swal2-confirm-fixed-width')
			const cancelBtn = document.querySelector('.swal2-cancel-fixed-width')
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

	if (result.isConfirmed) {
		await deleteSelectedImages()
	}
}

// 一括削除
const deleteSelectedImages = async () => {
	if (selectedForDelete.value.length === 0) return

	await Promise.all(selectedForDelete.value.map((image) => imagesStore.deleteItem(image)))
	selectedForDelete.value = []
	emit('changeFolderList', selectedFolderId.value)
	
	// 削除完了メッセージ
	Swal.fire({
		title: '削除完了',
		text: '選択した画像を削除しました',
		icon: 'success',
		timer: 1500,
		showConfirmButton: false
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
