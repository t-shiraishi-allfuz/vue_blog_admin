<template>
	<v-dialog v-model="isOpen" max-width="800" persistent>
		<v-card>
			<v-card-title class="text-h5 d-flex align-center">
				<v-icon class="mr-2">mdi-bullhorn</v-icon>
				お知らせ編集
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
						
						<v-col cols="12">
							<v-alert
								type="info"
								variant="tonal"
								class="mb-4"
							>
								<v-icon class="mr-2">mdi-information</v-icon>
								作成日時: {{ formatDate(announcement.createdAt) }}
								<span v-if="announcement.updatedAt">
									<br>最終更新: {{ formatDate(announcement.updatedAt) }}
								</span>
							</v-alert>
						</v-col>
					</v-row>
				</v-form>
			</v-card-text>
			
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="grey-lighten-4"
					variant="text"
					@click="cancel"
					:disabled="loading"
				>
					キャンセル
				</v-btn>
				<v-btn
					color="primary"
					variant="elevated"
					@click="updateAnnouncement"
					:loading="loading"
					:disabled="!valid"
				>
					更新
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useAnnouncementStore } from '@/stores/announcementStore'

const announcementStore = useAnnouncementStore()

const props = defineProps({
	modelValue: {
		type: Boolean,
		default: false
	},
	announcementData: {
		type: Object,
		default: () => ({})
	}
})

const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref<any>(null)
const valid = ref(false)
const loading = ref(false)

const announcement = reactive({
	id: '',
	title: '',
	content: '',
	priority: 'normal',
	isPublished: false,
	createdAt: null,
	updatedAt: null
})

const priorityOptions = [
	{ title: '低', value: 'low' },
	{ title: '通常', value: 'normal' },
	{ title: '高', value: 'high' },
	{ title: '緊急', value: 'urgent' }
]

const titleRules = [
	(v: string) => !!v || 'タイトルは必須です',
	(v: string) => (v && v.length <= 100) || 'タイトルは100文字以内で入力してください'
]

const contentRules = [
	(v: string) => !!v || '内容は必須です',
	(v: string) => (v && v.length <= 2000) || '内容は2000文字以内で入力してください'
]

const isOpen = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

const formatDate = (date: any): string => {
	if (!date) return ''
	const d = date.toDate ? date.toDate() : new Date(date)
	return d.toLocaleString('ja-JP')
}

const updateAnnouncement = async () => {
	if (!form.value?.validate()) return
	
	loading.value = true
	
	try {
		await announcementStore.update(announcement.id, {
			title: announcement.title,
			content: announcement.content,
			priority: announcement.priority,
			isPublished: announcement.isPublished
		})
		
		// 成功メッセージを表示
		alert('お知らせを更新しました')
		
		// ダイアログを閉じる
		emit('update:modelValue', false)
		
		// 親コンポーネントに更新完了を通知
		emit('updated')
		
	} catch (error) {
		console.error('お知らせ更新エラー:', error)
		alert('お知らせの更新に失敗しました: ' + (error instanceof Error ? error.message : String(error)))
	} finally {
		loading.value = false
	}
}

const cancel = () => {
	emit('update:modelValue', false)
}

// ダイアログが開かれた時にデータを設定
watch(() => props.modelValue, (newValue) => {
	if (newValue && props.announcementData) {
		Object.assign(announcement, props.announcementData)
	}
})

// データが変更された時にフォームに反映
watch(() => props.announcementData, (newData) => {
	if (newData && Object.keys(newData).length > 0) {
		Object.assign(announcement, newData)
	}
}, { deep: true })
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
