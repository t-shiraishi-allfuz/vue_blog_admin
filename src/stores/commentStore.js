import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useNotificationStore } from '@/stores/notificationStore'

export const useCommentStore = defineStore('comment', () => {
	const commentList = ref([])
	const commentDetail = ref({})

	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()
	const notificationStore = useNotificationStore()

	const setCommentData = async (doc) => {
		const data = {
			id: doc.id,
			setting: null,
			reply: {},
			...doc.data()
		}
		data.setting = await blogSettingStore.getForUid(data.uid)

		if (data.reply_id) {
			const reply_doc = await BaseAPI.getData(
				{db_name: "comment", item_id: data.reply_id},
			)
			if (reply_doc) {
				data.reply = reply_doc.data()
			}
		}

		if (data.createdAt && data.createdAt.toDate) {
			data.createdAt = data.createdAt.toDate()
		}
		return data
	}

	const create = async (payload, blog_title, blog_author_uid) => {
		await BaseAPI.addData(
			{db_name: "comment"},
			payload
		)

		// 自分の記事でない場合のみ通知を作成
		if (blog_author_uid && blog_author_uid !== payload.uid) {
			const userSetting = await blogSettingStore.getForUid(payload.uid)
			await notificationStore.createNotification('comment', {
				userId: blog_author_uid,
				userName: userSetting?.title || 'ユーザー',
				blogTitle: blog_title,
				blogId: payload.blog_id
			})
		}
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

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setCommentData(doc))
			const result = await Promise.all(promises)
			commentList.value = result
		}
	}

	const getDetail = async (comment_id) => {
		const doc = await BaseAPI.getData(
			{db_name: "comment", item_id: comment_id},
		)
		if (doc) {
			commentDetail.value = await setCommentData(doc)
		}
	}

	const getCommentCounts = async (blogIds) => {
		const promises = blogIds.map(id => getCommentCount(id))
		const results = await Promise.all(promises)
		return blogIds.reduce((acc, id, index) => {
			acc[id] = results[index]
			return acc
		}, {})
	}

	const getCommentCount = async (blogId) => {
		const filters = [
			["blog_id", "==", blogId],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "comment",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
	}

	const deleteItem = async (comment_id) => {
		await BaseAPI.deleteData(
			{db_name: "comment", item_id: comment_id},
		)
	}

	return {
		commentList,
		commentDetail,
		setCommentData,
		create,
		getList,
		getDetail,
		getCommentCounts,
		getCommentCount,
		deleteItem
	}
})
