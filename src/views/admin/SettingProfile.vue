<template>
	<v-container>
		<v-form ref="settingForm" @submit.prevent="updateSetting">
			<v-card class="profile-settings">
				<v-card-text>
					<v-file-input
						label="ブログアイコンを設定して下さい"
						id="profileImage"
						type="file"
						accept="image/png, image/jpg, image/jpeg"
						@change="handleFileUpload" />
					<v-avatar
						v-if="blogSettingStore.tempSetting.profileUrl"
						:image="blogSettingStore.tempSetting.profileUrl"
						alt="Profile Preview"
						class="profile-image"
						size="64" />
					<v-text-field
						type="text"
						label="ブログのタイトルを入力して下さい"
						v-model="blogSettingStore.tempSetting.title" />
					<v-text-field
						type="text"
						label="ブログの説明を入力して下さい"
						v-model="blogSettingStore.tempSetting.description" />
					<v-select
						label="カテゴリー選択"
						:items="['一般', 'アダルト']"
						v-model="blogSettingStore.tempSetting.category" />
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit">更新する</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>
	<BlogCategoryList />
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue';
import { useBlogSettingStore } from '@/stores/blogSettingStore';
const BlogCategoryList = defineAsyncComponent(() => import('@/views/admin/BlogCategoryList.vue'));

// ブログ設定
const blogSettingStore = useBlogSettingStore();
const profileImage = ref(null);

// ファイルアップロードの処理
const handleFileUpload = (event) => {
	const file = event.target.files[0];
	if (file) {
		profileImage.value = file;
    
		// 画像のプレビュー
		const reader = new FileReader();
		reader.onload = (e) => {
			blogSettingStore.tempSetting.profileUrl = e.target.result;
		};
		reader.readAsDataURL(file);
	}
};

// ブログ設定更新
const updateSetting = async () => {
	try {
		await blogSettingStore.update(profileImage);
		alert('プロフィールを更新しました');

		profileImage.value = null;
	} catch (error) {
		alert(error);
	}
};
</script>

<style scoped>
	.profile-image {
		margin-bottom: 10px;
	}
</style>
