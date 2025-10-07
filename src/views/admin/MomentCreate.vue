<template>
	<v-container>
		<v-card>
			<v-card-title class="d-flex align-center">
				<div>
					<div class="text-h5">モーメント作成</div>
					<div class="text-caption text-grey">複数のつぶやきをまとめてストーリーを作成します</div>
				</div>
			</v-card-title>
			<v-form ref="form" v-model="valid" @submit.prevent="saveMoment">
				<v-card-text>
					<v-row>
						<v-col cols="12" mb="4">
							<v-card variant="outlined">
								<v-card-title class="text-subtitle-1">
									<v-icon class="mr-2">mdi-information</v-icon>
									作成のヒント
								</v-card-title>
								<v-card-text>
									<ul class="text-body-2">
										<li>関連するつぶやきを選択してください</li>
										<li>タイトルは分かりやすく簡潔に</li>
										<li>説明でモーメントの概要を伝えましょう</li>
										<li>公開前にプレビューで確認できます</li>
									</ul>
								</v-card-text>
							</v-card>
						</v-col>
						<v-col cols="12" mb="4">
							<v-card mb-4>
								<v-card-title class="text-subtitle-1">
									<v-icon class="mr-2">mdi-message-text</v-icon>
									含めるつぶやきを選択
									<v-chip
										v-if="selectedTweetIds.length > 0"
										color="success"
										size="small"
										class="ml-2"
									>
										{{ selectedTweetIds.length }} 件選択中
									</v-chip>
								</v-card-title>
								<v-card-text>
									<v-text-field
										label="つぶやきを検索"
										v-model="searchQuery"
										prepend-inner-icon="mdi-magnify"
										variant="outlined"
										density="compact"
										clearable
										hide-details
									/>
								</v-card-text>
								<v-row v-if="filteredTweets.length > 0">
									<v-col
										v-for="tweet in filteredTweets"
										:key="tweet.id"
										class="pa-4 ma-4"
										cols="12"
										sm
										md
										lg
										xl
									>
										<v-card
											class="tweet-selection-card"
											:class="{ 'selected': selectedTweetIds.includes(tweet.id) }"
											@click="toggleTweetSelection(tweet)"
											elevation="2"
										>
											<div class="checkbox-overlay">
												<v-checkbox
													base-color="white"
													color="success"
													:model-value="selectedTweetIds.includes(tweet.id)"
													@click.stop="toggleTweetSelection(tweet)"
													hide-details
												/>
											</div>
											
											<v-img
												:src="tweet.thumbUrl"
												aspect-ratio="16/9"
												cover
												height="120"
											/>
											
											<v-card-text class="pa-2">
												<div class="text-body-2 text-truncate">
													{{ truncateContent(tweet.content) }}
												</div>
												<div class="text-caption text-grey mt-1">
													{{ formatDate(tweet.createdAt) }}
												</div>
											</v-card-text>
										</v-card>
									</v-col>
								</v-row>
								<v-card v-else class="pa-4 text-center">
									<v-icon size="48" color="grey-lighten-4">mdi-message-text-outline</v-icon>
									<div class="text-h6 mt-2">つぶやきが見つかりません</div>
									<div class="text-body-2 text-grey">検索条件を変更してお試しください</div>
								</v-card>
							</v-card>
						</v-col>
						<v-col cols="12" mb="4">
							<v-text-field
								label="タイトル"
								placeholder="モーメントのタイトルを入力してください"
								class="mb-4"
								:rules="titleRules"
								v-model="momentDetail.title"
								variant="outlined"
								required
							/>
							<v-textarea
								label="説明"
								class="mb-4"
								:rules="descriptionRules"
								v-model="momentDetail.description"
								variant="outlined"
								rows="4"
								placeholder="モーメントの説明を入力してください"
								required
							/>
						</v-col>
						<v-col cols="12" mb="4">
							<v-file-input
								id="images"
								type="file"
								label="サムネイルを選択して下さい"
								accept="image/png, image/jpg, image/jpeg"
								:rules="thumbnailRules"
								v-model="fileInputValue"
								@change="handleFileUpload"
								required
							/>
							<v-img
								class="cover-thumb"
								:src="momentDetail.thumbUrl"
								width="200"
								aspect-ratio="16/9"
								cover
							/>
						</v-col>
						<v-col cols="12" mb="4">
							<v-switch
								v-model="momentDetail.isAdult"
								label="閲覧制限の設定"
								color="warning"
								hint="モーメントに18歳未満の閲覧制限を付ける場合は設定して下さい"
								persistent-hint
								class="mb-4"
							/>
							<v-switch
								v-model="momentDetail.isPublished"
								label="公開する"
								color="success"
								hint="オフにすると下書き保存されます"
								persistent-hint
								class="mb-4"
							/>
						</v-col>
					</v-row>
				</v-card-text>
				<v-card-actions class="pa-4">
					<v-spacer />
					<v-btn
						color="success"
						variant="flat"
						:disabled="!valid || selectedTweetIds.length === 0"
						:loading="loading"
						@click="saveMoment"
					>
						{{ momentDetail.isPublished ? '投稿' : '保存' }}
					</v-btn>
				</v-card-actions>
			</v-form>
		</v-card>
		<v-card-actions>
			<v-btn @click="goBack">一覧に戻る</v-btn>
		</v-card-actions>
	</v-container>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { useMomentStore } from '@/stores/momentStore'
