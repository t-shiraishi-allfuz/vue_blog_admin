<template>
	<v-form ref="settingForm" @submit.prevent="createUser">
		<v-card class="user-login">
			<v-card-title class="cardHeader textCenter" color="info">
				<h4 class="cardTitle">ユーザー登録</h4>
			</v-card-title>
			<v-card-text>
				<v-text-field
					prepend-inner-icon="mdi-email-outline"
					v-model="email"
					label="メールアドレスを入力して下さい"
					type="email" />
				<v-text-field
					:append-inner-icon="visibleIcon"
					:type="visibleType"
					v-model="password"
					label="パスワードを入力して下さい"
					prepend-inner-icon="mdi-lock-outline"
					@click:append-inner="changeVisible" />
			</v-card-text>
			<v-card-text>
				<router-link to="/user_login">
					登録済みの方はこちら
				</router-link>
			</v-card-text>
			<v-card-text v-if="errorMessage" class="text-center">
				<v-alert type="error" variant="tonal" closable @click:close="errorMessage = ''">
					{{ errorMessage }}
				</v-alert>
			</v-card-text>
			<v-card-actions justify="center">
				<v-btn color="primary" variant="flat" type="submit">登録する</v-btn>
			</v-card-actions>
			<v-divider class="my-4"></v-divider>
			<v-card-actions justify="center">
				<GoogleLogin
					:callback="handleGoogleLogin"
					:client-id="googleClientId"
					:button-config="googleButtonConfig"
					:loading="isGoogleLoading"
					@error="handleGoogleError"
				/>
			</v-card-actions>
		</v-card>
	</v-form>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { GoogleLogin } from 'vue3-google-login'
import Swal from 'sweetalert2'

const router = useRouter()
const authStore = useAuthStore()

const email = ref<string>('')
const password = ref<string>('')
const visibleIcon = ref<string>("mdi-eye-off")
const visibleType = ref<string>('password')
const isGoogleLoading = ref<boolean>(false)
const errorMessage = ref<string>('')

// Google認証の設定
const googleClientId = computed<string>(() => {
	// 環境変数からGoogle Client IDを取得
	return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
})

const googleButtonConfig = {
	type: 'standard',
	theme: 'outline',
	size: 'large',
	text: 'signup_with',
	shape: 'rectangular',
	logo_alignment: 'left',
	width: '300'
}

// Google認証のエラーハンドリング
const handleGoogleError = (error: any): void => {
	console.error('Google認証エラー:', error)
	errorMessage.value = 'Google認証でエラーが発生しました'
}

// 新規ユーザー登録成功ダイアログ
const showRegistrationSuccessDialog = async (): Promise<void> => {
	try {
		const result = await Swal.fire({
			title: '登録完了',
			text: 'ユーザー登録が完了しました。初期設定画面に移動します。',
			icon: 'success',
			confirmButtonText: 'OK',
			confirmButtonColor: '#F784C3',
			showCancelButton: false,
			allowOutsideClick: false,
			allowEscapeKey: false
		})
		
		if (result.isConfirmed) {
			router.push('/setting_first')
		}
	} catch (error) {
		console.error('ダイアログエラー:', error)
		// ダイアログでエラーが発生した場合も設定画面にリダイレクト
		router.push('/setting_first')
	}
}

// 既存ユーザー用ダイアログ
const showExistingUserDialog = async (): Promise<void> => {
	try {
		const result = await Swal.fire({
			title: 'ログイン完了',
			text: '既に登録済みのアカウントです。ホームページに移動します。',
			icon: 'success',
			confirmButtonText: 'OK',
			confirmButtonColor: '#F784C3',
			showCancelButton: false,
			allowOutsideClick: false,
			allowEscapeKey: false
		})
		
		if (result.isConfirmed) {
			router.push('/')
		}
	} catch (error) {
		console.error('ダイアログエラー:', error)
		// ダイアログでエラーが発生した場合もホームページにリダイレクト
		router.push('/')
	}
}

// 入力タイプ切り替え
const changeVisible = (): void => {
	visibleIcon.value = visibleIcon.value === "mdi-eye-off" ? "mdi-eye" : "mdi-eye-off"
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password'
}

// ユーザー登録処理
const createUser = async (): Promise<void> => {
	try {
		errorMessage.value = ''
		await authStore.create(email.value, password.value)
		await showRegistrationSuccessDialog()
	} catch (error) {
		console.error('ユーザー登録エラー:', error)
		const errorMsg = error instanceof Error ? error.message : 'ユーザー登録に失敗しました'
		errorMessage.value = errorMsg
	}
}

// Google認証でログイン
const handleGoogleLogin = async (response: any): Promise<void> => {
	try {
		errorMessage.value = ''
		isGoogleLoading.value = true
		
		await authStore.loginWithGoogle(response)
		
		// 認証成功後の処理
		if (authStore.isLogin) {
			// 新規ユーザーか既存ユーザーかを判定してリダイレクト
			if (authStore.isNewUser) {
				// 新規ユーザー
				router.push('/setting_first')
			} else {
				// 既存ユーザー - ダイアログを表示してからリダイレクト
				await showExistingUserDialog()
			}
		} else {
			errorMessage.value = '認証に失敗しました'
		}
	} catch (error) {
		console.error('Google認証エラー:', error)
		const errorMsg = error instanceof Error ? error.message : 'Google認証に失敗しました'
		errorMessage.value = errorMsg
	} finally {
		isGoogleLoading.value = false
	}
}
</script>
