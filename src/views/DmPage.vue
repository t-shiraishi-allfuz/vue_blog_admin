<template>
	<v-container>
		<v-row>
			<v-col cols="12" md="4">
				<!-- 会話一覧 -->
				<v-card class="mb-4">
					<v-card-title class="d-flex align-center">
						<v-icon class="mr-2">mdi-message-text</v-icon>
						メッセージ
						<v-spacer />
						<v-btn
							icon="mdi-refresh"
							variant="text"
							@click="refreshConversations"
							:loading="loading"
						/>
					</v-card-title>
					
					<v-divider />
					
					<v-card-text class="pa-0" style="height: 500px; overflow-y: auto;">
						<div v-if="loading && conversations.length === 0" class="d-flex justify-center align-center pa-8">
							<v-progress-circular indeterminate color="primary" />
						</div>
						
						<div v-else-if="conversations.length === 0" class="text-center pa-8">
							<v-icon size="64" color="grey-lighten-1">mdi-message-text-outline</v-icon>
							<p class="text-grey mt-4">メッセージがありません</p>
						</div>
						
						<v-list v-else>
							<v-list-item
								v-for="conversation in conversations"
								:key="conversation.conversation.id"
								@click="selectConversation(conversation.conversation.id)"
								:class="{ 'bg-grey-lighten-4': selectedConversationId === conversation.conversation.id }"
								class="cursor-pointer"
							>
								<template #prepend>
									<v-avatar
										:image="conversation.otherUser.profileUrl"
										size="50"
										class="mr-3"
									/>
								</template>
								
								<v-list-item-title class="font-weight-medium">
									{{ conversation.otherUser.title }}
								</v-list-item-title>
								
								<v-list-item-subtitle v-if="conversation.conversation.lastMessage" class="text-caption">
									{{ conversation.conversation.lastMessage.content.substring(0, 30) }}
									{{ conversation.conversation.lastMessage.content.length > 30 ? '...' : '' }}
								</v-list-item-subtitle>
								
								<template #append>
									<div class="text-right">
										<div class="text-caption text-grey">
											{{ formatDate(conversation.conversation.lastMessageAt) }}
										</div>
										<v-chip
											v-if="conversation.conversation.unreadCount > 0"
											color="primary"
											size="small"
											variant="flat"
											class="mt-1"
										>
											{{ conversation.conversation.unreadCount }}
										</v-chip>
									</div>
								</template>
							</v-list-item>
						</v-list>
					</v-card-text>
				</v-card>
			</v-col>
			
			<v-col cols="12" md="8">
				<!-- メッセージ表示エリア -->
				<v-card v-if="selectedConversationId" style="height: 500px; display: flex; flex-direction: column;">
					<v-card-title class="d-flex align-center">
						<v-avatar
							:image="currentOtherUser?.profileUrl"
							size="40"
							class="mr-3"
						/>
						{{ currentOtherUser?.title }}
					</v-card-title>
					
					<v-divider />
					
					<!-- メッセージ一覧 -->
					<v-card-text class="flex-grow-1 pa-4" style="overflow-y: auto;">
						<div v-if="messages.length === 0" class="text-center pa-8">
							<v-icon size="48" color="grey-lighten-1">mdi-message-outline</v-icon>
							<p class="text-grey mt-4">メッセージがありません</p>
						</div>
						
						<div v-else>
							<div
								v-for="message in messages"
								:key="message.id"
								class="mb-3"
								:class="message.senderId === authStore.userInfo?.uid ? 'text-right' : 'text-left'"
							>
								<div
									class="d-inline-block pa-3 rounded-lg max-width-70"
									:class="message.senderId === authStore.userInfo?.uid ? 'bg-primary text-white' : 'bg-grey-lighten-3'"
								>
									<div class="text-body-2">{{ message.content }}</div>
									<div class="text-caption mt-1 opacity-70">
										{{ formatDateTime(message.createdAt) }}
									</div>
								</div>
							</div>
						</div>
					</v-card-text>
					
					<v-divider />
					
					<!-- メッセージ送信フォーム -->
					<v-card-text class="pa-4">
						<v-form @submit.prevent="sendNewMessage">
							<v-row>
								<v-col cols="10">
									<v-textarea
										v-model="newMessage"
										placeholder="メッセージを入力..."
										rows="2"
										auto-grow
										variant="outlined"
										density="compact"
										:disabled="sendingMessage"
									/>
								</v-col>
								<v-col cols="2" class="d-flex align-end">
									<v-btn
										type="submit"
										color="primary"
										:loading="sendingMessage"
										:disabled="!newMessage.trim() || sendingMessage"
										block
									>
										<v-icon>mdi-send</v-icon>
									</v-btn>
								</v-col>
							</v-row>
						</v-form>
					</v-card-text>
				</v-card>
				
				<!-- 会話が選択されていない場合 -->
				<v-card v-else style="height: 500px;" class="d-flex align-center justify-center">
					<div class="text-center">
						<v-icon size="64" color="grey-lighten-1">mdi-message-text-outline</v-icon>
						<p class="text-grey mt-4">会話を選択してください</p>
					</div>
				</v-card>
			</v-col>
		</v-row>
	</v-container>
