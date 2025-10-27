<template>
	<CommonLoginTemplate>
		<v-form ref="settingForm" @submit.prevent="resetPassword">
			<v-card class="user-login">
				<v-card-title class="cardHeader textCenter" color="info">
					<h4 class="cardTitle">新しいパスワード設定</h4>
				</v-card-title>
				<v-card-text>
					<v-text-field
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						v-model="password"
						label="新しいパスワードを入力して下さい"
						prepend-inner-icon="mdi-lock-outline"
						@click:append-inner="changeVisible" />
					<v-text-field
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						v-model="confirmPassword"
						label="もう一度新しいパスワードを入力して下さい"
						prepend-inner-icon="mdi-lock-outline"
						@click:append-inner="changeVisible" />
				</v-card-text>
				<v-card-actions>
					<v-btn color="primary" variant="flat" type="submit" @click="resetPassword">送信</v-btn>
				</v-card-actions>
			</v-card>
		</v-form>
	</CommonLoginTemplate>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2'

const route = useRoute()
const oobCode = route.query.oobCode as string

const router = useRouter()
const authStore = useAuthStore()

const password = ref<string>('')
const confirmPassword = ref<string>('')
const visibleIcon = ref<string>("mdi-eye-off")
const visibleType = ref<string>('password')

// 入力タイプ切り替え
const changeVisible = (): void => {
	visibleIcon.value = visibleIcon.value === "mdi-eye-off" ? "mdi-eye" : "mdi-eye-off"
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password'
}

// パスワードリセット
const resetPassword = async (): Promise<void> => {
	if (password.value !== confirmPassword.value) {
		await Swal.fire({
			title: 'エラー',
			text: 'パスワードが一致しません',
			icon: 'error'
		})
		return
	}

	if (!oobCode) {
		await Swal.fire({
			title: 'エラー',
			text: 'パスワード再設定コードがありません',
			icon: 'error'
		})
		return
	}

	try {
		await authStore.resetPasswordConfirm(oobCode, password.value)
		await Swal.fire({
			title: '成功',
			text: 'パスワードがリセットされました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})

		await authStore.initializeAuth()
		router.push({path: "/user_login"})
	} catch(error) {
		console.error('パスワードリセットエラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: 'パスワードのリセットに失敗しました',
			icon: 'error'
		})
	}
}

onMounted(async (): Promise<void> => {
	if (!oobCode) {
		await Swal.fire({
			title: 'エラー',
			text: 'パスワード再設定コードがありません',
			icon: 'error'
		})
	}
})
</script>

<style scoped>
	input[type="email"] {
		width: 100%;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
</style>
