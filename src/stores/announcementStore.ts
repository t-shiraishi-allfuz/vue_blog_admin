import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'

// 型定義
interface AnnouncementData {
	id: string
	title: string
	content: string
	isRead: boolean
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

export const useAnnouncementStore = defineStore('announcement', () => {
	const announcements = ref<AnnouncementData[]>([])
	
	// 未読のお知らせ数を計算
	const unreadAnnouncementCount = computed(() => {
		return announcements.value?.filter(announcement => !announcement.isRead).length || 0
	})

	// お知らせを作成
	const create = async (announcementData: Partial<AnnouncementData>): Promise<boolean> => {
		try {
			const data = {
				...announcementData,
				isRead: false,
				createdAt: new Date(),
				updatedAt: new Date()
			}
			
			await BaseAPI.addData(
				{ db_name: "announcements" },
				data
			)
			return true
		} catch (error) {
			console.error('お知らせ作成エラー:', error)
			throw new Error('お知らせの作成に失敗しました')
		}
	}

	// お知らせ一覧を取得
	const getList = async (): Promise<void> => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "announcements",
				searchConditions: {
					sorters: [["createdAt", "desc"]]
				}
			})
			
			if (querySnapshot && querySnapshot.docs) {
				announcements.value = querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}))
			}
		} catch (error) {
			console.error('お知らせ一覧取得エラー:', error)
			throw new Error('お知らせ一覧の取得に失敗しました')
		}
	}

	// お知らせを更新
	const update = async (announcementId, announcementData) => {
		try {
			const data = {
				...announcementData,
				updatedAt: new Date()
			}
			
			await BaseAPI.setData(
				{ db_name: "announcements", item_id: announcementId },
				data
			)
			return true
		} catch (error) {
			console.error('お知らせ更新エラー:', error)
			throw new Error('お知らせの更新に失敗しました')
		}
	}

	// お知らせを削除
	const deleteAnnouncement = async (announcementId) => {
		try {
			await BaseAPI.deleteData({ db_name: "announcements", item_id: announcementId })
			return true
		} catch (error) {
			console.error('お知らせ削除エラー:', error)
			throw new Error('お知らせの削除に失敗しました')
		}
	}

	// お知らせを既読にする
	const markAnnouncementAsRead = async (announcementId) => {
		try {
			await BaseAPI.setData(
				{ db_name: "announcements", item_id: announcementId },
				{ isRead: true, readAt: new Date() }
			)
			
			// ローカルのお知らせを更新
			const announcement = announcements.value?.find(a => a.id === announcementId)
			if (announcement) {
				announcement.isRead = true
				announcement.readAt = new Date()
			}
		} catch (error) {
			console.error('お知らせの既読更新に失敗しました:', error)
			throw new Error('お知らせの既読更新に失敗しました')
		}
	}

	// 全てのお知らせを既読にする
	const markAllAnnouncementsAsRead = async () => {
		try {
			const unreadAnnouncements = announcements.value?.filter(a => !a.isRead) || []
			
			for (const announcement of unreadAnnouncements) {
				await markAnnouncementAsRead(announcement.id)
			}
		} catch (error) {
			console.error('お知らせの一括既読更新に失敗しました:', error)
			throw new Error('お知らせの一括既読更新に失敗しました')
		}
	}

	// 公開中のお知らせ一覧を取得（一般ユーザー向け）
	const getPublicList = async () => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "announcements",
				searchConditions: {
					filters: [["isPublished", "==", true]],
					sorters: [["createdAt", "desc"]]
				}
			})
			
			if (querySnapshot && querySnapshot.docs) {
				announcements.value = querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}))
			}
		} catch (error) {
			console.error('公開お知らせ一覧取得エラー:', error)
			throw new Error('お知らせ一覧の取得に失敗しました')
		}
	}

	return {
		announcements,
		unreadAnnouncementCount,
		create,
		getList,
		update,
		deleteAnnouncement,
		markAnnouncementAsRead,
		markAllAnnouncementsAsRead,
		getPublicList
	}
})
