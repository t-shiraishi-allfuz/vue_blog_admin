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
					<v-img
						v-if="blogSettingStore.tempSetting.profileUrl"
						:src="blogSettingStore.tempSetting.profileUrl"
						alt="Profile Preview"
						class="profile-preview" cover />
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
</template>

<script setup>
import { useBlogSettingStore } from '@/stores/blogSettingStore';
import { ref } from 'vue';

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
const updateSetting = () => {
	blogSettingStore.updateSettingFromFirestore(profileImage);
};
</script>

<style scoped>
	.profile-preview {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		margin-bottom: 10px;
	}
</style>
