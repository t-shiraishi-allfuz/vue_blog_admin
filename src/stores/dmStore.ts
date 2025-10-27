import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { db } from '@/setting/firebase'
import { writeBatch, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useNotificationStore } from '@/stores/notificationStore'

// 型定義
interface MessageData {
	id: string
	senderId: string
	receiverId: string
	content: string
	createdAt: Date
	isRead: boolean
}

interface ConversationData {
	id: string
	participants: string[]
	lastMessage?: MessageData
	lastMessageAt: Date
	unreadCount: number
}

interface ConversationWithUser {
	conversation: ConversationData
	otherUser: {
		uid: string
		title: string
		profileUrl: string
	}
}

// DM管理ストア
export const useDmStore = defineStore('dm', () => {
	const conversations = ref<ConversationWithUser[]>([])
	const currentConversation = ref<ConversationData | null>(null)
	const messages = ref<MessageData[]>([])
	const loading = ref<boolean>(false)

	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()
	const notificationStore = useNotificationStore()

	// 会話IDを生成（2つのユーザーIDをソートして結合）
	const generateConversationId = (userId1: string, userId2: string): string => {
		const sortedIds = [userId1, userId2].sort()
		return `${sortedIds[0]}_${sortedIds[1]}`
	}

	// 新しいDMを送信
	const sendMessage = async (receiverId: string, content: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		if (userInfo.uid === receiverId) {
			throw new Error('自分自身にメッセージを送ることはできません')
		}

		try {
			const conversationId = generateConversationId(userInfo.uid, receiverId)
			const batch = writeBatch(db)

			// メッセージドキュメントを作成（サブコレクションに追加）
			const messageData = {
				senderId: userInfo.uid,
				receiverId,
				content: content.trim(),
				createdAt: serverTimestamp(),
				isRead: false
			}
			
			// BaseAPIの新しいメソッドを使用
			await BaseAPI.addDataToSubCollection(
				{ path: ['conversations', conversationId, 'messages'] },
				messageData
			)

			// 会話ドキュメントを更新
			const conversationRef = BaseAPI.getDoc(`conversations/${conversationId}`)
			batch.set(conversationRef, {
				participants: [userInfo.uid, receiverId],
				lastMessage: messageData,
				lastMessageAt: serverTimestamp(),
				unreadCount: 0 // 送信者は未読数0
			}, { merge: true })

			// 受信者の未読数を更新
			const receiverConversationRef = BaseAPI.getDoc(`users/${receiverId}/conversations/${conversationId}`)
			batch.set(receiverConversationRef, {
				unreadCount: 1,
				lastMessageAt: serverTimestamp()
			}, { merge: true })

			await batch.commit()

			// DM通知を作成
			const userSetting = await blogSettingStore.getForUid(userInfo.uid)
			await notificationStore.createNotification('dm', {
				userId: receiverId,
				userName: userSetting?.title || 'ユーザー',
				actorUserId: userInfo.uid,
				content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
			})

		} catch (error: any) {
			throw new Error(`メッセージの送信に失敗しました: ${error.message}`)
		}
	}

	// 会話一覧を取得
	const getConversations = async (): Promise<void> => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		try {
			loading.value = true
			
			// ユーザーの会話一覧を取得
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: `users/${userInfo.uid}/conversations`,
				searchConditions: {
					sorters: [['lastMessageAt', 'desc']],
					limit: 50
				}
			})

			if (!querySnapshot) {
				conversations.value = []
				return
			}

			// 各会話の詳細情報を取得
			const conversationPromises = querySnapshot.docs.map(async (doc) => {
				const conversationId = doc.id
				
				// 会話の詳細情報を取得
				const conversationDoc = await BaseAPI.getData({
					db_name: 'conversations',
					item_id: conversationId
				})

				if (!conversationDoc || !conversationDoc.exists()) {
					return null
				}

				const conversation = conversationDoc.data() as ConversationData
				conversation.id = conversationId

				// 相手のユーザー情報を取得
				const otherUserId = conversation.participants.find(id => id !== userInfo.uid)
				if (!otherUserId) return null

				const otherUserSetting = await blogSettingStore.getForUid(otherUserId)
				if (!otherUserSetting) return null

				return {
					conversation,
					otherUser: {
						uid: otherUserId,
						title: otherUserSetting.title || 'ユーザー',
						profileUrl: otherUserSetting.profileUrl || ''
					}
				} as ConversationWithUser
			})

			const conversationResults = await Promise.all(conversationPromises)
			conversations.value = conversationResults.filter((result): result is ConversationWithUser => result !== null)

		} catch (error: any) {
			console.error('会話一覧の取得に失敗しました:', error)
			throw new Error('会話一覧の取得に失敗しました')
		} finally {
			loading.value = false
		}
	}

	// 特定の会話のメッセージを取得
	const getMessages = async (conversationId: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		try {
			loading.value = true

			// 会話の詳細情報を取得
			const conversationDoc = await BaseAPI.getData({
				db_name: 'conversations',
				item_id: conversationId
			})

			if (!conversationDoc || !conversationDoc.exists()) {
				throw new Error('会話が見つかりません')
			}

			currentConversation.value = {
				...conversationDoc.data(),
				id: conversationId
			} as ConversationData

			// メッセージ一覧を取得
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: `conversations/${conversationId}/messages`,
				searchConditions: {
					sorters: [['createdAt', 'asc']],
					limit: 100
				}
			})

			if (!querySnapshot) {
				messages.value = []
				return
			}

			messages.value = querySnapshot.docs.map(doc => ({
				...doc.data(),
				id: doc.id
			})) as MessageData[]

			// 未読メッセージを既読にマーク
			await markMessagesAsRead(conversationId)

		} catch (error: any) {
			console.error('メッセージの取得に失敗しました:', error)
			throw new Error('メッセージの取得に失敗しました')
		} finally {
			loading.value = false
		}
	}

	// メッセージを既読にマーク
	const markMessagesAsRead = async (conversationId: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid) {
			return
		}

		try {
			// ユーザーの会話の未読数を0に更新
			await BaseAPI.setData(
				{
					db_name: `users/${userInfo.uid}/conversations`,
					item_id: conversationId
				},
				{
					unreadCount: 0,
					lastReadAt: serverTimestamp()
				}
			)
		} catch (error) {
			console.error('既読マークの更新に失敗しました:', error)
		}
	}

	// 新しい会話を開始
	const startConversation = async (otherUserId: string): Promise<string> => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		if (userInfo.uid === otherUserId) {
			throw new Error('自分自身との会話は開始できません')
		}

		const conversationId = generateConversationId(userInfo.uid, otherUserId)
		
		try {
			// 会話が既に存在するかチェック
			const existingConversation = await BaseAPI.getData({
				db_name: 'conversations',
				item_id: conversationId
			})

			if (existingConversation && existingConversation.exists()) {
				return conversationId
			}

			// 新しい会話を作成
			const batch = writeBatch(db)
			const conversationRef = BaseAPI.getDoc(`conversations/${conversationId}`)
			
			batch.set(conversationRef, {
				participants: [userInfo.uid, otherUserId],
				createdAt: serverTimestamp(),
				lastMessageAt: serverTimestamp(),
				unreadCount: 0
			})

			// 両方のユーザーの会話リストに追加
			const userConversationRef = BaseAPI.getDoc(`users/${userInfo.uid}/conversations/${conversationId}`)
			batch.set(userConversationRef, {
				unreadCount: 0,
				lastMessageAt: serverTimestamp()
			})

			const otherUserConversationRef = BaseAPI.getDoc(`users/${otherUserId}/conversations/${conversationId}`)
			batch.set(otherUserConversationRef, {
				unreadCount: 0,
				lastMessageAt: serverTimestamp()
			})

			await batch.commit()
			return conversationId

		} catch (error: any) {
			throw new Error(`会話の開始に失敗しました: ${error.message}`)
		}
	}

	// ストアをクリアする関数（ログアウト時用）
	const clearStore = (): void => {
		conversations.value = []
		currentConversation.value = null
		messages.value = []
		loading.value = false
	}

	return {
		conversations,
		currentConversation,
		messages,
		loading,
		sendMessage,
		getConversations,
		getMessages,
		markMessagesAsRead,
		startConversation,
		clearStore
	}
})
