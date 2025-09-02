<template>
	<v-form v-if="setting" ref="settingForm" @submit.prevent="updateSetting">
		<v-card class="user-login">
			<v-card-title class="cardHeader textCenter" color="info">
				<h4 class="cardTitle">プロフィール設定 2/2</h4>
			</v-card-title>
			<v-card-text>
				<v-text-field
					label="ニックネームを入力して下さい"
					v-model="setting.name"
				/>
				<v-file-input
					label="ブログアイコン"
					id="profileImage"
					type="file"
					accept="image/png,image/jpg,image/jpeg"
					@change="handleFileUpload"
				/>
				<v-img
					v-if="setting.profileUrl"
					class="profile-preview"
					alt="Profile Preview"
					:src="setting.profileUrl"
					cover
				/>
			</v-card-text>
			<v-card-actions>
				<v-btn color="grey-lighten-2" variant="flat" type="submit">あとで</v-btn>
				<v-btn color="primary" variant="flat" type="submit">登録する</v-btn>
			</v-card-actions>
		</v-card>
	</v-form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogSettingStore } from '@/stores/blogSettingStore'

// ブログ設定
const router = useRouter()
const blogSettingStore = useBlogSettingStore()

const setting = ref(blogSettingStore.blogSetting)
const profileImage = ref(null)

// ファイルアップロードの処理
const handleFileUpload = (event) => {
	const file = event.target.files[0]
	if (file) {
		profileImage.value = file
    
		// 画像のプレビュー
		const reader = new FileReader()
		reader.onload = (e) => {
			setting.value.profileUrl = e.target.result
		}
		reader.readAsDataURL(file)
	}
}

// ブログ設定更新
const updateSetting = async () => {
	if (profileImage.value) {
		await blogSettingStore.update(profileImage, setting.value)
	}
	router.push('/')
}
</script>

<style scoped>
	.profile-preview {
		width: 80px;
		height: 80px;
		margin-bottom: 10px;
		border-radius: 50%;
	}
</style>
