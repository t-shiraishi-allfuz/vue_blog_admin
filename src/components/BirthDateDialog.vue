<template>
	<v-dialog v-model="dialog" persistent max-width="500px">
		<v-card>
			<v-card-title class="text-h5">
				生年月日を登録して下さい
			</v-card-title>
			
			<v-card-text>
				<p class="mb-4">
					18歳未満のユーザーは、閲覧制限のあるブログは表示されません。
				</p>
				
				<v-form ref="form" v-model="valid">
					<v-text-field
						v-model="birthDate"
						label="生年月日"
						type="date"
						:rules="birthDateRules"
						required
						:max="maxDate"
						:min="minDate"
					></v-text-field>
				</v-form>
			</v-card-text>
			
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="success"
					:disabled="!valid"
					:loading="loading"
					variant="elevated"
					@click="saveBirthDate"
				>
					登録
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useUsersStore } from '@/stores/usersStore'
import { useAuthStore } from '@/stores/authStore'

// Props定義
interface Props {
	modelValue: boolean
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: false
})

// Emits定義
interface Emits {
	'update:modelValue': [value: boolean]
	saved: []
}

const emit = defineEmits<Emits>()

const usersStore = useUsersStore()
const authStore = useAuthStore()

const dialog = computed({
	get: (): boolean => props.modelValue,
	set: (value: boolean): void => emit('update:modelValue', value)
})

const birthDate = ref<string>('')
const valid = ref<boolean>(false)
const loading = ref<boolean>(false)

// 日付の制限（1900年〜現在）
const maxDate = computed((): string => {
	const today = new Date()
	return today.toISOString().split('T')[0]
})

const minDate = computed((): string => {
	return '1900-01-01'
})

const birthDateRules = [
	(v: string): boolean | string => !!v || '生年月日は必須です',
	(v: string): boolean | string => {
		if (!v) return true
		const selectedDate = new Date(v)
		const today = new Date()
		return selectedDate <= today || '未来の日付は選択できません'
	}
]

const saveBirthDate = async (): Promise<void> => {
	if (!valid.value) return
	
	loading.value = true
	try {
		const userInfo = authStore.userInfo as any
		await usersStore.updateBirthDate(userInfo.uid, birthDate.value)
		emit('saved')
		dialog.value = false
	} catch (error: any) {
		console.error('生年月日登録エラー:', error)
		// エラーハンドリングは必要に応じて追加
	} finally {
		loading.value = false
	}
}
</script>
