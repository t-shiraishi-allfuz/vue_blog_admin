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
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useAuthStore } from '@/stores/authStore'
import { AppSwal } from '@/utils/swal'

const dialog = defineModel<boolean>('dialog')

const emit = defineEmits<{
	openLogin: []
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const password = ref<string>('')
const confirmPassword = ref<string>('')
const visibleIcon = ref<string>("mdi-eye-off")
const visibleType = ref<string>('password')
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)
const oobCode = ref<string>((route.query.oobCode as string) || '')

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
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
}

// パスワードリセット
const resetPassword = async (): Promise<void> => {
	closeDialog()

	if (password.value !== confirmPassword.value) {
		await AppSwal.fire({
			title: 'エラー',
			text: 'パスワードが一致しません',
			icon: 'error'
		})
		return
	}

	if (!oobCode.value) {
		await AppSwal.fire({
			title: 'エラー',
			text: 'パスワード再設定コードがありません',
			icon: 'error'
		})
		return
	}

	try {
		await authStore.resetPasswordConfirm(oobCode.value, password.value)
		await AppSwal.fire({
			title: '成功',
			text: 'パスワードがリセットされました',
			icon: 'success',
			timer: 1500
		})

		await authStore.initializeAuth()
		initRefs()
		emit('openLogin')
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'パスワードのリセットに失敗しました'
		AppSwal.fire({
			title: 'エラー',
			text: errorMessage,
			icon: 'error'
		})
		console.error('パスワードリセットエラー:', error)
	}
}

// oobCodeが更新されたときにダイアログを開く
watch(() => route.query.oobCode, (newOobCode) => {
	if (newOobCode) {
		oobCode.value = newOobCode as string
		dialog.value = true
		// URLからoobCodeパラメータを削除
		router.replace({ query: {} })
	}
}, { immediate: true })
</script>
