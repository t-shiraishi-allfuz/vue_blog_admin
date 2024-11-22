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
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">画像をアップロード</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>

	<div v-if="isDataLoaded">
		<v-tabs v-model="activeTab">
			<v-tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</v-tab>
		</v-tabs>
		<v-window v-model="activeTab">
			<v-window-item v-for="(component, index) in tabComponents" :key="index" transition="none" reverse-transition="none">
				<component :is="component" :selectedFolder="selectedFolder" @changeFolderList="changeFolderList" />
			</v-window-item>
		</v-window>
	</div>
</template>

<script setup>
import { ref, defineAsyncComponent, computed, onMounted, watch } from 'vue';
import { useImagesStore } from '@/stores/imagesStore';
import { useImagesFolderStore } from '@/stores/imagesFolderStore';
const PostImage = defineAsyncComponent(() => import('@/views/PostImage.vue'));
const ImageFolderList = defineAsyncComponent(() => import('@/views/ImageFolderList.vue'));

// 画像リスト取得
const imagesStore = useImagesStore();
const imageList = ref([]);

// 画像フォルダ取得
const imagesFolderStore = useImagesFolderStore();
const folderList = ref([]);

const tabs = ['画像管理', '画像フォルダ管理'];
const tabComponents = [
	PostImage,
	ImageFolderList
];

const activeTab = ref(0);
const fileInputValue = ref(null);
const selectedFiles = ref([]); // 選択した画像ファイル
const defaultSelect = ref({id: null, name: '指定なし'});
const selectedFolder = ref(defaultSelect.value);
const isDataLoaded = ref(false);

// フォルダリストにデフォルト値を追加
const extendedFolderList = computed(() => [
	defaultSelect.value,
	...folderList.value
]);

// ファイル選択時の処理
const handleFileUpload = (event) => {
	const files = event.target.files;
	selectedFiles.value = Array.from(files);

	// プレビュー用のURLとファイル名を取得
	const promises = selectedFiles.value.map(file => {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				resolve({ name: file.name, url: e.target.result });
			}
			reader.readAsDataURL(file);
		});
	});

	Promise.all(promises).then(results => {
		imageList.value.push(...results);
	});
};

// 画像をサーバーにアップロードする処理
const submitImages = async () => {
	if (selectedFiles.value.length === 0) {
		alert("画像を選択してください");
		return;
	}

	try {
		await Promise.all(selectedFiles.value.map((file) => imagesStore.create(file, selectedFolder.value.id)));
		// 再取得
		imageList.value = await reFetchImageList();
		// アップロード完了後、選択ファイルをリセット
		selectedFiles.value = [];
		fileInputValue.value = null;
		alert("画像がアップロードされました");
	} catch (error) {
		alert(error);
	}
};

// フォルダ切り替え
const changeFolderList = async (newValue) => {
	selectedFolder.value = newValue;
	await reFetchImageList();
}

// データ再取得
const reFetchImageList = async () => {
	try {
		imageList.value = await imagesStore.getList(selectedFolder.value.id);
	} catch (error) {
		alert(error);
	}
}

watch(selectedFolder, async (newValue) => {
	selectedFolder.value = newValue;
	await reFetchImageList();
})

onMounted(async() => {
	try {
		imageList.value = await imagesStore.getList(null);
		folderList.value = await imagesFolderStore.getList();
		isDataLoaded.value = true;
	} catch (error) {
		alert(error);
	}
})
</script>

<style scoped lang="scss">
	.form-group {
		margin-bottom: 16px;
	}
</style>
