<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="パスワードリセット"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>
			<v-form ref="settingForm" @submit.prevent="resetPassword">
				<v-card-text class="pa-6">
					<v-text-field
						v-model="email"
						prepend-inner-icon="mdi-email-outline"
						label="登録済みのメールアドレスを入力して下さい"
						type="email"
						:rules="emailRules"
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
						リセット
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

const email = ref<string>('')
const errorMessage = ref<string>('')
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

const emailRules = [
	(v: string): boolean | string => !!v || 'メールアドレスは必須です',
	(v: string): boolean | string => /.+@.+\..+/.test(v) || '有効なメールアドレスを入力してください'
]

const initRefs = (): void => {
	email.value = ''
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
		errorMessage.value = error.message || 'パスワードリセットメールの送信に失敗しました'
	}
}
</script>
