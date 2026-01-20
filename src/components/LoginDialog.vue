<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="ログイン"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>
			<v-form ref="loginForm" @submit.prevent="loginUser">
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
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { GoogleLogin } from 'vue3-google-login'
import Swal from 'sweetalert2'

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
	openUserCreate: [],
	openResetPassword: []
}>()

const authStore = useAuthStore()
const blogSettingStore = useBlogSettingStore()

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
	text: 'signin_with',
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
}

const goToResetPassword = (): void => {
	closeDialog()
	initRefs()
	emit('openResetPassword')
}

const goToUserCreate = (): void => {
	closeDialog()
	initRefs()
	emit('openUserCreate')
}

const showLoginSuccessDialog = async (): Promise<void> => {
	closeDialog()

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
			initRefs()
		}
	} catch (error: any) {
		console.error('ダイアログエラー:', error)
		initRefs()
	}
}

// ログイン処理
const loginUser = async (): Promise<void> => {
	try {
		errorMessage.value = ''
		isLoading.value = true
		
		await authStore.login(email.value, password.value)
		await showLoginSuccessDialog()
	} catch (error: any) {
		console.error('ログインエラー:', error)
		errorMessage.value = error.message || 'ログインに失敗しました'
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
			await showLoginSuccessDialog()
		} else {
			errorMessage.value = 'ログインに失敗しました'
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
