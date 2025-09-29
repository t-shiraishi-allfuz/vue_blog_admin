<template>
	<CommonLoginTemplate>
		<v-form ref="settingForm" @submit.prevent="resetPassword">
			<v-card class="user-login">
				<v-card-title class="cardHeader textCenter" color="info">
					<h4 class="cardTitle">パスワードリセット</h4>
				</v-card-title>
				<v-card-text>
					<v-text-field
						:prepend-inner-icon="mdiEmailOutline"
						v-model="email"
						label="登録済みのメールアドレスを入力して下さい"
						type="email" />
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit" @click="resetPassword">パスワードリセット</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</CommonLoginTemplate>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2'

const authStore = useAuthStore()

const email = ref('')

// パスワードリセット
const resetPassword = async () => {
	if (!email.value) {
		await Swal.fire({
			title: 'エラー',
			text: 'メールアドレスが入力されていません',
			icon: 'error'
		})
		return
	}

	try {
		await authStore.resetPassword(email.value)
		await Swal.fire({
			title: '成功',
			text: 'パスワードリセットメールが送信されました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
	} catch(error) {
		console.error('パスワードリセットエラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'パスワードリセットメールの送信に失敗しました',
			icon: 'error'
		})
	}
}
</script>

<style scoped>
	input[type="email"] {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
