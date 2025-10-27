import { defineStore } from 'pinia'
import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'

// 型定義
interface NotificationData {
	id: string
	userId: string
	type: string
	title: string
	message: string
	isRead: boolean
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

export const useNotificationStore = defineStore('notification', () => {
	const authStore = useAuthStore()
	
	// 状態管理
	const notifications = ref<NotificationData[]>([])
	const isDialogOpen = ref<boolean>(false)
	const activeTab = ref<string>('notifications')
	
	// 未読の通知数を計算
	const unreadNotificationCount = computed(() => {
		return notifications.value.filter(notification => !notification.isRead).length
	})
	
	// 通知一覧を取得
	const fetchNotifications = async (): Promise<void> => {
		try {
			if (!authStore.userInfo?.uid) return
			
			const param = {
				db_name: 'notifications',
				searchConditions: {
					filters: [['userId', '==', authStore.userInfo.uid]],
					sorters: [['createdAt', 'desc']],
					limit: 50
				}
			}
			
			const result = await BaseAPI.getDataWithQuery(param)
			notifications.value = []
			
			result.forEach(doc => {
				notifications.value.push({
					id: doc.id,
					...doc.data()
				} as NotificationData)
			})
		} catch (error) {
			console.error('通知の取得に失敗しました:', error)
		}
	}
	
	
	// 通知を作成（いいね、コメント、フォロー時）
	const createNotification = async (type: string, data: any): Promise<void> => {
		try {
			if (!authStore.userInfo?.uid) return
			
			const notificationData = {
				userId: data.userId || authStore.userInfo.uid,
				type: type, // 'like', 'comment', 'follow'
				title: getNotificationTitle(type, data),
				message: getNotificationMessage(type, data),
				isRead: false,
				createdAt: new Date(),
				relatedData: data
			}
			
			const param = {
				db_name: 'notifications'
			}
			
			await BaseAPI.addData(param, notificationData)
			
			// ローカルの通知リストを更新
			await fetchNotifications()
		} catch (error) {
			console.error('通知の作成に失敗しました:', error)
		}
	}
	
	
	// 通知を既読にする
	const markNotificationAsRead = async (notificationId: string): Promise<void> => {
		try {
			const param = {
				db_name: 'notifications',
				item_id: notificationId
			}
			
			await BaseAPI.setData(param, { isRead: true })
			
			// ローカルの通知を更新
			const notification = notifications.value.find(n => n.id === notificationId)
			if (notification) {
				notification.isRead = true
			}
		} catch (error) {
			console.error('通知の既読更新に失敗しました:', error)
		}
	}
	
	
	// 全ての通知を既読にする
	const markAllNotificationsAsRead = async (): Promise<void> => {
		try {
			const unreadNotifications = notifications.value.filter(n => !n.isRead)
			
			for (const notification of unreadNotifications) {
				await markNotificationAsRead(notification.id)
			}
		} catch (error) {
			console.error('通知の一括既読更新に失敗しました:', error)
		}
	}
	
	
	// ダイアログを開く
	const openDialog = async (): Promise<void> => {
		activeTab.value = 'notifications'
	}
	
	// ダイアログを閉じる
	const closeDialog = (): void => {
		isDialogOpen.value = false
	}
	
	// タブを切り替え
	const setActiveTab = (tab: string): void => {
		activeTab.value = tab
	}
	
	// 通知タイトルを取得
	const getNotificationTitle = (type: string, _data: any): string => {
		switch (type) {
			case 'like':
				return 'いいねされました'
			case 'comment':
				return 'コメントされました'
			case 'follow':
				return 'フォローされました'
			default:
				return '新しい通知'
		}
	}
	
	// 通知メッセージを取得
	const getNotificationMessage = (type: string, data: any): string => {
		switch (type) {
			case 'like':
				return `${data.userName || 'ユーザー'}があなたの記事「${data.blogTitle || '記事'}」にいいねしました`
			case 'comment':
				return `${data.userName || 'ユーザー'}があなたの記事「${data.blogTitle || '記事'}」にコメントしました`
			case 'follow':
				return `${data.userName || 'ユーザー'}があなたをフォローしました`
			default:
				return '新しい通知があります'
		}
	}
	
	// 初期化
	const initialize = async (): Promise<void> => {
		if (authStore.isLogin) {
			await fetchNotifications()
		}
	}
	
	return {
		// 状態
		notifications,
		isDialogOpen,
		activeTab,
		
		// 計算プロパティ
		unreadNotificationCount,
		
		// メソッド
		fetchNotifications,
		createNotification,
		markNotificationAsRead,
		markAllNotificationsAsRead,
		openDialog,
		closeDialog,
		setActiveTab,
		initialize
	}
})
