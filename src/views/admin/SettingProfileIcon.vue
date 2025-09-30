<template>
	<v-form v-if="blogSetting" ref="settingForm" @submit.prevent="updateSetting">
		<v-card class="user-login">
			<v-card-title class="cardHeader textCenter" color="info">
				<h4 class="cardTitle">プロフィール設定 2/2</h4>
			</v-card-title>
			<v-card-text>
				<v-text-field
					label="ニックネームを入力して下さい"
					v-model="blogSetting.name"
				/>
				<v-file-input
					label="ブログアイコン"
					id="profileImage"
					type="file"
					accept="image/png,image/jpg,image/jpeg"
					@change="handleFileUpload"
				/>
				<v-img
					v-if="blogSetting.profileUrl"
					class="profile-preview"
					alt="Profile Preview"
					:src="blogSetting.profileUrl"
					cover
				/>
			</v-card-text>
			<v-card-actions>
				<v-btn color="grey-lighten-2" variant="flat" @click="skipSetting">あとで</v-btn>
				<v-btn color="primary" variant="flat" type="submit">登録する</v-btn>
			</v-card-actions>
		</v-card>
	</v-form>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import Swal from 'sweetalert2'

// ブログ設定
const router = useRouter()
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
	try {
		// 確認ダイアログを表示
		const result = await Swal.fire({
			title: '設定を完了しますか？',
			text: 'プロフィール設定を保存して、ブログを開始します。',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: '完了する',
			cancelButtonText: 'キャンセル',
			confirmButtonColor: '#F784C3',
			cancelButtonColor: '#6c757d'
		})

		if (result.isConfirmed) {
			// ローディング表示
			Swal.fire({
				title: '保存中...',
				text: 'プロフィール設定を保存しています',
				allowOutsideClick: false,
				allowEscapeKey: false,
				showConfirmButton: false,
				didOpen: () => {
					Swal.showLoading()
				}
			})

			if (profileImage.value) {
				await blogSettingStore.update(profileImage, blogSetting.value)
			}
			
			// 成功ダイアログ
			await Swal.fire({
				title: '設定完了',
				text: 'プロフィール設定が完了しました。ブログを開始できます！',
				icon: 'success',
				confirmButtonText: 'ブログを開始',
				confirmButtonColor: '#F784C3'
			})
			
			router.push('/')
		}
	} catch (error) {
		console.error('設定保存エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: error.message || '設定の保存に失敗しました',
			icon: 'error',
			confirmButtonText: 'OK',
			confirmButtonColor: '#F784C3'
		})
	}
}

// 設定をスキップする処理
const skipSetting = async () => {
	try {
		const result = await Swal.fire({
			title: '設定をスキップしますか？',
			text: 'プロフィール画像の設定をスキップして、ブログを開始します。後から設定画面で変更できます。',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'スキップする',
			cancelButtonText: 'キャンセル',
			confirmButtonColor: '#6c757d',
			cancelButtonColor: '#F784C3'
		})

		if (result.isConfirmed) {
			await Swal.fire({
				title: 'ブログを開始',
				text: 'ブログを開始します。設定は後から変更できます。',
				icon: 'info',
				confirmButtonText: 'OK',
				confirmButtonColor: '#F784C3'
			})
			
			router.push('/')
		}
	} catch (error) {
		console.error('スキップ処理エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: '処理中にエラーが発生しました',
			icon: 'error',
			confirmButtonText: 'OK',
			confirmButtonColor: '#F784C3'
		})
	}
}

onMounted(async () => {
	await blogSettingStore.getDetail()
})
</script>

<style scoped>
	.profile-preview {
		width: 80px;
		height: 80px;
		margin-bottom: 10px;
		border-radius: 50%;
	}
</style>
