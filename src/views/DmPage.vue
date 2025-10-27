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
								<!-- 返信メッセージの表示 -->
								<div v-if="message.replyTo" class="mb-2">
									<div class="reply-preview pa-2 rounded" :class="message.senderId === authStore.userInfo?.uid ? 'bg-primary-lighten-4' : 'bg-grey-lighten-5'">
										<div class="text-caption text-grey mb-1">
											<v-icon size="12" class="mr-1">mdi-reply</v-icon>
											返信先:
										</div>
										<div class="text-body-2 text-truncate">
											{{ getReplyPreview(message.replyTo) }}
										</div>
									</div>
								</div>
								
								<div
									class="d-inline-block pa-3 rounded-lg max-width-70 message-container"
									:class="message.senderId === authStore.userInfo?.uid ? 'bg-primary text-white' : 'bg-grey-lighten-4'"
								>
									<!-- テキストメッセージ -->
									<div v-if="message.content" class="text-body-2">{{ message.content }}</div>
									
									<!-- 画像メッセージ -->
									<div v-if="message.imageUrl" class="mt-2">
										<img
											:src="message.imageUrl"
											alt="送信された画像"
											style="max-width: 200px; max-height: 200px; border-radius: 8px;"
											@click="openImagePreview(message.imageUrl)"
											class="cursor-pointer"
										/>
									</div>
									
									<!-- GIFメッセージ -->
									<div v-if="message.gifUrl" class="mt-2">
										<img
											:src="message.gifUrl"
											alt="送信されたGIF"
											style="max-width: 200px; max-height: 200px; border-radius: 8px;"
											@click="openImagePreview(message.gifUrl)"
											class="cursor-pointer"
										/>
									</div>
									
									<!-- 絵文字メッセージ -->
									<div v-if="message.emoji" class="mt-2">
										<span class="text-h4">{{ message.emoji }}</span>
									</div>
									
									<div class="d-flex align-center justify-space-between mt-2">
										<div class="text-caption opacity-70">
											{{ formatDateTime(message.createdAt) }}
										</div>
										<!-- 返信ボタン（自分以外のメッセージのみ） -->
										<v-btn
											v-if="message.senderId !== authStore.userInfo?.uid"
											icon="mdi-reply"
											size="x-small"
											variant="text"
											@click="startReply(message)"
											class="ml-2"
										>
											<v-icon size="14">mdi-reply</v-icon>
										</v-btn>
									</div>
								</div>
							</div>
						</div>
					</v-card-text>
					
					<v-divider />
					
					<!-- メッセージ送信フォーム -->
					<v-card-text class="pa-4">
						<!-- 返信状態の表示 -->
						<div v-if="replyingTo" class="mb-3">
							<v-card variant="outlined" class="pa-3">
								<div class="d-flex align-center justify-space-between">
									<div class="d-flex align-center">
										<v-icon size="16" class="mr-2">mdi-reply</v-icon>
										<span class="text-caption text-grey">返信先:</span>
									</div>
									<v-btn
										icon="mdi-close"
										size="small"
										variant="text"
										@click="cancelReply"
									/>
								</div>
								<div class="mt-2 text-body-2 text-truncate">
									{{ getReplyPreview(replyingTo) }}
								</div>
							</v-card>
						</div>
						
						<!-- プレビューエリア -->
						<div v-if="messagePreview" class="mb-3">
							<v-card variant="outlined" class="pa-3">
								<div class="d-flex align-center justify-space-between">
									<span class="text-caption text-grey">プレビュー</span>
									<v-btn
										icon="mdi-close"
										size="small"
										variant="text"
										@click="clearPreview"
									/>
								</div>
								<div class="mt-2">
									<!-- 画像プレビュー -->
									<img
										v-if="messagePreview.type === 'image'"
										:src="messagePreview.url"
										alt="画像プレビュー"
										style="max-width: 200px; max-height: 200px; border-radius: 8px;"
									/>
									<!-- GIFプレビュー -->
									<img
										v-else-if="messagePreview.type === 'gif'"
										:src="messagePreview.url"
										alt="GIFプレビュー"
										style="max-width: 200px; max-height: 200px; border-radius: 8px;"
									/>
									<!-- 絵文字プレビュー -->
									<div v-else-if="messagePreview.type === 'emoji'" class="text-h4">
										{{ messagePreview.content }}
									</div>
								</div>
							</v-card>
						</div>

						<v-form @submit.prevent="sendNewMessage">
							<v-row>
								<v-col cols="8">
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
								<v-col cols="4" class="d-flex align-end gap-2">
									<!-- 画像アップロードボタン -->
									<v-btn
										icon="mdi-image"
										variant="outlined"
										size="small"
										@click="triggerImageUpload"
										:disabled="sendingMessage"
									>
										<v-icon>mdi-image</v-icon>
									</v-btn>
									
									<!-- GIF検索ボタン -->
									<v-btn
										icon="mdi-file-gif-box"
										variant="outlined"
										size="small"
										@click="openGifDialog"
										:disabled="sendingMessage"
									>
										<v-icon>mdi-file-gif-box</v-icon>
									</v-btn>
									
									<!-- 絵文字ピッカーボタン -->
									<v-btn
										icon="mdi-emoticon-happy"
										variant="outlined"
										size="small"
										@click="openEmojiDialog"
										:disabled="sendingMessage"
									>
										<v-icon>mdi-emoticon-happy</v-icon>
									</v-btn>
									
									<!-- 送信ボタン -->
									<v-btn
										type="submit"
										color="success"
										:loading="sendingMessage"
										:disabled="(!newMessage.trim() && !messagePreview) || sendingMessage"
										size="small"
										variant="flat"
									>
										<v-icon>mdi-send</v-icon>
									</v-btn>
								</v-col>
							</v-row>
						</v-form>
						
						<!-- 隠しファイル入力 -->
						<input
							ref="imageInput"
							type="file"
							accept="image/*"
							style="display: none"
							@change="handleImageUpload"
						/>
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
		
		<!-- GIF検索ダイアログ -->
		<v-dialog v-model="gifDialog" max-width="600">
			<v-card>
				<v-card-title class="d-flex align-center">
					<v-icon class="mr-2">mdi-gif</v-icon>
					GIF検索
					<v-spacer />
					<v-btn icon="mdi-close" variant="text" @click="gifDialog = false" />
				</v-card-title>
				<v-divider />
				<v-card-text>
					<v-text-field
						v-model="gifSearchQuery"
						label="GIFを検索..."
						prepend-inner-icon="mdi-magnify"
						@keyup.enter="searchGifs"
						class="mb-4"
					/>
					<div v-if="gifLoading" class="d-flex justify-center pa-4">
						<v-progress-circular indeterminate color="primary" />
					</div>
					<div v-else-if="gifResults.length > 0" class="gif-grid">
						<div
							v-for="gif in gifResults"
							:key="gif.id"
							class="gif-item cursor-pointer"
							@click="selectGif(gif)"
						>
							<img :src="gif.images.fixed_width.url" :alt="gif.title" />
						</div>
					</div>
					<div v-else-if="gifSearchQuery" class="text-center pa-4">
						<p class="text-grey">GIFが見つかりませんでした</p>
					</div>
				</v-card-text>
			</v-card>
		</v-dialog>
		
		<!-- 絵文字ピッカーダイアログ -->
		<v-dialog v-model="emojiDialog" max-width="400">
			<v-card>
				<v-card-title class="d-flex align-center">
					<v-icon class="mr-2">mdi-emoticon-happy</v-icon>
					絵文字を選択
					<v-spacer />
					<v-btn icon="mdi-close" variant="text" @click="emojiDialog = false" />
				</v-card-title>
				<v-divider />
				<v-card-text>
					<div class="emoji-grid">
						<div
							v-for="emoji in emojiList"
							:key="emoji"
							class="emoji-item cursor-pointer"
							@click="selectEmoji(emoji)"
						>
							{{ emoji }}
						</div>
					</div>
				</v-card-text>
			</v-card>
		</v-dialog>
		
		<!-- 画像プレビューダイアログ -->
		<v-dialog v-model="imagePreviewDialog" max-width="800">
			<v-card>
				<v-card-title class="d-flex align-center">
					<v-icon class="mr-2">mdi-image</v-icon>
					画像プレビュー
					<v-spacer />
					<v-btn icon="mdi-close" variant="text" @click="imagePreviewDialog = false" />
				</v-card-title>
				<v-divider />
				<v-card-text class="text-center">
					<img
						:src="previewImageUrl"
						alt="プレビュー画像"
						style="max-width: 100%; max-height: 500px; border-radius: 8px;"
					/>
				</v-card-text>
			</v-card>
		</v-dialog>
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

