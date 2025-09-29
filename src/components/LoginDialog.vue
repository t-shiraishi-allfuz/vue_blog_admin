<template>
	<v-dialog v-model="dialog" max-width="500px" persistent>
		<v-card>
			<v-card-title class="text-center pa-6">
				<h4 class="text-h5">ログイン</h4>
			</v-card-title>
			
			<v-form ref="loginForm" @submit.prevent="loginUser">
				<v-card-text class="pa-6">
					<v-text-field
						v-model="email"
						:prepend-inner-icon="mdi-email-outline"
						label="メールアドレスを入力して下さい"
						type="email"
						:rules="emailRules"
						class="mb-4"
					/>
					<v-text-field
						v-model="password"
						:prepend-inner-icon="mdi-lock-outline"
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						label="パスワードを入力して下さい"
						:rules="passwordRules"
						@click:append-inner="changeVisible"
						class="mb-4"
					/>
					
					<v-alert
						v-if="errorMessage"
						type="error"
						variant="tonal"
						closable
						@click:close="errorMessage = ''"
						class="mb-4"
					>
						{{ errorMessage }}
					</v-alert>
					
					<div class="text-center mb-4">
						<v-btn
							variant="text"
							color="primary"
							@click="goToResetPassword"
							class="text-decoration-none"
						>
							パスワードを忘れた方はこちら
						</v-btn>
					</div>
					<div class="text-center">
						<v-btn
							variant="text"
							color="primary"
							@click="goToUserCreate"
							class="text-decoration-none"
						>
							新規登録はこちら
						</v-btn>
					</div>
				</v-card-text>
				
				<v-card-actions class="pa-6 pt-0">
					<v-spacer />
					<v-btn
						color="grey"
						variant="text"
						@click="closeDialog"
					>
						キャンセル
					</v-btn>
					<v-btn
						color="success"
						variant="flat"
						type="submit"
						:loading="isLoading"
					>
						ログイン
					</v-btn>
					<v-spacer />
				</v-card-actions>
			</v-form>
			
			<v-divider />
			
			<v-card-actions class="pa-6">
				<v-spacer />
				<GoogleLogin
					:callback="handleGoogleLogin"
					:client-id="googleClientId"
					:button-config="googleButtonConfig"
					:loading="isGoogleLoading"
					@error="handleGoogleError"
				/>
				<v-spacer />
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { GoogleLogin } from 'vue3-google-login'
import Swal from 'sweetalert2'

const dialog = defineModel('dialog')

const router = useRouter()
const authStore = useAuthStore()
const blogSettingStore = useBlogSettingStore()

const email = ref('')
const password = ref('')
const visibleIcon = ref("mdi-eye-off")
const visibleType = ref('password')
const isGoogleLoading = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const googleClientId = computed(() => {
	return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
})

const googleButtonConfig = {
	type: 'standard',
	theme: 'outline',
	size: 'large',
	text: 'signin_with',
	shape: 'rectangular',
	logo_alignment: 'left',
	width: '300'
}

const emailRules = [
	(v) => !!v || 'メールアドレスは必須です',
	(v) => /.+@.+\..+/.test(v) || '有効なメールアドレスを入力してください'
]

const passwordRules = [
	(v) => !!v || 'パスワードは必須です',
	(v) => (v && v.length >= 6) || 'パスワードは6文字以上で入力してください'
]

const changeVisible = () => {
	visibleIcon.value = visibleIcon.value === "mdi-eye-off" ? "mdi-eye" : "mdi-eye-off"
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password'
}

const closeDialog = () => {
	dialog.value = false

	email.value = ''
	password.value = ''
	errorMessage.value = ''
}

const goToResetPassword = () => {
	closeDialog()
	router.push('/reset_password')
}

const goToUserCreate = () => {
	closeDialog()
	router.push('/user_create')
}

const showLoginSuccessDialog = async () => {
	dialog.value = false

	try {
		// ログイン成功後、ブログ設定を取得
		await blogSettingStore.getDetail()
		
		const result = await Swal.fire({
			title: 'ログイン完了',
			text: 'ログインが完了しました。',
			icon: 'success',
			confirmButtonText: 'OK',
			confirmButtonColor: '#F784C3',
			showCancelButton: false,
			allowOutsideClick: false,
			allowEscapeKey: false
		})
		
		if (result.isConfirmed) {
			closeDialog()
		}
	} catch (error) {
		console.error('ダイアログエラー:', error)
		closeDialog()
	}
}

// ログイン処理
const loginUser = async () => {
	try {
		errorMessage.value = ''
		isLoading.value = true
		
		await authStore.login(email.value, password.value)
		await showLoginSuccessDialog()
	} catch (error) {
		console.error('ログインエラー:', error)
		errorMessage.value = error.message || 'ログインに失敗しました'
	} finally {
		isLoading.value = false
	}
}

// Google認証でログイン
const handleGoogleLogin = async (response) => {
	try {
		errorMessage.value = ''
		isGoogleLoading.value = true
		
		await authStore.loginWithGoogle(response)
		
		// 認証成功後の処理
		if (authStore.isLogin) {
			await showLoginSuccessDialog()
		} else {
			errorMessage.value = 'ログインに失敗しました'
		}
	} catch (error) {
		console.error('Google認証エラー:', error)
		errorMessage.value = error.message || 'Google認証に失敗しました'
	} finally {
		isGoogleLoading.value = false
	}
}

const handleGoogleError = (error) => {
	console.error('Google認証エラー:', error)
	errorMessage.value = 'Google認証でエラーが発生しました'
}
</script>

<style scoped>
.v-card {
	border-radius: 12px;
}

.v-card-title {
	background-color: rgb(var(--v-theme-primary));
	color: white;
}

.v-card-title h4 {
	margin: 0;
	font-weight: 500;
}
</style>
