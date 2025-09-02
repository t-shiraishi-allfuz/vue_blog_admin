import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useCommentStore } from '@/stores/commentStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'

export const useBlogStore = defineStore('blog', () => {
	const authStore = useAuthStore()
	const commentStore = useCommentStore()
	const likeStore = useLikeStore()
	const bookmarkStore = useBookmarkStore()

	const blogList = ref([])
	const blogDetail = ref(null)
	const selectType = ref(0)

	const tempBlog = ref({
		uid: null,
		title: "",
		summary: "",
		content: "",
		category_id: null,
		isAdult: false,
		isPublished: false,
		thumbUrl: null,
		share_blog_id: null,
		createdAt: null,
		updatedAt: null
	})

	const setSelectType = (type) => {
		selectType.value = type
	}

	const create = async(blog) => {
		const userInfo = authStore.userInfo
		blog.uid = userInfo.uid
		blog.createdAt = new Date()
		blog.updatedAt = new Date()

		await BaseAPI.addData(
			{db_name: "blog"},
			blog
		)
	}

	const update = async (blog) => {
		await BaseAPI.setData(
			{db_name: "blog", item_id: blog.id},
			{
				title: blog.title,
				content: blog.content,
				summary: blog.summary,
				thumbUrl: blog.thumbUrl,
				category_id: blog.category_id,
				isPublished: blog.isPublished,
				updatedAt: new Date(),
			}
		)
	}

	const getDetail = async (blog_id) => {
		const doc = await BaseAPI.getData(
			{db_name: "blog", item_id: blog_id},
		)

		if (doc) {
			const commentCount = await commentStore.getCommentCount(doc.id)
			const likeCount = await likeStore.getLikeCount(doc.id)
			const isLike = await likeStore.isLike(doc.id)
			const isBookmark = await bookmarkStore.isBookmark(doc.id)
			const data = {
				id: doc.id,
				comment_count: commentCount,
				like_count: likeCount,
				is_like: isLike,
				is_bookmark: isBookmark,
				shareBlog: null,
				...doc.data()
			}

			if (data.createdAt?.toDate) {
				data.createdAt = data.createdAt.toDate();
			}
			blogDetail.value = data
		}
	}

	const deleteItem = async (blog_id) => {
		await BaseAPI.deleteData(
			{db_name: "blog", item_id: blog_id},
		)
	}

	// 自分のブログ一覧取得
	const getList = async () => {
		const userInfo = authStore.userInfo
		const filters = [
			["uid", "==", userInfo.uid]
		]
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "blog",
				searchConditions: {
					filters: filters,
					sorters: sorters,
				}
			}
		)

		const result = []
		if (querySnapshot) {
			const results = querySnapshot.docs.map((doc) => {
				const data = { id: doc.id, ...doc.data() }
				if (data.createdAt?.toDate) {
					data.createdAt = data.createdAt.toDate()
				}
				return { ...data, rawDoc: doc }
			})
			
			const commentCounts = await commentStore.getCommentCounts(
				results.map((blog) => blog.id)
			)

			const likeCounts = await likeStore.getLikeCounts(
				results.map((blog) => blog.id)
			)

			const isLikes = await likeStore.isLikes(
				results.map((blog) => blog.id)
			)

			const isBookmarks = await bookmarkStore.isBookmarks(
				results.map((blog) => blog.id)
			)

			// 結果を組み立てる
			for (const blog of results) {
				result.push({
					...blog,
					comment_count: commentCounts[blog.id] || 0,
					like_count: likeCounts[blog.id] || 0,
					is_like: isLikes[blog.id] || false,
					is_bookmark: isBookmarks[blog.id] || false
				})
			}
			blogList.value = result
		}
	}

	// 全ユーザーのブログデータ取得
	const getListForAll = async () => {
		const filters = [
			["isPublished", "==", true]
		]
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "blog",
				searchConditions: {
					filters: filters,
					sorters: sorters,
					limit: 10
				}
			}
		)

		const result = []
		if (querySnapshot) {
			const blogList = querySnapshot.docs.map((doc) => {
				const data = { id: doc.id, ...doc.data() }
				if (data.createdAt?.toDate) {
					data.createdAt = data.createdAt.toDate()
				}
				return { ...data, rawDoc: doc }
			})
			const commentCounts = await commentStore.getCommentCounts(
				blogList.map((blog) => blog.id)
			)
			const likeCounts = await likeStore.getLikeCounts(
				blogList.map((blog) => blog.id)
			)
			const isLikes = await likeStore.isLikes(
				blogList.map((blog) => blog.id)
			)
			const isBookmarks = await bookmarkStore.isBookmarks(
				blogList.map((blog) => blog.id)
			)
			// 結果を組み立てる
			for (const blog of blogList) {
				result.push({
					...blog,
					comment_count: commentCounts[blog.id] || 0,
					like_count: likeCounts[blog.id] || 0,
					is_like: isLikes[blog.id] || false,
					is_bookmark: isBookmarks[blog.id] || false
				})
			}
		}
		return result
	}

	// フォロー中ユーザーのブログデータ取得
	const getListForFollow = async () => {
		const filters = [
			["isPublished", "==", true]
		]
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "blog",
				searchConditions: {
					filters: filters,
					sorters: sorters,
					limit: 10
				}
			}
		)

		const result = []
		if (querySnapshot) {
			const blogList = querySnapshot.docs.map((doc) => {
				const data = { id: doc.id, ...doc.data() }
				if (data.createdAt?.toDate) {
					data.createdAt = data.createdAt.toDate()
				}
				return { ...data, rawDoc: doc }
			})
			const commentCounts = await commentStore.getCommentCounts(
				blogList.map((blog) => blog.id)
			)
			const likeCounts = await likeStore.getLikeCounts(
				blogList.map((blog) => blog.id)
			)
			// 結果を組み立てる
			for (const blog of blogList) {
				result.push({
					...blog,
					reply_count: 0, // 必要なら更新
					comment_count: commentCounts[blog.id] || 0,
					like_count: likeCounts[blog.id] || 0,
				})
			}
		}
		return result
	}

	// お気に入りのブログデータ取得
	const getListForBookmark = async () => {
		const result = []

		const blogIds = await bookmarkStore.getBlogIds()
		for (const blogId of blogIds) {
			result.push(await getDetail(blogId))
		}
		return result
	}

	// カテゴリーIDに一致するブログ数取得
	const getListForCategoryCount = async (category_id) => {
		const userInfo = authStore.userInfo
		const filters = [
			["uid", "==", userInfo.uid],
			["isPublished", "==", true]
		]
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "blog",
				searchConditions: {
					filters: filters,
					sorters: sorters,
					limit: 10
				}
			}
		)

		if (querySnapshot) {
			return querySnapshot.size
		} else {
			return 0
		}
	}

	return {
		selectType,
		blogList,
		blogDetail,
		tempBlog,
		setSelectType,
		create,
		update,
		getDetail,
		deleteItem,
		getList,
		getListForAll,
		getListForFollow,
		getListForBookmark,
		getListForCategoryCount
	}
})
