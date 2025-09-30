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
					color="grey"
					:disabled="loading"
					variant="text"
					@click="cancel"
				>
					キャンセル
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

<script setup>
import { ref, reactive, watch } from 'vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'

const announcementStore = useAnnouncementStore()
const authStore = useAuthStore()

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['update:modelValue', 'saved'])

const form = ref(null)
const valid = ref(false)
const loading = ref(false)

const announcement = reactive({
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
	v => !!v || 'タイトルは必須です',
	v => (v && v.length <= 100) || 'タイトルは100文字以内で入力してください'
]

const contentRules = [
	v => !!v || '内容は必須です',
	v => (v && v.length <= 2000) || '内容は2000文字以内で入力してください'
]

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

const saveAnnouncement = async () => {
	if (!form.value.validate()) return
	
	loading.value = true
	
	try {
		await announcementStore.create({
			...announcement,
			authorId: authStore.userInfo.uid,
			authorEmail: authStore.userInfo.email
		})
		
		// 成功メッセージを表示
		alert('お知らせを作成しました')
		
		// フォームをリセット
		resetForm()
		
		// ダイアログを閉じる
		emit('update:modelValue', false)
		
		// 親コンポーネントに保存完了を通知
		emit('saved')
		
	} catch (error) {
		console.error('お知らせ作成エラー:', error)
		alert('お知らせの作成に失敗しました: ' + error.message)
	} finally {
		loading.value = false
	}
}

const cancel = () => {
	resetForm()
	emit('update:modelValue', false)
}

const resetForm = () => {
	announcement.title = ''
	announcement.content = ''
	announcement.priority = 'normal'
	announcement.isPublished = false
	form.value?.resetValidation()
}

// ダイアログが開かれた時にフォームをリセット
watch(() => props.modelValue, (newValue) => {
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
