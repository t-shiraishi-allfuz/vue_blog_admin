import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

export const useCommentStore = defineStore('comment', () => {
	const authStore = useAuthStore()

	const create = async (comment, blog_id) => {
		const userInfo = authStore.userInfo

		comment.uid = userInfo.uid
		comment.blog_id = blog_id
		comment.createdAt = new Date()
		comment.updatedAt = new Date()

		await BaseAPI.addData(
			{db_name: "comment"},
			comment
		)
	}

	const getList = async (blog_id) => {
		const filters = [
			["blog_id", "==", blog_id],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "comment",
				searchConditions: {
					filters: filters,
				}
			}
		)

		const result = []
		if (querySnapshot) {
			querySnapshot.forEach(doc => {
				const data = { id: doc.id, ...doc.data() }
				if (data.createdAt && data.createdAt.toDate) {
					data.createdAt = data.createdAt.toDate()
				}
				result.push(data)
			})
		}
		return result
	}

	const getDetail = async (comment_id) => {
		const doc = await BaseAPI.getData(
			{db_name: "comment", item_id: comment_id},
		)
		if (doc) {
			return doc.data()
		} else {
			return null
		}
	}

	const getCommentCounts = async (blogIds) => {
		const counts = {}
		for (const blogId of blogIds) {
			counts[blogId] = await getCommentCount(blogId)
		}
		return counts
	}

	const getCommentCount = async (blogId) => {
		const result = await getList(blogId)
		if (result) {
			return result.length
		} else {
			return 0
		}
	}

	const deleteItem = async (comment_id) => {
		await BaseAPI.deleteData(
			{db_name: "comment", item_id: comment_id},
		)
	}

	return {
		create,
		getList,
		getDetail,
		getCommentCounts,
		getCommentCount,
		deleteItem
	}
})