// リッチコンテンツ関連
const messagePreview = ref<any>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const gifDialog = ref<boolean>(false)
const gifSearchQuery = ref<string>('')
const gifResults = ref<any[]>([])
const gifLoading = ref<boolean>(false)
const emojiDialog = ref<boolean>(false)
const imagePreviewDialog = ref<boolean>(false)
const previewImageUrl = ref<string>('')

// 返信機能関連
const replyingTo = ref<any>(null)

// 絵文字リスト
const emojiList = ref<string[]>([
	'😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
	'😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
	'😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
	'🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
	'😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
	'🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
	'❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
	'❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
	'✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
	'⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'
])

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
		// メッセージを既読にマーク
		await dmStore.markMessagesAsRead(conversationId)
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
	if ((!newMessage.value.trim() && !messagePreview.value) || !currentOtherUser.value) return
	
	try {
		sendingMessage.value = true
		
		// リッチコンテンツの送信
		if (messagePreview.value) {
			await sendRichMessage()
		} else {
			// 通常のテキストメッセージ
			if (replyingTo.value) {
				// 返信メッセージとして送信
				const messageData = {
					content: newMessage.value,
					replyTo: {
						id: replyingTo.value.id,
						content: replyingTo.value.content || '',
						imageUrl: replyingTo.value.imageUrl || '',
						gifUrl: replyingTo.value.gifUrl || '',
						emoji: replyingTo.value.emoji || '',
						senderId: replyingTo.value.senderId
					}
				}
				await dmStore.sendRichMessage(currentOtherUser.value.uid, messageData)
			} else {
				// 通常のテキストメッセージ
				await dmStore.sendMessage(currentOtherUser.value.uid, newMessage.value)
			}
		}
		
		// フォームをクリア
		newMessage.value = ''
		messagePreview.value = null
		replyingTo.value = null
		
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

// リッチメッセージを送信
const sendRichMessage = async (): Promise<void> => {
	if (!currentOtherUser.value || !messagePreview.value) return
	
	const userInfo = authStore.userInfo
	if (!userInfo?.uid) return
	
	// リッチコンテンツのデータを準備
	const messageData: any = {
		senderId: userInfo.uid,
		receiverId: currentOtherUser.value.uid,
		content: newMessage.value.trim() || '',
		createdAt: new Date(),
		isRead: false
	}
	
	// プレビューのタイプに応じてデータを設定
	if (messagePreview.value.type === 'image') {
		messageData.imageUrl = messagePreview.value.url
	} else if (messagePreview.value.type === 'gif') {
		messageData.gifUrl = messagePreview.value.url
	} else if (messagePreview.value.type === 'emoji') {
		messageData.emoji = messagePreview.value.content
	}
	
	// 返信先メッセージの情報を追加
	if (replyingTo.value) {
		messageData.replyTo = {
			id: replyingTo.value.id,
			content: replyingTo.value.content || '',
			imageUrl: replyingTo.value.imageUrl || '',
			gifUrl: replyingTo.value.gifUrl || '',
			emoji: replyingTo.value.emoji || '',
			senderId: replyingTo.value.senderId
		}
	}
	
	// DMストアのsendMessageメソッドを拡張してリッチコンテンツに対応
	await dmStore.sendRichMessage(currentOtherUser.value.uid, messageData)
}

// 画像アップロードをトリガー
const triggerImageUpload = (): void => {
	imageInput.value?.click()
}

// 画像アップロードを処理
const handleImageUpload = (event: Event): void => {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	
	if (file && file.type.startsWith('image/')) {
		const reader = new FileReader()
		reader.onload = (e) => {
			messagePreview.value = {
				type: 'image',
				url: e.target?.result as string
			}
		}
		reader.readAsDataURL(file)
	}
	
	// ファイル入力をリセット
	target.value = ''
}

// GIF検索ダイアログを開く
const openGifDialog = (): void => {
	gifDialog.value = true
	gifSearchQuery.value = ''
	gifResults.value = []
}

// GIF検索
const searchGifs = async (): Promise<void> => {
	if (!gifSearchQuery.value.trim()) return
	
	try {
		gifLoading.value = true
		
		// GIPHY APIを使用してGIFを検索（無料APIキーを使用）
		const response = await fetch(
			`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearchQuery.value)}&limit=20`
		)
		
		if (response.ok) {
			const data = await response.json()
			gifResults.value = data.data || []
		} else {
			console.error('GIF検索に失敗しました')
			gifResults.value = []
		}
	} catch (error) {
		console.error('GIF検索エラー:', error)
		gifResults.value = []
	} finally {
		gifLoading.value = false
	}
}

// GIF選択
const selectGif = (gif: any): void => {
	messagePreview.value = {
		type: 'gif',
		url: gif.images.fixed_width.url
	}
	gifDialog.value = false
}

// 絵文字ピッカーダイアログを開く
const openEmojiDialog = (): void => {
	emojiDialog.value = true
}

// 絵文字選択
const selectEmoji = (emoji: string): void => {
	messagePreview.value = {
		type: 'emoji',
		content: emoji
	}
	emojiDialog.value = false
}

// プレビューをクリア
const clearPreview = (): void => {
	messagePreview.value = null
}

// 画像プレビューを開く
const openImagePreview = (imageUrl: string): void => {
	previewImageUrl.value = imageUrl
	imagePreviewDialog.value = true
}

// 返信機能
const startReply = (message: any): void => {
	replyingTo.value = message
	// メッセージ入力欄にフォーカス
	setTimeout(() => {
		const textarea = document.querySelector('textarea')
		if (textarea) {
			textarea.focus()
		}
	}, 100)
}

const cancelReply = (): void => {
	replyingTo.value = null
}

const getReplyPreview = (message: any): string => {
	if (!message) return ''
	
	if (message.content) {
		return message.content.length > 50 ? message.content.substring(0, 50) + '...' : message.content
	} else if (message.imageUrl) {
		return '画像'
	} else if (message.gifUrl) {
		return 'GIF'
	} else if (message.emoji) {
		return `絵文字: ${message.emoji}`
	}
	
	return 'メッセージ'
}

// Firestore TimestampをDateに変換
const convertTimestamp = (timestamp: any): Date => {
	if (!timestamp) return new Date()
	
	// Firestore Timestampの場合
	if (timestamp.toDate && typeof timestamp.toDate === 'function') {
		return timestamp.toDate()
	}
	
	// 既にDateオブジェクトの場合
	if (timestamp instanceof Date) {
		return timestamp
	}
	
	// 文字列や数値の場合
	return new Date(timestamp)
}

// 日付フォーマット
const formatDate = (date: any): string => {
	const now = new Date()
	const messageDate = convertTimestamp(date)
	
	// Invalid Dateチェック
	if (isNaN(messageDate.getTime())) {
		return '--:--'
	}
	
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
const formatDateTime = (date: any): string => {
	const messageDate = convertTimestamp(date)
	
	// Invalid Dateチェック
	if (isNaN(messageDate.getTime())) {
		return '--/-- --:--'
	}
	
	return messageDate.toLocaleString('ja-JP', {
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

.gif-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap: 8px;
	max-height: 400px;
	overflow-y: auto;
}

.gif-item {
	border-radius: 8px;
	overflow: hidden;
	transition: transform 0.2s;
}

.gif-item:hover {
	transform: scale(1.05);
}

.gif-item img {
	width: 100%;
	height: 120px;
	object-fit: cover;
}

.emoji-grid {
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	gap: 8px;
	max-height: 300px;
	overflow-y: auto;
}

.emoji-item {
	font-size: 24px;
	text-align: center;
	padding: 8px;
	border-radius: 8px;
	transition: background-color 0.2s;
}

.emoji-item:hover {
	background-color: rgba(0, 0, 0, 0.1);
}

.gap-2 {
	gap: 8px;
}

.reply-preview {
	border-left: 3px solid #1976d2;
	max-width: 100%;
}

.message-container {
	position: relative;
}

.text-truncate {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
