import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'

export const useAnnouncementStore = defineStore('announcement', () => {
	// お知らせを作成
	const create = async (announcementData) => {
		try {
			const data = {
				...announcementData,
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
	const getList = async () => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "announcements",
				searchConditions: {
					sorters: [["createdAt", "desc"]]
				}
			})
			
			if (querySnapshot && querySnapshot.docs) {
				return querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}))
			}
			return []
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
				return querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data()
				}))
			}
			return []
		} catch (error) {
			console.error('公開お知らせ一覧取得エラー:', error)
			throw new Error('お知らせ一覧の取得に失敗しました')
		}
	}

	return {
		create,
		getList,
		update,
		deleteAnnouncement,
		getPublicList
	}
})
