<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="ユーザー登録"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>
			<v-form ref="createForm" @submit.prevent="createUser">
				<v-card-text class="pa-6">
					<v-text-field
						v-model="email"
						prepend-inner-icon="mdi-email-outline"
						label="メールアドレスを入力して下さい"
						type="email"
						:rules="emailRules"
						class="mb-4"
					/>
					<v-text-field
						v-model="password"
						prepend-inner-icon="mdi-lock-outline"
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
							@click="goToLogin"
							class="text-decoration-none"
						>
							登録済みの方はこちら
						</v-btn>
					</div>
				</v-card-text>
				
				<v-card-actions class="pa-6 pt-0">
					<v-spacer />
					<v-btn
						color="grey-lighten-4"
						variant="elevated"
						@click="closeDialog"
					>
						キャンセル
					</v-btn>
					<v-btn
						color="success"
						variant="elevated"
						type="submit"
						:loading="isLoading"
					>
						登録する
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
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useAuthStore } from '@/stores/authStore'
import { GoogleLogin } from 'vue3-google-login'
import { AppSwal } from '@/utils/swal'

// 型定義
interface GoogleResponse {
	credential: string
	[key: string]: any
}

interface GoogleButtonConfig {
	type: string
	theme: string
	size: string
	text: string
	shape: string
	logo_alignment: string
	width: string
}

const dialog = defineModel<boolean>('dialog')

const emit = defineEmits<{
	openLogin: []
}>()

const router = useRouter()
const authStore = useAuthStore()

const email = ref<string>('')
const password = ref<string>('')
const visibleIcon = ref<string>("mdi-eye-off")
const visibleType = ref<string>('password')
const isGoogleLoading = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const errorMessage = ref<string>('')
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

const googleClientId = computed((): string => {
	return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
})

const googleButtonConfig: GoogleButtonConfig = {
	type: 'standard',
	theme: 'outline',
	size: 'large',
	text: 'signup_with',
	shape: 'rectangular',
	logo_alignment: 'left',
	width: '300'
}

const emailRules = [
	(v: string): boolean | string => !!v || 'メールアドレスは必須です',
	(v: string): boolean | string => /.+@.+\..+/.test(v) || '有効なメールアドレスを入力してください'
]

const passwordRules = [
	(v: string): boolean | string => !!v || 'パスワードは必須です',
	(v: string): boolean | string => (v && v.length >= 6) || 'パスワードは6文字以上で入力してください'
]

const changeVisible = (): void => {
	visibleIcon.value = visibleIcon.value === "mdi-eye-off" ? "mdi-eye" : "mdi-eye-off"
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password'
}

const initRefs = (): void => {
	email.value = ''
	password.value = ''
	errorMessage.value = ''
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

const goToLogin = (): void => {
	closeDialog()
	emit('openLogin')
}

// 新規ユーザー登録成功ダイアログ
const showRegistrationSuccessDialog = async (): Promise<void> => {
	closeDialog()

	try {
		await AppSwal.fire({
			title: '登録完了',
			text: 'ユーザー登録が完了しました。初期設定画面に移動します。',
			icon: 'success',
		})
		router.push('/setting_first')
	} catch (error) {
		console.error('ダイアログエラー:', error)
		await AppSwal.fire({
			title: 'エラー',
			text: 'ユーザー登録に失敗しました。初期設定画面に移動します。',
			icon: 'error',
		})
		// ダイアログでエラーが発生した場合も設定画面にリダイレクト
		router.push('/setting_first')
	}
}

// 既存ユーザー用ダイアログ
const showExistingUserDialog = async (): Promise<void> => {
	closeDialog()

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

// ユーザー登録処理
const createUser = async (): Promise<void> => {
	try {
		errorMessage.value = ''
		isLoading.value = true
		
		await authStore.create(email.value, password.value)
		await showRegistrationSuccessDialog()
	} catch (error: any) {
		console.error('ユーザー登録エラー:', error)
		errorMessage.value = error.message || 'ユーザー登録に失敗しました'
	} finally {
		isLoading.value = false
	}
}

// Google認証でログイン
const handleGoogleLogin = async (response: GoogleResponse): Promise<void> => {
	try {
		errorMessage.value = ''
		isGoogleLoading.value = true
		
		await authStore.loginWithGoogle(response)
		
		// 認証成功後の処理
		if (authStore.isLogin) {
			// 新規ユーザーか既存ユーザーかを判定してリダイレクト
			if (authStore.isNewUser) {
				// 新規ユーザー
				await showRegistrationSuccessDialog()
			} else {
				// 既存ユーザー - ダイアログを表示してからリダイレクト
				await showExistingUserDialog()
			}
		} else {
			errorMessage.value = '認証に失敗しました'
		}
	} catch (error: any) {
		console.error('Google認証エラー:', error)
		errorMessage.value = error.message || 'Google認証に失敗しました'
	} finally {
		isGoogleLoading.value = false
	}
}

const handleGoogleError = (error: any): void => {
	console.error('Google認証エラー:', error)
	errorMessage.value = 'Google認証でエラーが発生しました'
}
</script>