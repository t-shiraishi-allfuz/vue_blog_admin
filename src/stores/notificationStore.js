import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'

export const useNotificationStore = defineStore('notification', () => {
	const authStore = useAuthStore()
	
	// 状態管理
	const notifications = ref([])
	const announcements = ref([])
	const isDialogOpen = ref(false)
	const activeTab = ref('notifications')
	
	// 未読の通知数を計算
	const unreadNotificationCount = computed(() => {
		return notifications.value.filter(notification => !notification.isRead).length
	})
	
	// 未読のお知らせ数を計算
	const unreadAnnouncementCount = computed(() => {
		return announcements.value.filter(announcement => !announcement.isRead).length
	})
	
	// 総未読数を計算
	const totalUnreadCount = computed(() => {
		return unreadNotificationCount.value + unreadAnnouncementCount.value
	})
	
	// 通知一覧を取得
	const fetchNotifications = async () => {
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
				})
			})
		} catch (error) {
			console.error('通知の取得に失敗しました:', error)
		}
	}
	
	// お知らせ一覧を取得
	const fetchAnnouncements = async () => {
		try {
			if (!authStore.userInfo?.uid) return
			
			const param = {
				db_name: 'announcements',
				searchConditions: {
					sorters: [['createdAt', 'desc']],
					limit: 50
				}
			}
			
			const result = await BaseAPI.getDataWithQuery(param)
			announcements.value = []
			
			result.forEach(doc => {
				announcements.value.push({
					id: doc.id,
					...doc.data()
				})
			})
		} catch (error) {
			console.error('お知らせの取得に失敗しました:', error)
		}
	}
	
	// 通知を作成（いいね、コメント、フォロー時）
	const createNotification = async (type, data) => {
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
	
	// お知らせを作成（運営用）
	const createAnnouncement = async (title, message) => {
		try {
			const announcementData = {
				title: title,
				message: message,
				isRead: false,
				createdAt: new Date(),
				createdBy: authStore.userInfo?.uid || 'admin'
			}
			
			const param = {
				db_name: 'announcements'
			}
			
			await BaseAPI.addData(param, announcementData)
			
			// ローカルのお知らせリストを更新
			await fetchAnnouncements()
		} catch (error) {
			console.error('お知らせの作成に失敗しました:', error)
		}
	}
	
	// 通知を既読にする
	const markNotificationAsRead = async (notificationId) => {
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
	
	// お知らせを既読にする
	const markAnnouncementAsRead = async (announcementId) => {
		try {
			const param = {
				db_name: 'announcements',
				item_id: announcementId
			}
			
			await BaseAPI.setData(param, { isRead: true })
			
			// ローカルのお知らせを更新
			const announcement = announcements.value.find(a => a.id === announcementId)
			if (announcement) {
				announcement.isRead = true
			}
		} catch (error) {
			console.error('お知らせの既読更新に失敗しました:', error)
		}
	}
	
	// 全ての通知を既読にする
	const markAllNotificationsAsRead = async () => {
		try {
			const unreadNotifications = notifications.value.filter(n => !n.isRead)
			
			for (const notification of unreadNotifications) {
				await markNotificationAsRead(notification.id)
			}
		} catch (error) {
			console.error('通知の一括既読更新に失敗しました:', error)
		}
	}
	
	// 全てのお知らせを既読にする
	const markAllAnnouncementsAsRead = async () => {
		try {
			const unreadAnnouncements = announcements.value.filter(a => !a.isRead)
			
			for (const announcement of unreadAnnouncements) {
				await markAnnouncementAsRead(announcement.id)
			}
		} catch (error) {
			console.error('お知らせの一括既読更新に失敗しました:', error)
		}
	}
	
	// ダイアログを開く
	const openDialog = async () => {
		activeTab.value = 'notifications'
	}
	
	// ダイアログを閉じる
	const closeDialog = () => {
		isDialogOpen.value = false
	}
	
	// タブを切り替え
	const setActiveTab = (tab) => {
		activeTab.value = tab
	}
	
	// 通知タイトルを取得
	const getNotificationTitle = (type, data) => {
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
	const getNotificationMessage = (type, data) => {
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
	const initialize = async () => {
		if (authStore.isLogin) {
			await Promise.all([
				fetchNotifications(),
				fetchAnnouncements()
			])
		}
	}
	
	return {
		// 状態
		notifications,
		announcements,
		isDialogOpen,
		activeTab,
		
		// 計算プロパティ
		unreadNotificationCount,
		unreadAnnouncementCount,
		totalUnreadCount,
		
		// メソッド
		fetchNotifications,
		fetchAnnouncements,
		createNotification,
		createAnnouncement,
		markNotificationAsRead,
		markAnnouncementAsRead,
		markAllNotificationsAsRead,
		markAllAnnouncementsAsRead,
		openDialog,
		closeDialog,
		setActiveTab,
		initialize
	}
})
