<template>
	<DialogTemplate
		ref="dialogTemplateRef"
		label="確認"
		v-model:dialog="dialog"
	>
		<template v-slot:contents>
			<v-card-text>
				<p class="mb-4">
					会話履歴を削除しますか？この操作は取り消せません
				</p>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn
					color="grey-lighten-4"
					:loading="loading"
					variant="elevated"
					@click="closeDialog"
				>
					閉じる
				</v-btn>
				<v-btn
					color="success"
					:loading="loading"
					variant="elevated"
					@click="resetChat"
				>
					リセット
				</v-btn>
			</v-card-actions>
		</template>
	</DialogTemplate>

	<v-card>
		<v-card-title class="d-flex align-center">
			<v-icon class="mr-2">mdi-account-cog</v-icon>
			AI設定
		</v-card-title>
		<v-divider />
		<v-card-text>
			<div class="mb-4">
				<div class="text-subtitle-2 mb-2">AIアイコン</div>
				<div class="d-flex align-center gap-3">
					<v-avatar
						v-if="aiIconUrl"
						size="50"
						class="ma-1"
						:image="aiIconUrl"
					/>
					<v-icon v-if="!aiIconUrl">mdi-robot</v-icon>
					<v-file-input
						id="iconImage"
						label="アイコンを設定"
						accept="image/png,image/jpg,image/jpeg"
						type="file"
						prepend-icon=""
						prepend-inner-icon="mdi-image"
						density="compact"
						variant="outlined"
						hide-details
						@change="handleFileUpload"
					/>
				</div>
			</div>
			<v-text-field
				v-model="characterName"
				label="AIキャラクター名"
				variant="outlined"
				placeholder="例: アシスタント"
				counter="50"
				maxlength="50"
				density="compact"
				class="mb-3"
			/>
			<v-textarea
				v-model="persona"
				label="AIの性格・口調を入力"
				auto-grow
				rows="4"
				variant="outlined"
				placeholder="例: 優しく励ましてくれる先輩の口調で話して"
				counter="1000"
				maxlength="1000"
				class="mb-3"
			/>
			<v-btn
				block
				color="primary"
				:loading="isLoading"
				@click="applyPersona"
			>
				設定を保存
			</v-btn>
			<v-btn
				block
				variant="tonal"
				class="mt-2"
				:disabled="isLoading"
				@click="confirmResetChat"
			>
				履歴をリセット
			</v-btn>
			<v-alert
				v-if="error"
				type="error"
				class="mt-4"
				density="compact"
			>
				{{ error }}
			</v-alert>
			<v-alert
				v-else-if="isLoading"
				type="info"
				variant="tonal"
				class="mt-4"
				density="compact"
			>
				応答を生成中です...
			</v-alert>
		</v-card-text>
		<v-divider />
		<v-card-text>
			<div class="text-subtitle-2 text-grey-darken-1">現在のAI設定</div>
			<div class="mt-2 text-body-2 text-grey-darken-2">{{ systemPrompt }}</div>
		</v-card-text>
	</v-card>

	<v-card class="chat-card">
		<v-card-title class="d-flex align-center flex-wrap gap-2">
			<div class="d-flex align-center">
				<v-icon class="mr-2">mdi-robot-outline</v-icon>
				AIトーク
			</div>
			<v-spacer />
			<div class="d-flex align-center gap-2">
				<v-chip size="small" variant="tonal" color="amber-darken-2">
					所持コイン: {{ (coins || 0).toLocaleString() }}
				</v-chip>
				<v-chip size="small" variant="tonal" color="primary">
					消費: {{ AI_TALK_COST }} コイン/送信
				</v-chip>
				<v-chip size="small" variant="tonal" color="primary">
					{{ displayMessages.length }} メッセージ
				</v-chip>
			</div>
		</v-card-title>

		<v-divider />

		<v-card-text class="chat-window">
			<div v-if="displayMessages.length === 0" class="text-center text-grey">
				<v-icon size="48" color="grey-lighten-1">mdi-chat-question</v-icon>
				<div class="mt-2">AIキャラクターに話しかけてみましょう</div>
			</div>
			<div v-else class="d-flex flex-column gap-3">
				<div
					v-for="(message, index) in displayMessages"
					:key="index"
					class="d-flex align-start gap-2"
					:class="message.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
				>
					<v-avatar
						v-if="(message.role === 'user' && userIconUrl)"
						size="36"
						:image="userIconUrl"
						class="mt-1"
					/>
					<v-avatar
						v-else-if="(message.role !== 'user' && aiIconUrl)"
						size="36"
						:image="aiIconUrl"
						class="mt-1"
					/>
					<v-icon v-if="message.role === 'user' && !userIconUrl">mdi-account</v-icon>
					<v-icon v-else-if="message.role !== 'user' && !aiIconUrl">mdi-robot</v-icon>
					<div
						class="message-bubble"
						:class="message.role === 'user' ? 'message-user' : 'message-assistant'"
					>
						<div class="text-caption text-grey-darken-1 mb-1">
							{{ message.role === 'user' ? userName : aiCharacterName }}
						</div>
						<div class="text-body-2">{{ message.content }}</div>
					</div>
				</div>
			</div>
		</v-card-text>

		<v-divider />

		<v-card-text>
			<v-form @submit.prevent="handleSend">
				<v-row class="align-end">
					<v-col cols="12">
						<v-textarea
							v-model="userInput"
							label="メッセージを入力"
							rows="2"
							auto-grow
							variant="outlined"
							:disabled="isLoading"
							placeholder="AIキャラクターへのメッセージを入力してください"
						/>
					</v-col>
					<v-col cols="12" class="d-flex justify-end">
						<v-btn
							type="submit"
							color="primary"
							:loading="isLoading"
							:disabled="!userInput.trim() || isLoading || !hasEnoughCoins"
						>
							<v-icon class="mr-2">mdi-send</v-icon>
							送信
						</v-btn>
					</v-col>
				</v-row>
			</v-form>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { useChat } from '@/api/openai'
