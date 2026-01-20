<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="つぶやき投稿"
		v-model:dialog="dialog"
	>
		<template v-slot:title>
			<v-card-title class="d-flex align-center">
				<v-icon class="mr-2">mdi-twitter</v-icon>
				<h4 class="text-h5">{{ isEditMode ? 'つぶやき編集' : 'つぶやき投稿' }}</h4>
			</v-card-title>
		</template>
		<template v-slot:contents>
			<v-card-text>
				<v-form ref="form">
					<v-row>
						<v-col cols="12">
							<v-textarea
								v-model="tweet.content"
								label="つぶやき内容"
								:rules="contentRules"
								variant="outlined"
								rows="4"
								placeholder="今の気持ちや出来事をつぶやいてみましょう..."
								:counter="1000"
								maxlength="1000"
								required
							/>
						</v-col>
						<v-col cols="12">
							<v-file-input
								id="images"
								type="file"
								label="サムネイルを選択して下さい"
								accept="image/png, image/jpg, image/jpeg"
								:rules="isEditMode ? [] : thumbnailRules"
								v-model="fileInputValue"
								@change="handleFileUpload"
								:required="!isEditMode"
							/>
						</v-col>
						<v-col cols="12" v-if="tweet.thumbUrl">
							<v-img
								:src="tweet.thumbUrl"
								height="200"
								cover
								class="rounded"
							/>
						</v-col>
						<v-col cols="12">
							<v-switch
								v-model="tweet.isPublished"
								label="公開する"
								color="success"
								hide-details
							></v-switch>
						</v-col>
						<v-col cols="12" v-if="tweet.isPublished">
							<v-alert
								type="info"
								variant="tonal"
								class="mb-4"
							>
								<v-icon class="mr-2">mdi-information</v-icon>
								このつぶやきは公開され、他のユーザーにも表示されます。
							</v-alert>
						</v-col>
						<v-col cols="12" v-else>
							<v-alert
								type="warning"
								variant="tonal"
								class="mb-4"
							>
								<v-icon class="mr-2">mdi-content-save</v-icon>
								下書きとして保存されます。後で編集・公開できます。
							</v-alert>
						</v-col>
					</v-row>
				</v-form>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="grey-lighten-4"
					variant="elevated"
					@click="closeDialog"
				>
					閉じる
				</v-btn>
				<v-btn
					color="success"
					:loading="loading"
					variant="elevated"
					@click="saveTweet"
				>
					{{ isEditMode ? '更新' : (tweet.isPublished ? '投稿' : '下書き保存') }}
				</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>
</template>

<script setup lang="ts">
import DialogTemplate from '@/components/DialogTemplate.vue'
import { useTweetStore } from '@/stores/tweetStore'
import { useImagesStore } from '@/stores/imagesStore'

const dialog = defineModel<boolean>('dialog')

const tweetStore = useTweetStore()
const imagesStore = useImagesStore()

// 型定義
interface TweetData {
	id?: string
	content: string
	thumbUrl: string
	isPublished: boolean
	viewCount?: number
}

// Props定義
interface Props {
	tweet?: any
}

const props = defineProps<Props>()
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

// Emits定義
const emit = defineEmits<{
	saved: []
}>()

const form = ref<any>(null)
const loading = ref<boolean>(false)
const fileInputValue = ref<File[]>([])
const selectedFiles = ref<File[]>([])

// 編集モードかどうかを判定
const isEditMode = computed(() => {
	return props.tweet && props.tweet.id
})

const tweet = reactive<TweetData>({
	content: '',
	thumbUrl: '',
	isPublished: false,
	viewCount: 0
})

const contentRules = [
	(v: string): boolean | string => !!v || 'つぶやき内容は必須です',
	(v: string): boolean | string => (v && v.length <= 1000) || 'つぶやきは1000文字以内で入力してください'
]

const thumbnailRules = [
	(v: File[]): boolean | string => (v && v.length > 0) || 'サムネイル画像は必須です'
]

const initRefs = (): void => {
	tweet.content = ''
	tweet.thumbUrl = ''
	tweet.isPublished = false
	tweet.viewCount = 0
	selectedFiles.value = []
	fileInputValue.value = []
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
}

// ファイル選択時の処理
const handleFileUpload = async (event: Event) => {
	const target = event.target as HTMLInputElement
	const files = target.files
	if (!files || files.length === 0) return
	
	selectedFiles.value = Array.from(files)
	
	// ファイル選択後、自動的にアップロードを実行
	await submitImages()
}

// 画像をサーバーにアップロードする処理
const submitImages = async () => {
	if (selectedFiles.value.length === 0) return
	
	try {
		loading.value = true
		
		// imagesStoreを使用してFirebase Storageにアップロード
		const result = await imagesStore.create(selectedFiles.value[0], null)
		
		// アップロード成功時にサムネイルURLを設定
		if (result && result.url) {
			tweet.thumbUrl = result.url
		}
		
		// ファイル選択をクリア
		selectedFiles.value = []
		fileInputValue.value = []
		
	} catch (error: any) {
		console.error('画像アップロードエラー:', error)
		alert('画像のアップロードに失敗しました: ' + error.message)
	} finally {
		loading.value = false
	}
}

const saveTweet = async (): Promise<void> => {
	if (!form.value.validate()) {
		return
	}
	
	loading.value = true
	
	try {
		if (isEditMode.value) {
			// 編集モードの場合
			await tweetStore.update(tweet as any)
			alert('つぶやきを更新しました')
		} else {
			// 新規作成モードの場合
			await tweetStore.create(tweet)
			const message = tweet.isPublished ? 'つぶやきを投稿しました' : 'つぶやきを下書き保存しました'
			alert(message)
		}
		
		// 新規作成モードの場合のみフォームをリセット
		if (!isEditMode.value) {
			initRefs()
		}
		closeDialog()

		// 親コンポーネントに保存完了を通知
		emit('saved')
	} catch (error: any) {
		console.error('つぶやき保存エラー:', error)
		const errorMessage = isEditMode.value ? 'つぶやきの更新に失敗しました' : 'つぶやきの投稿に失敗しました'
		alert(errorMessage + ': ' + error.message)
	} finally {
		loading.value = false
	}
}

// props.tweetが変更されたときにtweetを初期化
watch(() => props.tweet, (newTweet) => {
	if (newTweet && isEditMode.value) {
		// 編集モードの場合、既存のデータを設定
		tweet.id = newTweet.id
		tweet.content = newTweet.content || ''
		tweet.thumbUrl = newTweet.thumbUrl || ''
		tweet.isPublished = newTweet.isPublished || false
		tweet.viewCount = newTweet.viewCount || 0
	}
}, { immediate: true })
</script>
