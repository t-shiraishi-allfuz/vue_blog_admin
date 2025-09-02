<template>
	<v-container class="image-upload">
		<v-form v-if="isLoading" @submit.prevent="submitImages">
			<v-card class="post-image-list">
				<v-card-title>画像アップロード</v-card-title>
				<v-card-text>
					<v-file-input
						id="images"
						type="file"
						label="画像を選択して下さい"
						accept="image/png, image/jpg, image/jpeg"
						multiple
						v-model="fileInputValue"
						@change="handleFileUpload" />
				</v-card-text>
				<v-card-text>
					<v-select
						v-if="folderList.length > 0"
						label="アップロードする画像フォルダを選択して下さい"
						:items="extendedFolderList"
						item-title="name"
						item-value="id"
						v-model="selectedFolder"
						return-object
						hide-details />
				</v-card-text>
				<v-card-text v-if="previewFiles.length > 0">
					<div class="image-gallery">
						<div v-for="(file, index) in previewFiles" :key="index" class="image-item">
							<img :src="file.url" @click="openImageViewer(file.url)" alt="Image" />
						</div>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">画像をアップロード</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>

	<div v-if="isLoading">
		<v-tabs v-model="activeTab">
			<v-tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</v-tab>
		</v-tabs>
		<v-window v-model="activeTab">
			<v-window-item v-for="(component, index) in tabComponents" :key="index" transition="none" reverse-transition="none">
				<component :is="component" :selectedFolder="selectedFolder" @changeFolderList="changeFolderList" @reFetchFolderList="reFetchFolderList" />
			</v-window-item>
		</v-window>
	</div>

	<v-dialog
		class="openImageViewer"
		v-model="imageViewerDialog"
		max-width="800px"
		overlay-color="rgba(0, 0, 0, 0.5)"
		scrollable
	>
		<v-card>
			<v-card-text>
				<img :src="currentImage" alt="Preview" style="width:100% height:auto;" @click="imageViewerDialog = false" />
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useImagesStore } from '@/stores/imagesStore'
import { useImagesFolderStore } from '@/stores/imagesFolderStore'
const PostImage = defineAsyncComponent(() => import('@/views/admin/PostImage.vue'))
const ImageFolderList = defineAsyncComponent(() => import('@/views/admin/ImageFolderList.vue'))

// 画像リスト取得
const imagesStore = useImagesStore()

// 画像フォルダ取得
const imagesFolderStore = useImagesFolderStore()
const folderList = computed(() => imagesFolderStore.folderList)

const tabs = ['画像管理', '画像フォルダ管理']
const tabComponents = [
	PostImage,
	ImageFolderList
]

const activeTab = ref(0)
const fileInputValue = ref(null)
const selectedFiles = ref([]) // 選択した画像ファイル
const previewFiles = ref([])
const defaultSelect = ref({id: null, name: '指定なし'})
const selectedFolder = ref(defaultSelect.value)
const isLoading = ref(false)

// モーダル用データ
const imageViewerDialog = ref(false)
const currentImage = ref(null)

// フォルダリストにデフォルト値を追加
const extendedFolderList = computed(() => {
	return [defaultSelect.value, ...folderList.value]
})

// ファイル選択時の処理
const handleFileUpload = (event) => {
	const files = event.target.files
	selectedFiles.value = Array.from(files)

	// プレビュー用のURLとファイル名を取得
	const promises = selectedFiles.value.map(file => {
		return new Promise((resolve) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				resolve({ name: file.name, url: e.target.result })
			}
			reader.readAsDataURL(file)
		})
	})

	Promise.all(promises).then(results => {
		previewFiles.value = results
	})
}

// 画像をサーバーにアップロードする処理
const submitImages = async () => {
	if (selectedFiles.value.length === 0) {
		alert("画像を選択してください")
		return
	}

	try {
		await Promise.all(selectedFiles.value.map((file) => imagesStore.create(file, selectedFolder.value.id)))
		await reFetchImageList()
		// アップロード完了後、選択ファイルをリセット
		selectedFiles.value = []
		previewFiles.value = []
		fileInputValue.value = null
		alert("画像がアップロードされました")
	} catch (error) {
		alert(error)
	}
}

// プレビュー表示
const openImageViewer = (imageUrl) => {
	currentImage.value = imageUrl
	imageViewerDialog.value = true
}

// フォルダ切り替え
const changeFolderList = async (newValue) => {
	selectedFolder.value = newValue
	await reFetchImageList()
}

// データ再取得
const reFetchImageList = async () => {
	await imagesStore.getList(selectedFolder.value.id)
}

// データ再取得
const reFetchFolderList = async () => {
	await imagesFolderStore.getList()
}

watch(selectedFolder, async (newValue) => {
	selectedFolder.value = newValue
	await reFetchImageList()
})

onMounted(async() => {
	await imagesStore.getList(null)
	await imagesFolderStore.getList()
	isLoading.value = true
})
</script>

<style scoped lang="scss">
	.form-group {
		margin-bottom: 16px;
	}
	.image-gallery {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
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