</template>

<script setup lang="ts">
import { useDmStore } from '@/stores/dmStore'
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2'

// 型定義
interface OtherUser {
	uid: string
	title: string
	profileUrl: string
}

// ストア
const dmStore = useDmStore()
const authStore = useAuthStore()

// 状態管理
const selectedConversationId = ref<string | null>(null)
const newMessage = ref<string>('')
const sendingMessage = ref<boolean>(false)

// 計算プロパティ
const conversations = computed(() => dmStore.conversations)
const messages = computed(() => dmStore.messages)
const loading = computed(() => dmStore.loading)

const currentOtherUser = computed((): OtherUser | null => {
	if (!selectedConversationId.value) return null
	
	const conversation = conversations.value.find(
		c => c.conversation.id === selectedConversationId.value
	)
	
	return conversation?.otherUser || null
})

// 会話一覧を更新
const refreshConversations = async (): Promise<void> => {
	try {
		await dmStore.getConversations()
	} catch (error) {
		console.error('会話一覧の更新に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: '会話一覧の更新に失敗しました',
			icon: 'error'
		})
	}
}

// 会話を選択
const selectConversation = async (conversationId: string): Promise<void> => {
	try {
		selectedConversationId.value = conversationId
		await dmStore.getMessages(conversationId)
	} catch (error) {
		console.error('メッセージの取得に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'メッセージの取得に失敗しました',
			icon: 'error'
		})
	}
}

// メッセージを送信
const sendNewMessage = async (): Promise<void> => {
	if (!newMessage.value.trim() || !currentOtherUser.value) return
	
	try {
		sendingMessage.value = true
		
		await dmStore.sendMessage(currentOtherUser.value.uid, newMessage.value)
		newMessage.value = ''
		
		// メッセージ一覧を更新
		await dmStore.getMessages(selectedConversationId.value!)
		
		// 会話一覧を更新
		await dmStore.getConversations()
		
	} catch (error) {
		console.error('メッセージの送信に失敗しました:', error)
		Swal.fire({
			title: 'エラー',
			text: 'メッセージの送信に失敗しました',
			icon: 'error'
		})
	} finally {
		sendingMessage.value = false
	}
}

// 日付フォーマット
const formatDate = (date: Date): string => {
	const now = new Date()
	const messageDate = new Date(date)
	const diffTime = now.getTime() - messageDate.getTime()
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
	
	if (diffDays === 0) {
		return messageDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
	} else if (diffDays === 1) {
		return '昨日'
	} else if (diffDays < 7) {
		return `${diffDays}日前`
	} else {
		return messageDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
	}
}

// 日時フォーマット
const formatDateTime = (date: Date): string => {
	return new Date(date).toLocaleString('ja-JP', {
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
}

// コンポーネントマウント時に会話一覧を取得
onMounted(async (): Promise<void> => {
	await refreshConversations()
})
</script>

<style scoped>
.cursor-pointer {
	cursor: pointer;
}

.cursor-pointer:hover {
	background-color: rgba(0, 0, 0, 0.04);
}

.max-width-70 {
	max-width: 70%;
}
</style>
