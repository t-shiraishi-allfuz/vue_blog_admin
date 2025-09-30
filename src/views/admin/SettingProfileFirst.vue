<template>
	<v-form v-if="blogSetting" ref="settingForm" @submit.prevent="updateSetting">
		<v-card class="user-login">
			<v-card-title class="cardHeader textCenter" color="info">
				<h4 class="cardTitle">プロフィール設定 1/2</h4>
			</v-card-title>
			<v-card-text>
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
				<v-btn color="success" variant="flat" type="submit">登録する</v-btn>
			</v-card-actions>
		</v-card>
	</v-form>
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

// ブログ設定更新
const updateSetting = async () => {
	try {
		// 確認ダイアログを表示
		const result = await Swal.fire({
			title: '設定を保存しますか？',
			text: 'ブログのタイトルと説明を保存して、次の設定画面に進みます。',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: '保存する',
			cancelButtonText: 'キャンセル',
			confirmButtonColor: '#F784C3',
			cancelButtonColor: '#6c757d'
		})

		if (result.isConfirmed) {
			// ローディング表示
			Swal.fire({
				title: '保存中...',
				text: '設定を保存しています',
				allowOutsideClick: false,
				allowEscapeKey: false,
				showConfirmButton: false,
				didOpen: () => {
					Swal.showLoading()
				}
			})

			await blogSettingStore.update(null, blogSetting.value)
			
			// 成功ダイアログ
			await Swal.fire({
				title: '保存完了',
				text: 'ブログの基本設定が保存されました。',
				icon: 'success',
				confirmButtonText: '次へ',
				confirmButtonColor: '#F784C3'
			})
			
			router.push({path: "/setting_profile_icon"})
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

onMounted(async () => {
	await blogSettingStore.getDetail()
})
</script>
