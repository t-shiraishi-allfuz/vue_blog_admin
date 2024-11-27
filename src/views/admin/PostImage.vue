<template>
	<v-container class="image-upload">
		<v-card class="post-image-list">
			<v-card-title>アップロード済みの画像</v-card-title>
			<v-card-text>
				<v-toolbar flat>
					<v-btn color="primary" variant="flat" @click="openBatchDeleteDialog">一括削除</v-btn>
					<v-checkbox
						label="全選択"
						v-if="imageList.length > 0"
						v-model="isAllSelectedComputed"
						hide-details />
					<v-divider class="mx-4" inset vertical />
					<v-spacer></v-spacer>
					<v-select
						v-if="extendedFolderList.length > 0"
						label="画像フォルダ選択"
						:items="folderList"
						item-title="name"
						v-model="selectedFolder"
						return-object
						hide-details />
				</v-toolbar>
				<div class="fileBox">
					<ul class="image-list" v-if="imageList.length > 0">
						<li class="thumbnail" v-for="(image, index) in imageList" :key="index">
							<div class="image-gallery">
								<div class="image-top">
									<input type="checkbox" v-model="selectedForDelete" :value="image" />
									<label class="file-name">{{ image.name }}</label>
								</div>
								<span class="image-item">
									<img :src="image.url" :alt="'Image ' + (index + 1)" @click="openImageViewer(image.url)" />
								</span>
								<div class="delete-image">
									<span>
										<v-icon class="delete-icon" :icon="mdiImageMove" @click="openMoveDialog(image)" />
									</span>
									<span class="text-delete">移動</span>
									<span>
										<v-icon class="delete-icon" :icon="mdiDelete" @click="openDeleteDialog(image)" />
									</span>
									<span class="text-delete">削除</span>
								</div>
							</div>
						</li>
					</ul>
					<p v-else>アップロードされた画像はありません。</p>
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
						:items="folderList"
						item-title="name"
						v-model="selectedMoveFolder"
						return-object
						hide-details />
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="moveDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="moveImage">移動</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="deleteDialog" max-width="400px">
			<v-card>
				<v-card-title>削除確認</v-card-title>
				<v-card-text>この画像を本当に削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="deleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="deleteImage">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>

		<v-dialog v-model="batchDeleteDialog" max-width="400px">
			<v-card>
				<v-card-title>一括削除確認</v-card-title>
				<v-card-text>選択した画像をすべて削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="batchDeleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="deleteSelectedImages">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch } from 'vue';
import { useImagesStore } from '@/stores/imagesStore';
import { useImagesFolderStore } from '@/stores/imagesFolderStore';
import { mdiDelete, mdiImageMove } from '@mdi/js';

const props = defineProps({
	selectedFolder: {
		type: Object,
		required: true
	}
});
const selectedFolder = ref(props.selectedFolder);
const emit = defineEmits(["changeFolderList"]);

// 画像取得
const imagesStore = useImagesStore();
const imageList = computed(() => imagesStore.imageList || []);

const imagesFolderStore = useImagesFolderStore();
const folderList = computed(() => imagesFolderStore.folderList);

// フォルダリストにデフォルト値を追加
const defaultSelect = ref({id: null, name: '指定なし'});
const extendedFolderList = computed(() => {
	return [defaultSelect.value, ...folderList.value];
});

// モーダル用データ
const imageViewerDialog = ref(false);
const currentImage = ref(null);

const selectedMoveFolder = ref(null);
const moveDialog = ref(false);
const imageToMove = ref(null);

const selectedForDelete = ref([]); // 削除用の選択画像リスト
const deleteDialog = ref(false);
const batchDeleteDialog = ref(false);
const imageToDelete = ref(null);

const isAllSelectedComputed = computed({
	get: () => selectedForDelete.value.length === imageList.value.length && imageList.value.length > 0,
	set: (value) => {
		selectedForDelete.value = value ? [...imageList.value] : [];
	},
});

const openImageViewer = (imageUrl) => {
	currentImage.value = imageUrl;
	imageViewerDialog.value = true;
}

// 移動確認ダイアログを開く
const openMoveDialog = (image) => {
	imageToMove.value = image;
	moveDialog.value = true;
};

// 画像移動
const moveImage = async () => {
	moveDialog.value = false;

	try {
		await imagesStore.update(imageToMove.value, selectedMoveFolder.value.id);
		emit('changeFolderList', selectedFolder.value);
		alert('指定のフォルダに画像を移動しました');
	} catch (error) {
		alert(error);
	}
};

// 個別削除確認ダイアログを開く
const openDeleteDialog = (image) => {
	imageToDelete.value = image;
	deleteDialog.value = true;
};

// 一括削除確認ダイアログを開く
const openBatchDeleteDialog = () => {
	if (selectedForDelete.value.length === 0) return;
	batchDeleteDialog.value = true;
};

// 画像削除
const deleteImage = async () => {
	deleteDialog.value = false;

	try {
		await imagesStore.delete(imageToDelete.value);
		imageToDelete.value = null;
		emit('changeFolderList', selectedFolder.value);
		alert('画像が削除されました');
	} catch (error) {
		alert(error);
	}
};

// 一括削除
const deleteSelectedImages = async () => {
	batchDeleteDialog.value = false;

	if (selectedForDelete.value.length === 0) return;

	try {
		await Promise.all(selectedForDelete.value.map((image) => imagesStore.delete(image)));
		selectedForDelete.value = [];
		emit('changeFolderList', selectedFolder.value);
		alert('選択した画像が削除されました');
	} catch (error) {
		alert(error);
	}
};

watch(selectedFolder, (newValue) => {
	emit('changeFolderList', newValue);
});

watch(() => props.selectedFolder, (newValue) => {
	selectedFolder.value = newValue;
});
</script>

<style scoped lang="scss">
	.fileBox {
		padding-top: 16px;
		clear: both;
	}
	ul.image-list{
		width: 100%;
		overflow: hidden;
		border: 1px solid #ddd;
		background: #f9f9f9;
		margin: 0;
		padding: 8px;
		text-align: center;

		li.thumbnail {
			height: 180px;
			width: 155px;
			float: left;
			border-right: 1px solid #ddd;
			border-bottom: 1px solid #ddd;
			margin: 5px auto;
			padding: 10px 0;
			position: relative;
			overflow: hidden;

			div {
				position: absolute;
				bottom: 10px;
				left: 0;
				text-align: center;
				width: 155px;

				.image-top {
					position: relative;
					margin: 5px 0;
					line-height: 1.2;
					display: inline-flex;

					input {
						position: relative;
						left: 8px;
					}
				}
				.file-name{
					width: 120px;
					height: 16px;
					margin: 0 auto;
					text-align: left;
					overflow: hidden;
				}
				.delete-image {
					position: relative;
					margin-top: 16px;

					.delete-icon {
						color: red;
					}
					.text-delete {
						position: relative;
						top: 2px;
					}
				}
			}
		}
	}
	.image-item img {
		width: 100px;
		height: 100px;
		object-fit: cover;
		cursor: pointer;
		border: 2px solid #ccc;
		border-radius: 8px;
		transition: transform 0.3s ease;
	}
	.image-item img:hover {
		transform: scale(1.1);
	}
</style>