import { useAiSettingStore } from '@/stores/aiSettingStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useCoinStore } from '@/stores/coinStore'
import Swal from 'sweetalert2'

// 消費コスト
const AI_TALK_COST = 20

const {
	messages,
	isLoading,
	error,
	systemPrompt,
	sendMessage,
	resetConversation,
	setSystemMessage,
	initialize
} = useChat()

const aiSettingStore = useAiSettingStore()
const blogSettingStore = useBlogSettingStore()
const coinStore = useCoinStore()
const { blogSetting } = storeToRefs(blogSettingStore)
const { coins } = storeToRefs(coinStore)

const persona = ref(systemPrompt.value)
const characterName = ref<string>(aiSettingStore.getCharacterName() || '')
const userInput = ref('')
const dialog = ref<boolean>(false)
const loading = ref<boolean>(false)
const iconImage = ref<File | null>(null)
const iconPreview = ref<string | null>(null)
const dialogTemplateRef = ref<InstanceType<typeof DialogTemplate> | null>(null)

// AIアイコンURL
const aiIconUrl = computed(() => iconPreview.value || aiSettingStore.getIconUrl())
// ユーザーアイコンURL
const userIconUrl = computed(() => blogSetting.value?.profileUrl || null)
// AIキャラクター名
const aiCharacterName = computed(() => aiSettingStore.getCharacterName() || 'AI')
// ユーザー名
const userName = computed(() => blogSetting.value?.name || 'あなた')
// コイン所持チェック
const hasEnoughCoins = computed(() => coinStore.hasEnoughCoins(AI_TALK_COST))

const displayMessages = computed(() =>
	messages.value.filter((message) => message.role !== 'system')
)

// systemPromptが変更されたらpersonaも更新
watch(systemPrompt, (newValue) => {
	persona.value = newValue
}, { immediate: true })

const initRefs = (): void => {
	dialog.value = false
	userInput.value = ''
	iconImage.value = null
	iconPreview.value = null
	persona.value = systemPrompt.value
	loading.value = false
}

const closeDialog = (): void => {
	if (dialogTemplateRef.value) {
		dialogTemplateRef.value.closeDialog()
	}
	initRefs()
}

const applyPersona = async () => {
	try {
		const imageArray = iconImage.value ? [iconImage.value] : []
		await setSystemMessage(imageArray, persona.value, characterName.value)
		initRefs()

		await Swal.fire({
			title: '確認',
			text: '設定を保存しました',
			icon: 'success',
			confirmButtonColor: '#27C1A3',
			confirmButtonText: 'OK'
		})
	} catch (error: any) {
		console.error('設定の適用エラー:', error)
		await Swal.fire({
			title: 'エラー',
			text: error.message || '設定の適用に失敗しました',
			icon: 'error',
			confirmButtonColor: '#d33',
			confirmButtonText: 'OK'
		})
	}
}

const confirmResetChat = () => {
	dialog.value = true
}

const resetChat = async () => {
	loading.value = true

	await resetConversation()
	initRefs()
	
	await Swal.fire({
		title: 'リセット完了',
		text: '会話履歴をリセットしました',
		icon: 'success',
		confirmButtonColor: '#27C1A3',
		confirmButtonText: 'OK'
	})
}

const handleSend = async () => {
	if (!userInput.value.trim()) return
	if (!hasEnoughCoins.value) {
		await Swal.fire({
			title: 'コインが不足しています',
			text: `AIトークには${AI_TALK_COST}コイン必要です。トークを続ける場合は、チャージをしてください。`,
			icon: 'warning',
			confirmButtonColor: '#27C1A3',
			confirmButtonText: 'OK'
		})
		return
	}
	await sendMessage(userInput.value)
	initRefs()
}

// ファイルアップロードの処理（プレビュー用）
const handleFileUpload = (event: Event): void => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (file) {
		iconImage.value = file

		// 画像のプレビュー
		const reader = new FileReader()
		reader.onload = (e: ProgressEvent<FileReader>) => {
			const target = e.target as FileReader
			if (target?.result) {
				iconPreview.value = target.result as string
			}
		}
		reader.readAsDataURL(file)
	}
}

// コンポーネントマウント時にFirebaseから設定を読み込む
onMounted(async () => {
	await initialize()
	await blogSettingStore.getDetail()
	await coinStore.getCoins()
	// キャラクター名を読み込む
	characterName.value = aiSettingStore.getCharacterName() || ''
})
</script>

<style scoped>
.chat-card {
	min-height: 520px;
	display: flex;
	flex-direction: column;
}

.chat-window {
	min-height: 420px;
	max-height: 520px;
	overflow-y: auto;
	background: #fafafa;
}

.message-bubble {
	padding: 12px 14px;
	border-radius: 12px;
	max-width: calc(80% - 48px);
	flex: 1;
}

.message-user {
	background-color: #fff;
	border: 1px solid #e0e0e0;
}

.message-assistant {
	background-color: #27C1A3;
	color: #fff;
}

.gap-3 {
	row-gap: 12px;
}

.gap-2 {
	gap: 8px;
}
</style>

