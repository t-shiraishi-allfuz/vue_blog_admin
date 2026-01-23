<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="お知らせ編集"
		v-model:dialog="dialog"
	>
		<template v-slot:title>
			<v-card-title class="d-flex justify-content-center pa-4">
				<v-icon class="mr-2">mdi-bullhorn</v-icon>
				<h4 class="text-h5">お知らせ編集</h4>
			</v-card-title>
		</template>
		<template v-slot:contents>
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
					:disabled="loading"
					variant="elevated"
					@click="closeDialog"
				>
					キャンセル
				</v-btn>
				<v-btn
					color="success"
					:loading="loading"
					:disabled="!valid"
					variant="elevated"
					@click="updateAnnouncement"
				>
					更新
				</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { AppSwal } from '@/utils/swal'

interface AnnouncementData {
	id: string
	title: string
	content: string
	isPublished: boolean
	createdAt: string | null
	updatedAt: string | null
}

const dialog = defineModel<boolean>('dialog')

const emit = defineEmits<{
	update: []
	updated: []
}>()

const announcementStore = useAnnouncementStore()

const props = defineProps({
	announcementData: {
		type: Object,
		default: () => ({})
	}
})

const form = ref<any>(null)
const valid = ref(false)
const loading = ref(false)
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

const announcement = reactive<AnnouncementData & { priority: string }>({
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

const formatDate = (date: any): string => {
	if (!date) return ''
	const d = date.toDate ? date.toDate() : new Date(date)
	return d.toLocaleString('ja-JP')
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
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
		closeDialog()

		await AppSwal.fire({
			title: '確認',
			text: 'お知らせを更新しました',
			icon: 'success'
		})
		
		// 親コンポーネントに更新完了を通知
		emit('updated')
	} catch (error) {
		AppSwal.fire({
			title: 'エラー',
			text: 'お知らせの更新に失敗しました',
			icon: 'error'
		})
	} finally {
		loading.value = false
	}
}

// ダイアログが開かれた時にデータを設定
onMounted(() => {
	Object.assign(announcement, props.announcementData)
})

// データが変更された時にフォームに反映
watch(() => props.announcementData, (newData) => {
	if (newData && Object.keys(newData).length > 0) {
		Object.assign(announcement, newData)
	}
}, { deep: true })
</script>