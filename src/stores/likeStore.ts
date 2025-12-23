import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useNotificationStore } from '@/stores/notificationStore'
// 型定義
interface LikeData {
	id: string
	uid: string
	blog_id: string
	createdAt: Date
	updatedAt: Date
	user?: any
}

export const useLikeStore = defineStore('like', () => {
	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()
	const notificationStore = useNotificationStore()

	const create = async (blog_id: string, blog_title: string, blog_author_uid: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		await BaseAPI.addData(
			{db_name: "like"},
			{
				uid: userInfo.uid,
				blog_id: blog_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)

		// 自分の記事でない場合のみ通知を作成
		if (blog_author_uid && blog_author_uid !== userInfo.uid) {
			const userSetting = await blogSettingStore.getForUid(userInfo.uid)
			await notificationStore.createNotification('like', {
				userId: blog_author_uid,
				userName: userSetting?.title || 'ユーザー',
				blogTitle: blog_title,
				blogId: blog_id,
				actorUserId: userInfo.uid // いいねをしたユーザーID
			})
		}
	}

	// つぶやき用いいね作成
	const addLike = async (tweet_id: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		await BaseAPI.addData(
			{db_name: "like"},
			{
				uid: userInfo.uid,
				tweet_id: tweet_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	// モーメント用いいね作成
	const addMomentLike = async (moment_id: string, moment_title: string, moment_author_uid: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		await BaseAPI.addData(
			{db_name: "like"},
			{
				uid: userInfo.uid,
				moment_id: moment_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)

		// 自分のモーメントでない場合のみ通知を作成
		if (moment_author_uid && moment_author_uid !== userInfo.uid) {
			const userSetting = await blogSettingStore.getForUid(userInfo.uid)
			await notificationStore.createNotification('like', {
				userId: moment_author_uid,
				userName: userSetting?.title || 'ユーザー',
				blogTitle: moment_title,
				blogId: moment_id,
				actorUserId: userInfo.uid // いいねをしたユーザーID
			})
		}
	}

	// 指定のブログにいいねした
	const getListForBlog = async (blog_id: string): Promise<LikeData[]> => {
		const filters = [
			["blog_id", "==", blog_id]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (!querySnapshot) return []

		const likeList = querySnapshot.docs.map((doc) => {
			const data = { id: doc.id, ...doc.data() } as any
			if (data.createdAt && data.createdAt.toDate) {
				data.createdAt = data.createdAt.toDate()
			}
			return data
		})

		const settingList = await blogSettingStore.getForUids(
			likeList.map((like) => like.uid)
		)

		return likeList.map(like => ({
			...like,
			user: (settingList as any)[like.uid] || null
		}))
	}

	// 指定のユーザーがいいねした
	const getListForUser = async (): Promise<LikeData[]> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合は空配列を返す
		if (!userInfo || !userInfo.uid) {
			return []
		}
		
		const filters = [
			["uid", "==", userInfo.uid]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (!querySnapshot) return []

		return querySnapshot.docs.map((doc) => {
			const data = { id: doc.id, ...doc.data() } as any
			if (data.createdAt && data.createdAt.toDate) {
				data.createdAt = data.createdAt.toDate()
			}
			return data
		})
	}

	const getLikeCounts = async (blogIds: string[]): Promise<Record<string, number>> => {
		const promises = blogIds.map(id => getLikeCount(id))
		const results = await Promise.all(promises)
		const counts: Record<string, number> = {}
		blogIds.forEach((id, index) => {
			counts[id] = results[index]
		})
		return counts
	}

	// 指定のブログにいいねした数
	const getLikeCount = async (blog_id: string): Promise<number> => {
		const filters = [
			["blog_id", "==", blog_id],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
	}

	// 指定のモーメントにいいねした数
	const getMomentLikeCount = async (moment_id: string): Promise<number> => {
		const filters = [
			["moment_id", "==", moment_id],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
	}

	// 指定のブログにいいねしてるかどうか（一括）
	const isLikes = async (blogIds: string[]): Promise<Record<string, boolean>> => {
		const promises = blogIds.map(id => isLike(id))
		const results = await Promise.all(promises)
		const likes: Record<string, boolean> = {}
		blogIds.forEach((id, index) => {
			likes[id] = results[index]
		})
		return likes
	}

	// 指定のブログにいいねしてるかどうか
	const isLike = async (blog_id: string): Promise<boolean> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合はfalseを返す
		if (!userInfo || !userInfo.uid) {
			return false
		}
		
		const filters = [
			["blog_id", "==", blog_id],
			["uid", "==", userInfo.uid]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
					limit: 1
				}
			}
		)
		return !!querySnapshot?.docs.length
	}

	// 指定のモーメントにいいねしてるかどうか
	const isMomentLike = async (moment_id: string): Promise<boolean> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合はfalseを返す
		if (!userInfo || !userInfo.uid) {
			return false
		}
		
		const filters = [
			["moment_id", "==", moment_id],
			["uid", "==", userInfo.uid]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
					limit: 1
				}
			}
		)
		return !!querySnapshot?.docs.length
	}

	const deleteItem = async (blog_id: string): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const filters = [
			["blog_id", "==", blog_id],
			["uid", "==", userInfo.uid]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				BaseAPI.deleteData(
					{db_name: "like", item_id: docSnapshot.id},
				)
			)
			await Promise.all(deletePromises)
		}
	}

	// つぶやき用いいね削除
	const deleteLike = async (tweet_id: string): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const filters = [
			["tweet_id", "==", tweet_id],
			["uid", "==", userInfo.uid]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				BaseAPI.deleteData(
					{db_name: "like", item_id: docSnapshot.id},
				)
			)
			await Promise.all(deletePromises)
		}
	}

	// モーメント用いいね削除
	const deleteMomentLike = async (moment_id: string): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const filters = [
			["moment_id", "==", moment_id],
			["uid", "==", userInfo.uid]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "like",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				BaseAPI.deleteData(
					{db_name: "like", item_id: docSnapshot.id},
				)
			)
			await Promise.all(deletePromises)
		}
	}

	return {
		create,
		addLike,
		addMomentLike,
		getListForBlog,
		getListForUser,
		getLikeCounts,
		getLikeCount,
		getMomentLikeCount,
		isLikes,
		isLike,
		isMomentLike,
		deleteItem,
		deleteLike,
		deleteMomentLike
	}
})
