import BaseAPI from '@/api/base'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useNotificationStore } from '@/stores/notificationStore'

// 型定義
interface CommentData {
	id: string
	uid: string
	blog_id: string
	body: string
	reply_id?: string
	createdAt: Date
	updatedAt: Date
	setting?: any
	reply?: any
}

export const useCommentStore = defineStore('comment', () => {
	const commentList = ref<CommentData[]>([])
	const commentDetail = ref<CommentData>({} as CommentData)

	const blogSettingStore = useBlogSettingStore()
	const notificationStore = useNotificationStore()

	const setCommentData = async (doc: any): Promise<CommentData> => {
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

	const create = async (payload: Partial<CommentData>, blog_title: string, blog_author_uid: string): Promise<void> => {
		if (!payload.uid) {
			throw new Error('ユーザーIDが取得できません')
		}
		
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
				blogId: payload.blog_id,
				actorUserId: payload.uid // コメントしたユーザーID
			})
		}
	}

	const getList = async (blog_id: string): Promise<void> => {
		try {
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
			} else {
				commentList.value = []
			}
		} catch (error) {
			console.error('コメント一覧の取得に失敗しました:', error)
			commentList.value = []
			throw error
		}
	}

	const getDetail = async (comment_id: string): Promise<void> => {
		const doc = await BaseAPI.getData(
			{db_name: "comment", item_id: comment_id},
		)
		if (doc) {
			commentDetail.value = await setCommentData(doc)
		}
	}

	const getCommentCounts = async (blogIds: string[]): Promise<Record<string, number>> => {
		const promises = blogIds.map((id: string) => getCommentCount(id))
		const results = await Promise.all(promises)
		return blogIds.reduce((acc: Record<string, number>, id: string, index: number) => {
			acc[id] = results[index]
			return acc
		}, {})
	}

	const getCommentCount = async (blogId: string): Promise<number> => {
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

	const deleteItem = async (comment_id: string): Promise<void> => {
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
