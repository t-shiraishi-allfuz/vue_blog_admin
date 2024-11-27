<template>
	<CommonLoginTemplate>
		<v-form ref="settingForm" @submit.prevent="updateSetting">
			<v-card class="user-login">
				<v-card-title class="cardHeader textCenter" color="info">
					<h4 class="cardTitle">プロフィール設定 2/2</h4>
				</v-card-title>
				<v-card-text>
					<v-file-input
						label="ブログアイコン"
						id="profileImage"
						type="file"
						@change="handleFileUpload"
						accept="image/png,image/jpg,image/jpeg" />
					<v-img v-if="blogSettingStore.tempSetting.profileUrl" :src="blogSettingStore.tempSetting.profileUrl" alt="Profile Preview" class="profile-preview" cover />
				</v-card-text>
				<v-card-actions>
					<v-btn color="grey-lighten-2" variant="flat" type="submit">あとで</v-btn>
					<v-btn color="primary" variant="flat" type="submit">登録する</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</CommonLoginTemplate>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBlogSettingStore } from '@/stores/blogSettingStore';

// ブログ設定
const router = useRouter();
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
	if (profileImage.value) {
		try {
			await blogSettingStore.updateSettingFromFirestore(profileImage);
			router.push('/');
		} catch (error) {
			alert(error);
		}
	} else {
		router.push('/');
	}
};

onMounted(() => {
	blogSettingStore.fetchSettingFromFirestore();
});
</script>

<style scoped>
	.profile-preview {
		width: 80px;
		height: 80px;
		margin-bottom: 10px;
		border-radius: 50%;
	}
</style>
