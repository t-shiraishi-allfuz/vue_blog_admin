<template>
	<v-container>
		<v-form v-if="blogSetting" ref="settingForm" @submit.prevent="updateSetting">
			<v-card class="profile-settings">
				<v-card-text>
					<v-text-field
						label="ニックネームを入力して下さい"
						v-model="blogSetting.name"
					/>
					<v-file-input
						label="ブログアイコンを設定して下さい"
						id="profileImage"
						type="file"
						accept="image/png, image/jpg, image/jpeg"
						@change="handleFileUpload"
					/>
					<v-avatar
						v-if="blogSetting.profileUrl"
						class="profile-image"
						alt="Profile Preview"
						size="64"
						:image="blogSetting.profileUrl"
					/>
					<v-text-field
						label="ブログのタイトルを入力して下さい"
						v-model="blogSetting.title"
					/>
					<v-text-field
						label="ブログの説明を入力して下さい"
						v-model="blogSetting.description"
					/>
				</v-card-text>
				<v-card-actions>
					<v-btn
						class="mx-2"
						color="success"
						type="submit"
						variant="flat"
					>
						更新する
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</v-container>
	<BlogCategoryList />
</template>

<script setup lang="ts">
import { useBlogSettingStore } from '@/stores/blogSettingStore'
const BlogCategoryList = defineAsyncComponent(() => import('@/views/admin/BlogCategoryList.vue'))

// ブログ設定
const blogSettingStore = useBlogSettingStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const profileImage = ref(null)

// ファイルアップロードの処理
const handleFileUpload = (event) => {
	const file = event.target.files[0]
	if (file) {
		profileImage.value = file
    
		// 画像のプレビュー
		const reader = new FileReader()
		reader.onload = (e) => {
			blogSetting.value.profileUrl = e.target.result
		}
		reader.readAsDataURL(file)
	}
}

// ブログ設定更新
const updateSetting = async () => {
	await blogSettingStore.update(profileImage, blogSetting.value)

	profileImage.value = null
}
</script>

<style scoped>
	.profile-image {
		margin-bottom: 10px;
	}
</style>
