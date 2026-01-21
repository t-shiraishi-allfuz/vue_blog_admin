<template>
	<v-container>
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
	</v-container>
</template>

<script setup lang="ts">
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import Swal from 'sweetalert2'

// ブログ設定
const router = useRouter()
const blogSettingStore = useBlogSettingStore()
const {
	blogSetting
} = storeToRefs(blogSettingStore)

const profileImage = ref<File | null>(null)

// ファイルアップロードの処理
const handleFileUpload = (event: Event): void => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (file && blogSetting.value) {
		profileImage.value = file
    
		// 画像のプレビュー
		const reader = new FileReader()
		reader.onload = (e: ProgressEvent<FileReader>) => {
			const target = e.target as FileReader
			if (target?.result && blogSetting.value) {
				blogSetting.value.profileUrl = target.result as string
			}
		}
		reader.readAsDataURL(file)
	}
}

// ブログ設定更新
const updateSetting = async (): Promise<void> => {
	try {
		// blogSettingの存在チェック
		if (!blogSetting.value) {
			await Swal.fire({
				title: 'エラー',
				text: 'ブログ設定が読み込まれていません',
				icon: 'error',
				confirmButtonColor: '#90A4AE'
			})
			return
		}

		// 確認ダイアログを表示
		const result = await Swal.fire({
			title: '設定を完了しますか？',
			text: 'プロフィール設定を保存して、ブログを開始します。',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: '完了する',
			cancelButtonText: 'キャンセル',
			confirmButtonColor: '#27C1A3',
			cancelButtonColor: '#90A4AE',
			reverseButtons: true
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
				await blogSettingStore.update(profileImage.value, blogSetting.value as any)
			}
			
			// 成功ダイアログ
			await Swal.fire({
				title: '設定完了',
				text: 'プロフィール設定が完了しました。ブログを開始できます！',
				icon: 'success',
				confirmButtonText: 'ブログを開始',
				confirmButtonColor: '#27C1A3'
			})
			
			router.push('/')
		}
	} catch (error) {
		console.error('設定保存エラー:', error)
		const errorMessage = error instanceof Error ? error.message : '設定の保存に失敗しました'
		await Swal.fire({
			title: 'エラー',
			text: errorMessage,
			icon: 'error',
			confirmButtonColor: '#90A4AE'
		})
	}
}

// 設定をスキップする処理
const skipSetting = async (): Promise<void> => {
	try {
		const result = await Swal.fire({
			title: '設定をスキップしますか？',
			text: 'プロフィール画像の設定をスキップして、ブログを開始します。後から設定画面で変更できます。',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'スキップする',
			cancelButtonText: 'キャンセル',
			confirmButtonColor: '#27C1A3',
			cancelButtonColor: '#90A4AE',
			reverseButtons: true
		})

		if (result.isConfirmed) {
			await Swal.fire({
				title: 'ブログを開始',
				text: 'ブログを開始します。設定は後から変更できます。',
				icon: 'info',
				confirmButtonText: 'OK',
				confirmButtonColor: '#90A4AE'
			})
			
			router.push('/')
		}
	} catch (error) {
		console.error('スキップ処理エラー:', error)
		const errorMessage = error instanceof Error ? error.message : '処理中にエラーが発生しました'
		await Swal.fire({
			title: 'エラー',
			text: errorMessage,
			icon: 'error',
			confirmButtonColor: '#90A4AE'
		})
	}
}

onMounted(async (): Promise<void> => {
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
