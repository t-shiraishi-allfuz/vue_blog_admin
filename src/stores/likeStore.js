import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'

export const useLikeStore = defineStore('like', () => {
	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()

	const create = async (blog_id) => {
		const userInfo = authStore.userInfo

		await BaseAPI.addData(
			{db_name: "like"},
			{
				uid: userInfo.uid,
				blog_id: blog_id,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	// 指定のブログにいいねした
	const getListForBlog = async (blog_id) => {
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
			const data = { id: doc.id, ...doc.data() }
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
			user: settingList[like.uid] || null
		}))
	}

	// 指定のユーザーがいいねした
	const getListForUser = async () => {
		const userInfo = authStore.userInfo
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
			const data = { id: doc.id, ...doc.data() }
			if (data.createdAt && data.createdAt.toDate) {
				data.createdAt = data.createdAt.toDate()
			}
			return data
		})
	}

	const getLikeCounts = async (blogIds) => {
		const promises = blogIds.map(id => getLikeCount(id))
		const results = await Promise.all(promises)
		const counts = {}
		blogIds.forEach((id, index) => {
			counts[id] = results[index]
		})
		return counts
	}

	// 指定のブログにいいねした数
	const getLikeCount = async (blog_id) => {
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

	// 指定のブログにいいねしてるかどうか（一括）
	const isLikes = async (blogIds) => {
		const promises = blogIds.map(id => isLike(id))
		const results = await Promise.all(promises)
		const likes = {}
		blogIds.forEach((id, index) => {
			likes[id] = results[index]
		})
		return likes
	}

	// 指定のブログにいいねしてるかどうか
	const isLike = async (blog_id) => {
		const userInfo = authStore.getUserInfo()
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

	const deleteItem = async (blog_id) => {
		const userInfo = authStore.getUserInfo()
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

	return {
		create,
		getListForBlog,
		getListForUser,
		getLikeCounts,
		getLikeCount,
		isLikes,
		isLike,
		deleteItem
	}
})