import { useTweetStore } from '@/stores/tweetStore'
import { useImagesStore } from '@/stores/imagesStore'
import { format } from 'date-fns'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()

const authStore = useAuthStore()
const momentStore = useMomentStore()
const tweetStore = useTweetStore()
const imagesStore = useImagesStore()

const { userInfo } = storeToRefs(authStore)
const { tweetList } = storeToRefs(tweetStore)
const { momentDetail } = storeToRefs(momentStore)

const loading = ref(false)
const valid = ref(false)
const searchQuery = ref('')
const fileInputValue = ref<File[]>([])
const selectedFiles = ref<File[]>([])

// 選択されたつぶやきID
const selectedTweetIds = ref<string[]>([])

// バリデーションルール
const titleRules = [
	(v: string) => !!v || 'タイトルは必須です',
	(v: string) => (v && v.length <= 100) || 'タイトルは100文字以内で入力してください'
]

const descriptionRules = [
	(v: string) => !!v || '説明は必須です',
	(v: string) => (v && v.length <= 500) || '説明は500文字以内で入力してください'
]

const thumbnailRules = [
	(v: File[] | null): boolean | string => (v && v.length > 0) || 'サムネイル画像は必須です'
]

// つぶやき一覧の取得
const fetchTweets = async () => {
	if (userInfo.value?.uid) {
		await tweetStore.getListForUser(userInfo.value.uid)
	}
}

// 検索条件に基づくつぶやきフィルタリング
const filteredTweets = computed(() => {
	if (!searchQuery.value) return tweetList.value

	return tweetList.value.filter(tweet =>
		tweet.content.toLowerCase().includes(searchQuery.value.toLowerCase())
	)
})

// つぶやき選択の切り替え
const toggleTweetSelection = (tweet: any) => {
	const index = selectedTweetIds.value.indexOf(tweet.id)
	if (index > -1) {
		selectedTweetIds.value.splice(index, 1)
	} else {
		selectedTweetIds.value.push(tweet.id)
	}
}

// つぶやき選択の削除（未使用のため削除）
// const removeTweetSelection = (tweet: any) => {
// 	const index = selectedTweetIds.value.indexOf(tweet.id)
// 	if (index > -1) {
// 		selectedTweetIds.value.splice(index, 1)
// 	}
// }

// つぶやき内容を切り詰める
const truncateContent = (content: string) => {
	if (!content) return ''
	if (content.length <= 10) return content
	return content.substring(0, 10) + '...'
}

// 日時フォーマット
const formatDate = (date: Date | null) => {
	if (!date) return '日付不明'
	return format(new Date(date), 'yyyy/MM/dd HH:mm')
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
			momentDetail.value.thumbUrl = result.url
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

// モーメント保存
const saveMoment = async () => {
	if (!valid.value || selectedTweetIds.value.length === 0) return

	loading.value = true

	try {
		const momentToSave = {
			...momentDetail.value,
			tweetIds: selectedTweetIds.value
		}

		await momentStore.create(momentToSave as any)

		Swal.fire({
			title: '作成完了',
			text: 'モーメントを作成しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		}).then(() => {
			router.push({path: '/admin/moment_list'})
		})
	} catch (error) {
		console.error('モーメント作成エラー:', error)
		Swal.fire({
			title: 'エラー',
			text: 'モーメントの作成に失敗しました',
			icon: 'error'
		})
	} finally {
		loading.value = false
	}
}

// 戻る
const goBack = () => {
	const from = route.query.from
	if (from === 'admin') {
		router.push({ path: '/admin', query: {tab: 1} })
	} else {
		router.push({ path: '/' })
	}
}

onMounted(async () => {
	await fetchTweets()
})
</script>

<style scoped>
.tweet-selection-card {
	position: relative;
	cursor: pointer;
	transition: all 0.2s ease;
	border: 2px solid transparent;
}

.tweet-selection-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tweet-selection-card.selected {
	border-color: #27C1A3;
	background-color: rgba(39,193,163,1, 0.8);
}

.checkbox-overlay {
	position: absolute;
	top: 5px;
	left: 5px;
	z-index: 10;
}

.checkbox-overlay .v-checkbox {
	margin: 0;
}
.gap-2 {
	gap: 8px;
}
</style>
