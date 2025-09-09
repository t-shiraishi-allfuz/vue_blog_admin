import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

export const useBookmarkStore = defineStore('bookmark', () => {
	const authStore = useAuthStore()

	const create = async (blog_id) => {
		const userInfo = authStore.userInfo
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

	// ブックマークしているブログIDのリスト取得
	const getBlogIds = async () => {
		const userInfo = authStore.getUserInfo()
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
		})
	}

	// 指定のブログをブックマークしてるかどうか（一括）
	const isBookmarks = async (blogIds) => {
		const promises = blogIds.map(id => isBookmark(id))
		const results = await Promise.all(promises)
		const bookmarks = {}
		blogIds.forEach((id, index) => {
			bookmarks[id] = results[index]
		})
		return bookmarks
	}

	// 指定のブログをブックマークしてるかどうか
	const isBookmark = async (blog_id) => {
		const userInfo = authStore.getUserInfo()
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

	const deleteItem = async (blog_id) => {
		const userInfo = authStore.getUserInfo()
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

	return {
		create,
		getBlogIds,
		isBookmarks,
		isBookmark,
		deleteItem
	}
})
