<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="パスワードリセット"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>
			<v-form ref="settingForm" @submit.prevent="resetPassword">
				<v-card-text class="pa-6">
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
					<v-text-field
						v-model="email"
						prepend-inner-icon="mdi-email-outline"
						label="登録済みのメールアドレスを入力して下さい"
						type="email"
						:rules="emailRules"
						class="mb-4"
					/>
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
						リセット
					</v-btn>
					<v-spacer />
				</v-card-actions>
			</v-form>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useAuthStore } from '@/stores/authStore'
import { useUsersStore } from '@/stores/usersStore'
import Swal from 'sweetalert2'

const dialog = defineModel<boolean>('dialog')

const authStore = useAuthStore()
const usersStore = useUsersStore()

const email = ref<string>('')
const errorMessage = ref<string>('')
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)
const isLoading = ref<boolean>(false)

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
}

// パスワードリセット
const resetPassword = async (): Promise<void> => {
	if (!email.value) {
		errorMessage.value = 'メールアドレスが入力されていません'
		await Swal.fire({
			title: 'エラー',
			text: errorMessage.value,
			icon: 'error'
		})
		return
	}

	try {
		isLoading.value = true

		// Firestore側にユーザーが存在するか事前チェック（未登録の場合は送信しない）
		const user = await usersStore.getUserByEmail(email.value)
		if (!user) {
			errorMessage.value = 'このメールアドレスは登録されていません'
			await Swal.fire({
				title: 'エラー',
				text: errorMessage.value,
				icon: 'error'
			})
			return
		}

		await authStore.resetPassword(email.value)
		await Swal.fire({
			title: '成功',
			text: 'パスワードリセットメールが送信されました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
		initRefs()
	} catch (error: any) {
		console.error('パスワードリセットエラー:', error)
		const msg = error?.message || 'パスワードリセットメールの送信に失敗しました'
		errorMessage.value = msg
		await Swal.fire({
			title: 'エラー',
			text: msg,
			icon: 'error'
		})
	} finally {
		isLoading.value = false
	}
}
</script>
