import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'

export const useBookmarkStore = defineStore('bookmark', () => {
	const authStore = useAuthStore()

	const create = async (blog_id: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		await BaseAPI.addData(
			{db_name: "bookmark"},
			{
				uid: userInfo.uid,
				blog_id: blog_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	// つぶやき用ブックマーク作成
	const addBookmark = async (tweet_id: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		await BaseAPI.addData(
			{db_name: "bookmark"},
			{
				uid: userInfo.uid,
				tweet_id: tweet_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	// モーメント用ブックマーク作成
	const addTweetBookmark = async (tweet_id: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		await BaseAPI.addData(
			{db_name: "bookmark"},
			{
				uid: userInfo.uid,
				tweet_id: tweet_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	// モーメント用ブックマーク作成
	const addMomentBookmark = async (moment_id: string): Promise<void> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		await BaseAPI.addData(
			{db_name: "bookmark"},
			{
				uid: userInfo.uid,
				moment_id: moment_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	// ブックマークしているブログIDのリスト取得
	const getBlogIds = async (): Promise<string[]> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は空配列を返す
		if (!userInfo || !userInfo.uid) {
			return []
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (!querySnapshot) return []

		return querySnapshot.docs.map((doc) => {
			const data = doc.data()
			return data.blog_id
		}).filter(id => id) // nullやundefinedを除外
	}

	// ブックマークしているつぶやきIDのリスト取得
	const getTweetIds = async (): Promise<string[]> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は空配列を返す
		if (!userInfo || !userInfo.uid) {
			return []
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (!querySnapshot) return []

		return querySnapshot.docs.map((doc) => {
			const data = doc.data()
			return data.tweet_id
		}).filter(id => id) // nullやundefinedを除外
	}

	// ブックマークしているモーメントIDのリスト取得
	const getMomentIds = async (): Promise<string[]> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は空配列を返す
		if (!userInfo || !userInfo.uid) {
			return []
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (!querySnapshot) return []

		return querySnapshot.docs.map((doc) => {
			const data = doc.data()
			return data.moment_id
		}).filter(id => id) // nullやundefinedを除外
	}

	// 指定のブログをブックマークしてるかどうか（一括）
	const isBookmarks = async (blogIds: string[]): Promise<Record<string, number>> => {
		const promises = blogIds.map(id => isBookmark(id))
		const results = await Promise.all(promises)
		const bookmarks: Record<string, number> = {}
		blogIds.forEach((id, index) => {
			bookmarks[id] = results[index]
		})
		return bookmarks
	}

	// 指定のブログをブックマークしてるかどうか
	const isBookmark = async (blog_id: string): Promise<number> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は0を返す
		if (!userInfo || !userInfo.uid) {
			return 0
		}
		
		const filters = [
			["blog_id", "==", blog_id],
			["uid", "==", userInfo.uid]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
	}

	// 指定のつぶやきをブックマークしてるかどうか
	const isTweetBookmark = async (tweet_id: string): Promise<number> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は0を返す
		if (!userInfo || !userInfo.uid) {
			return 0
		}
		
		const filters = [
			["tweet_id", "==", tweet_id],
			["uid", "==", userInfo.uid]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
	}

	// 指定のモーメントをブックマークしてるかどうか
	const isMomentBookmark = async (moment_id: string): Promise<number> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は0を返す
		if (!userInfo || !userInfo.uid) {
			return 0
		}
		
		const filters = [
			["moment_id", "==", moment_id],
			["uid", "==", userInfo.uid]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
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
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				BaseAPI.deleteData(
					{db_name: "bookmark", item_id: docSnapshot.id},
				)
			)
			await Promise.all(deletePromises)
		}
	}

	// つぶやき用ブックマーク削除
	const deleteBookmark = async (tweet_id: string): Promise<void> => {
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
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				BaseAPI.deleteData(
					{db_name: "bookmark", item_id: docSnapshot.id},
				)
			)
			await Promise.all(deletePromises)
		}
	}

	// モーメント用ブックマーク削除
	const deleteMomentBookmark = async (moment_id: string): Promise<void> => {
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
				db_name: "bookmark",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				BaseAPI.deleteData(
					{db_name: "bookmark", item_id: docSnapshot.id},
				)
			)
			await Promise.all(deletePromises)
		}
	}

	return {
		create,
		addBookmark,
		addTweetBookmark,
		addMomentBookmark,
		getBlogIds,
		getTweetIds,
		getMomentIds,
		isBookmarks,
		isBookmark,
		isTweetBookmark,
		isMomentBookmark,
		deleteItem,
		deleteBookmark,
		deleteMomentBookmark
	}
})
