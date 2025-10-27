<template>
	<v-dialog v-model="dialog" max-width="500" persistent>
		<v-card>
			<v-card-title class="d-flex align-center">
				<v-icon class="mr-2">mdi-message-text</v-icon>
				メッセージを送信
				<v-spacer />
				<v-btn icon="mdi-close" variant="text" @click="closeDialog" />
			</v-card-title>
			
			<v-divider />
			
			<v-card-text class="pa-6">
				<div class="text-center mb-4">
					<v-avatar
						:image="userProfile?.profileUrl"
						size="80"
						class="mb-3"
					/>
					<h3 class="text-h6">{{ userProfile?.title || 'ユーザー' }}</h3>
					<p class="text-caption text-grey">
						{{ userProfile?.description || 'プロフィール情報がありません' }}
					</p>
				</div>
				
				<v-form @submit.prevent="sendMessage">
					<v-textarea
						v-model="messageContent"
						placeholder="メッセージを入力してください..."
						rows="4"
						variant="outlined"
						:rules="messageRules"
						:disabled="sending"
						class="mb-4"
					/>
					
					<div class="d-flex justify-end">
						<v-btn
							variant="text"
							@click="closeDialog"
							:disabled="sending"
							class="mr-2"
						>
							キャンセル
						</v-btn>
						<v-btn
							type="submit"
							color="primary"
							:loading="sending"
							:disabled="!messageContent.trim() || sending"
						>
							<v-icon class="mr-1">mdi-send</v-icon>
							送信
						</v-btn>
					</div>
				</v-form>
			</v-card-text>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { useDmStore } from '@/stores/dmStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import Swal from 'sweetalert2'

// 型定義
interface UserProfile {
	uid: string
	title: string
	description: string
	profileUrl: string
}

interface Props {
	modelValue: boolean
	targetUserId: string
}

interface Emits {
	(e: 'update:modelValue', value: boolean): void
	(e: 'messageSent'): void
}

// Props & Emits
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ストア
const dmStore = useDmStore()
const blogSettingStore = useBlogSettingStore()

// 状態管理
const dialog = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

const userProfile = ref<UserProfile | null>(null)
const messageContent = ref<string>('')
const sending = ref<boolean>(false)

// バリデーションルール
const messageRules = [
	(v: string) => !!v || 'メッセージを入力してください',
	(v: string) => v.length <= 1000 || 'メッセージは1000文字以内で入力してください'
]

// ダイアログを閉じる
const closeDialog = (): void => {
	if (!sending.value) {
		dialog.value = false
		messageContent.value = ''
		userProfile.value = null
	}
}

// ユーザー情報を取得
const fetchUserProfile = async (): Promise<void> => {
	try {
		const profile = await blogSettingStore.getForUid(props.targetUserId)
		if (profile) {
			userProfile.value = {
				uid: props.targetUserId,
				title: profile.title || 'ユーザー',
				description: profile.description || '',
				profileUrl: profile.profileUrl || ''
			}
		}
	} catch (error) {
		console.error('ユーザー情報の取得に失敗しました:', error)
	}
}

// メッセージを送信
const sendMessage = async (): Promise<void> => {
	if (!messageContent.value.trim()) return
	
	try {
		sending.value = true
		
		// 会話を開始（既に存在する場合は既存の会話を使用）
		await dmStore.startConversation(props.targetUserId)
		
		// メッセージを送信
		await dmStore.sendMessage(props.targetUserId, messageContent.value)
		
		Swal.fire({
			title: '送信完了',
			text: 'メッセージを送信しました',
			icon: 'success',
			timer: 1500,
			showConfirmButton: false
		})
		
		emit('messageSent')
		closeDialog()
		
	} catch (error: any) {
		console.error('メッセージの送信に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: error.message || 'メッセージの送信に失敗しました',
			icon: 'error'
		})
	} finally {
		sending.value = false
	}
}

// ダイアログが開かれた時にユーザー情報を取得
watch(() => props.modelValue, (newValue) => {
	if (newValue && props.targetUserId) {
		fetchUserProfile()
	}
})

// ターゲットユーザーIDが変更された時もユーザー情報を再取得
watch(() => props.targetUserId, () => {
	if (props.modelValue && props.targetUserId) {
		fetchUserProfile()
	}
})
</script>

<style scoped>
.v-textarea {
	font-size: 14px;
}
</style>
