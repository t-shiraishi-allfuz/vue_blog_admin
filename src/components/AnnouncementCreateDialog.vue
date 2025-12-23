<template>
	<v-dialog v-model="isOpen" max-width="800" persistent>
		<v-card>
			<v-card-title class="text-h5 d-flex align-center">
				お知らせ作成
			</v-card-title>
			
			<v-card-text>
				<v-form ref="form" v-model="valid">
					<v-row>
						<v-col cols="12">
							<v-text-field
								v-model="announcement.title"
								label="タイトル"
								:rules="titleRules"
								required
								variant="outlined"
								placeholder="お知らせのタイトルを入力してください"
							></v-text-field>
						</v-col>
						
						<v-col cols="12">
							<v-textarea
								v-model="announcement.content"
								label="内容"
								:rules="contentRules"
								required
								variant="outlined"
								rows="8"
								placeholder="お知らせの内容を入力してください"
							></v-textarea>
						</v-col>
						
						<v-col cols="12" md="6">
							<v-select
								v-model="announcement.priority"
								:items="priorityOptions"
								label="優先度"
								variant="outlined"
								required
							></v-select>
						</v-col>
						
						<v-col cols="12" md="6">
							<v-switch
								v-model="announcement.isPublished"
								label="公開する"
								color="primary"
								hide-details
							></v-switch>
						</v-col>
						
						<v-col cols="12" v-if="announcement.isPublished">
							<v-alert
								type="info"
								variant="tonal"
								class="mb-4"
							>
								<v-icon class="mr-2">mdi-information</v-icon>
								このお知らせは公開され、一般ユーザーにも表示されます。
							</v-alert>
						</v-col>
					</v-row>
				</v-form>
			</v-card-text>
			
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="grey-lighten-4"
					:disabled="loading"
					variant="elevated"
					@click="cancel"
				>
					閉じる
				</v-btn>
				<v-btn
					color="success"
					:loading="loading"
					:disabled="!valid"
					variant="elevated"
					@click="saveAnnouncement"
				>
					保存
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'

// 型定義
interface AnnouncementData {
	title: string
	content: string
	isPublished: boolean
}

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

const announcementStore = useAnnouncementStore()
const authStore = useAuthStore()

const form = ref<any>(null)
const valid = ref<boolean>(false)
const loading = ref<boolean>(false)

const announcement = reactive<AnnouncementData & { priority: string }>({
	title: '',
	content: '',
	priority: 'normal',
	isPublished: false
})

const priorityOptions = [
	{ title: '低', value: 'low' },
	{ title: '通常', value: 'normal' },
	{ title: '高', value: 'high' },
	{ title: '緊急', value: 'urgent' }
]

const titleRules = [
	(v: string): boolean | string => !!v || 'タイトルは必須です',
	(v: string): boolean | string => (v && v.length <= 100) || 'タイトルは100文字以内で入力してください'
]

const contentRules = [
	(v: string): boolean | string => !!v || '内容は必須です',
	(v: string): boolean | string => (v && v.length <= 2000) || '内容は2000文字以内で入力してください'
]

const isOpen = computed({
	get: (): boolean => props.modelValue,
	set: (value: boolean): void => emit('update:modelValue', value)
})

const saveAnnouncement = async (): Promise<void> => {
	if (!form.value.validate()) return
	
	loading.value = true
	
	try {
		const userInfo = authStore.userInfo as any
		await announcementStore.create({
			...announcement,
			authorId: userInfo.uid,
			authorEmail: userInfo.email
		})
		
		// 成功メッセージを表示
		alert('お知らせを作成しました')
		
		// フォームをリセット
		resetForm()
		
		// ダイアログを閉じる
		emit('update:modelValue', false)
		
		// 親コンポーネントに保存完了を通知
		emit('saved')
		
	} catch (error: any) {
		console.error('お知らせ作成エラー:', error)
		alert('お知らせの作成に失敗しました: ' + error.message)
	} finally {
		loading.value = false
	}
}

const cancel = (): void => {
	resetForm()
	emit('update:modelValue', false)
}

const resetForm = (): void => {
	announcement.title = ''
	announcement.content = ''
	announcement.priority = 'normal'
	announcement.isPublished = false
	form.value?.resetValidation()
}

// ダイアログが開かれた時にフォームをリセット
watch(() => props.modelValue, (newValue: boolean): void => {
	if (newValue) {
		resetForm()
	}
})
</script>

<style scoped>
.v-card {
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.v-card-title {
	background-color: #f5f5f5;
	border-bottom: 1px solid #e0e0e0;
}
</style>
