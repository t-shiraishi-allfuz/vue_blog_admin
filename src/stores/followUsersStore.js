import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { db } from '@/setting/firebase'
import { writeBatch, increment } from 'firebase/firestore'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useNotificationStore } from '@/stores/notificationStore'

// フォロー管理
export const useFollowUsersStore = defineStore('follow_users', () => {
	const followingList = ref([])
	const followersList = ref([])

	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()
	const notificationStore = useNotificationStore()

	const create = async (uid) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		// 一括操作
		const batch = writeBatch(db)
		try {
			// 相互にドキュメント追加
			const followingDocRef = BaseAPI.getDoc(`users/${uid}/following/${userInfo.uid}`)
			batch.set(followingDocRef, { followedAt: new Date() })

			const followersDocRef = BaseAPI.getDoc(`users/${userInfo.uid}/followers/${uid}`)
			batch.set(followersDocRef, { followedAt: new Date() })

			// 相互にフォロー数を増やす
			const followerUserRef = BaseAPI.getDoc(`users/${uid}`)
			batch.update(followerUserRef, { followingCount: increment(1) })

			const followingUserRef = BaseAPI.getDoc(`users/${userInfo.uid}`)
			batch.update(followingUserRef, { followerCount: increment(1) })

			await batch.commit()

			// フォロー通知を作成
			const userSetting = await blogSettingStore.getForUid(userInfo.uid)
			await notificationStore.createNotification('follow', {
				userId: uid,
				userName: userSetting?.title || 'ユーザー',
				actorUserId: userInfo.uid // フォローしたユーザーID
			})
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	// 指定のユーザーをフォローしているかどうか
	const isFollower = async (uid) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はfalseを返す
		if (!userInfo || !userInfo.uid) {
			return false
		}

		try {
			const doc = await BaseAPI.getData({
				db_name: `users/${userInfo.uid}/followers`,
				item_id: uid
			})
			return !!doc
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	// 指定のユーザーにフォローされているかどうか
	const isFollowing = async (uid) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はfalseを返す
		if (!userInfo || !userInfo.uid) {
			return false
		}

		try {
			const doc = await BaseAPI.getData({
				db_name: `users/${uid}/followers`,
				item_id: userInfo.uid
			})
			return !!doc
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	// 指定のユーザーをフォローしているユーザーリスト
	const getListFollowing = async (uid) => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery(
				{
					db_name: `users/${uid}/following`,
					searchConditions: {}
				}
			)
			if (!querySnapshot) return []

			followingList.value = querySnapshot.docs.map(doc => doc.id)
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	// 指定のユーザーがフォローしているユーザーリスト
	const getListFollowers = async (uid) => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery(
				{
					db_name: `users/${uid}/followers`,
					searchConditions: {}
				}
			)
			if (!querySnapshot) return []

			followersList.value = querySnapshot.docs.map(doc => doc.id)
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	// フォロー統計を取得
	const getFollowStats = async (userId) => {
		try {
			const userDoc = await BaseAPI.getData({
				db_name: 'users',
				item_id: userId
			})
			
			if (userDoc && userDoc.exists()) {
				const data = userDoc.data()
				return {
					followerCount: data.followerCount || 0,
					followingCount: data.followingCount || 0
				}
			}
			
			return {
				followerCount: 0,
				followingCount: 0
			}
		} catch (error) {
			console.error('フォロー統計の取得に失敗しました:', error)
			return {
				followerCount: 0,
				followingCount: 0
			}
		}
	}

	const deleteItem = async (uid) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		// 一括操作
		const batch = writeBatch(db)
		try {
			// 相互にドキュメント追加
			const followingDocRef = BaseAPI.getDoc(`users/${uid}/following/${userInfo.uid}`)
			batch.delete(followingDocRef, { followedAt: new Date() })

			const followersDocRef = BaseAPI.getDoc(`users/${userInfo.uid}/followers/${uid}`)
			batch.delete(followersDocRef, { followedAt: new Date() })

			// 相互にフォロー数を増やす
			const followerUserRef = BaseAPI.getDoc(`users/${uid}`)
			batch.update(followerUserRef, { followingCount: increment(-1) })

			const followingUserRef = BaseAPI.getDoc(`users/${userInfo.uid}`)
			batch.update(followingUserRef, { followerCount: increment(-1) })

			await batch.commit()
		} catch (error) {
			throw new Error(`エラーが発生しました': ${error.message}`)
		}
	}

	// ストアをクリアする関数（ログアウト時用）
	const clearStore = () => {
		followingList.value = []
		followersList.value = []
	}

	return {
		followingList,
		followersList,
		create,
		isFollower,
		isFollowing,
		getListFollowing,
		getListFollowers,
		getFollowStats,
		deleteItem,
		clearStore,
	}
})
