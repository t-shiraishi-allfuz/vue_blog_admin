<template>
	<v-container>
		<v-form v-if="blogSetting" ref="settingForm" @submit.prevent="updateSetting">
			<v-card class="profile-settings">
				<v-card-text>
					<v-text-field
						label="ニックネームを入力して下さい"
						v-model="(blogSetting as any).name"
						:rules="validationRules.name"
						counter="16"
						maxlength="16"
					/>
					<v-file-input
						label="ブログアイコンを設定して下さい"
						id="profileImage"
						type="file"
						accept="image/png, image/jpg, image/jpeg"
						@change="handleFileUpload"
					/>
					<v-avatar
						v-if="(blogSetting as any)?.profileUrl"
						class="profile-image"
						alt="Profile Preview"
						size="64"
						:image="(blogSetting as any)?.profileUrl"
					/>
					<v-text-field
						label="ブログのタイトルを入力して下さい"
						v-model="(blogSetting as any).title"
						:rules="validationRules.title"
						counter="50"
						maxlength="50"
					/>
					<v-text-field
						label="ブログの説明を入力して下さい"
						v-model="(blogSetting as any).description"
						:rules="validationRules.description"
						counter="140"
						maxlength="140"
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
import Swal from 'sweetalert2'
const BlogCategoryList = defineAsyncComponent(() => import('@/views/admin/BlogCategoryList.vue'))

// ブログ設定
const blogSettingStore = useBlogSettingStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const profileImage = ref<File | null>(null)

// バリデーションルール
const validationRules = {
	name: [
		(v: string) => !!v || 'ニックネームは必須です',
		(v: string) => (v && v.length <= 16) || 'ニックネームは16文字以内で入力してください'
	],
	title: [
		(v: string) => !!v || 'ブログタイトルは必須です',
		(v: string) => (v && v.length <= 50) || 'ブログタイトルは50文字以内で入力してください'
	],
	description: [
		(v: string) => !!v || 'ブログ説明は必須です',
		(v: string) => (v && v.length <= 140) || 'ブログ説明は140文字以内で入力してください'
	]
}

// ファイルアップロードの処理
const handleFileUpload = (event: Event) => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (file && blogSetting.value) {
		profileImage.value = file
    
		// 画像のプレビュー
		const reader = new FileReader()
		reader.onload = (e) => {
			if (e.target?.result && blogSetting.value) {
				(blogSetting.value as any).profileUrl = e.target.result as string
			}
		}
		reader.readAsDataURL(file)
	}
}

// フォーム参照
const settingForm = ref<any>(null)

// ブログ設定更新
const updateSetting = async () => {
	// フォームバリデーション
	if (settingForm.value) {
		const { valid } = await settingForm.value.validate()
		if (!valid) {
			return
		}
	}

	try {
		await blogSettingStore.update(profileImage, blogSetting.value)
		profileImage.value = null
		
		// 成功メッセージ
		await Swal.fire({
			title: '成功',
			text: 'プロフィールが更新されました',
			icon: 'success'
		})
	} catch (error) {
		console.error('プロフィール更新エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'プロフィールの更新に失敗しました',
			icon: 'error'
		})
	}
}
</script>

<style scoped>
	.profile-image {
		margin-bottom: 10px;
	}
</style>
