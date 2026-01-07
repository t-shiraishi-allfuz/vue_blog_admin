<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="パスワード再設定"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>
			<v-form ref="settingForm" @submit.prevent="resetPassword">
				<v-card-text class="pa-6">
					<v-text-field
						v-model="password"
						prepend-inner-icon="mdi-lock-outline"
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						label="新しいパスワードを入力して下さい"
						:rules="passwordRules"
						@click:append-inner="changeVisible"
						class="mb-4"
					/>
					<v-text-field
						v-model="confirmPassword"
						prepend-inner-icon="mdi-lock-outline"
						:append-inner-icon="visibleIcon"
						:type="visibleType"
						label="もう一度新しいパスワードを入力して下さい"
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
						@click="resetPassword"
					>
						登録する
					</v-btn>
					<v-spacer />
				</v-card-actions>
			</v-form>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2'

const dialog = defineModel<boolean>('dialog')

const emit = defineEmits<{
	openLogin: []
}>()

const router = useRouter()
const authStore = useAuthStore()

const password = ref<string>('')
const confirmPassword = ref<string>('')
const visibleIcon = ref<string>("mdi-eye-off")
const visibleType = ref<string>('password')
const errorMessage = ref<string>('')
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

const passwordRules = [
	(v: string): boolean | string => !!v || 'パスワードは必須です',
	(v: string): boolean | string => (v && v.length >= 6) || 'パスワードは6文字以上で入力してください'
]

const changeVisible = (): void => {
	visibleIcon.value = visibleIcon.value === "mdi-eye-off" ? "mdi-eye" : "mdi-eye-off"
	visibleType.value = visibleType.value === 'password' ? 'text' : 'password'
}

const initRefs = (): void => {
	password.value = ''
	confirmPassword.value = ''
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
		errorMessage.value = error.message || 'パスワードのリセットに失敗しました'
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
