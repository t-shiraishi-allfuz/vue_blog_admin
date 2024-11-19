<template>
	<v-container class="image-upload">
		<v-form @submit.prevent="submitImages">
			<v-card class="post-image-list">
				<v-card-title>画像アップロード</v-card-title>
				<v-card-text>
					<v-file-input
						id="images"
						type="file"
						label="画像を選択して下さい"
						accept="image/png, image/jpg, image/jpeg"
						multiple
						@change="handleFileUpload" />
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">画像をアップロード</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>

	<v-container class="image-upload">
		<v-card class="post-image-list">
			<v-card-title>アップロード済みの画像</v-card-title>
			<v-card-text>
				<v-card-actions v-if="uploadedImages.length > 0">
					<v-btn color="primary" variant="flat" @click="openBatchDeleteDialog">一括削除</v-btn>
					<v-checkbox v-model="allSelected" label="全選択" @change="toggleAllSelection" hide-details />
				</v-card-actions>
				<div class="fileBox">
					<ul class="image-list" v-if="uploadedImages.length > 0">
						<li class="thumbnail" v-for="(image, index) in uploadedImages" :key="index">
							<div class="image-box">
								<div class="image-top">
									<input type="checkbox" v-model="selectedForDelete" :value="image" />
									<label class="file-name">{{ image.name }}</label>
								</div>
								<span>
									<a :href="image.url" target="_blank">
										<img :src="image.url" :alt="'Image ' + (index + 1)" />
									</a>
								</span>
								<div class="delete-image">
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

		<v-dialog v-model="deleteDialog" max-width="400px">
			<v-card>
				<v-card-title>削除確認</v-card-title>
				<v-card-text>この画像を本当に削除しますか？</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="grey-lighten-2" variant="flat" @click="deleteDialog = false">閉じる</v-btn>
					<v-btn color="primary" variant="flat" @click="confirmDelete">削除</v-btn>
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
					<v-btn color="primary" variant="flat" @click="confirmBatchDelete">削除</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useImagesStore } from '@/stores/imagesStore';
import { mdiDelete } from '@mdi/js';

const imagesStore = useImagesStore();
const uploadedImages = ref([]); // アップロードした画像ファイル
const selectedFiles = ref([]); // 選択した画像ファイル
const selectedForDelete = ref([]); // 削除用の選択画像リスト
const allSelected = ref(false); // 全選択チェックボックス
const deleteDialog = ref(false);
const batchDeleteDialog = ref(false);
const imageToDelete = ref(null);

// ファイル選択時の処理
const handleFileUpload = (event) => {
	const files = event.target.files;
	selectedFiles.value = Array.from(files);

	// プレビュー用のURLとファイル名を取得
	selectedFiles.value.forEach(file => {
		const reader = new FileReader();
		reader.onload = (e) => {
			uploadedImages.value.push({ name: file.name, url: e.target.result });
		};
		reader.readAsDataURL(file);
	});
};

// アップロード済みの画像を取得
const fetchImages = async () => {
	try {
		uploadedImages.value = await imagesStore.getList();
	} catch (error) {
		alert(error);
	}
}

// 画像をサーバーにアップロードする処理
const submitImages = async () => {
	if (selectedFiles.value.length === 0) return;

	try {
		for (const file of selectedFiles.value) {
			await imagesStore.create(file);
		}
		// アップロード完了後、選択ファイルをリセット
		selectedFiles.value = [];
		alert("画像がアップロードされました");
	} catch (error) {
		alert(error);
	}
};

// 個別削除確認ダイアログを開く
const openDeleteDialog = (image) => {
	imageToDelete.value = image;
	deleteDialog.value = true;
};

// 個別削除を確定する
const confirmDelete = async () => {
	deleteDialog.value = false;
	await deleteImage(imageToDelete.value);
};

// 一括削除確認ダイアログを開く
const openBatchDeleteDialog = () => {
	if (selectedForDelete.value.length === 0) return;
	batchDeleteDialog.value = true;
};

// 一括削除を確定する
const confirmBatchDelete = async () => {
	batchDeleteDialog.value = false;
	await deleteSelectedImages();
};

// 全ての画像を選択・選択解除
const toggleAllSelection = () => {
	selectedForDelete.value = allSelected.value ? [...uploadedImages.value] : [];
};

// 画像削除
const deleteImage = async (image) => {
	try {
		await imagesStore.delete(image);

		alert('画像が削除されました');
	} catch (error) {
		alert(error);
	}
};

// 一括削除
const deleteSelectedImages = async () => {
	if (selectedForDelete.value.length === 0) return;

	try {
		for (const image of selectedForDelete.value) {
			await imagesStore.delete(image);
			uploadedImages.value = uploadedImages.value.filter(img => img.id !== image.id);
		}
		alert('選択した画像が削除されました');
		selectedForDelete.value = [];
	} catch (error) {
		alert(error);
	}
};

onMounted(() => {
	fetchImages();
})
</script>

<style scoped lang="scss">
	.form-group {
		margin-bottom: 16px;
	}

	label {
		display: block;
		font-weight: bold;
		margin-bottom: 8px;
	}

	input[type="file"] {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
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
			padding: 10px 0;
			position: relative;
			overflow: hidden;

			div {
				position: absolute;
				bottom: 10px;
				left: 0;
				text-align: center;
				width: 155px;

				img{
					width: auto;
					height: auto;
					max-width: 145px;
					height: 100px;
					border: 1px solid #0270cc;
					object-fit: cover;
				}
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
</style>
