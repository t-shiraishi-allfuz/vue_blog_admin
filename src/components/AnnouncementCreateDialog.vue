<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="お知らせ作成"
		v-model:dialog="dialog"
	>
		<template v-slot:title>
			<v-card-title class="d-flex justify-content-center pa-4">
				<v-icon class="mr-2">mdi-bullhorn</v-icon>
				<h4 class="text-h5">お知らせ作成</h4>
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
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2'

// 型定義
interface AnnouncementData {
	title: string
	content: string
	isPublished: boolean
}

const dialog = defineModel<boolean>('dialog')

const emit = defineEmits<{
	saved: []
}>()

const announcementStore = useAnnouncementStore()
const authStore = useAuthStore()

const form = ref<any>(null)
const valid = ref<boolean>(false)
const loading = ref<boolean>(false)
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

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

const initRefs = (): void => {
	announcement.title = ''
	announcement.content = ''
	announcement.priority = 'normal'
	announcement.isPublished = false
	form.value?.resetValidation()
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

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
		// フォームをリセット
		closeDialog()

		await Swal.fire({
			title: '確認',
			text: 'お知らせを作成しました',
			icon: 'success',
			confirmButtonText: '閉じる',
			confirmButtonColor: '#E0E0E0'
		})

		// 親コンポーネントに保存完了を通知
		emit('saved')
	} catch (error: any) {
		await Swal.fire({
			title: 'エラー',
			text: 'お知らせの作成に失敗しました',
			icon: 'error',
			confirmButtonColor: '#E0E0E0'
		})
		return
	} finally {
		loading.value = false
	}
}

// ダイアログが開かれた時にフォームをリセット
onMounted(() => {
	initRefs()
})
</script>
