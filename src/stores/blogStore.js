import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useCommentStore } from '@/stores/commentStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useAccessLogStore } from '@/stores/accessLogStore'

export const useBlogStore = defineStore('blog', () => {
	const authStore = useAuthStore()
	const commentStore = useCommentStore()
	const likeStore = useLikeStore()
	const bookmarkStore = useBookmarkStore()
	const blogSettingStore = useBlogSettingStore()
	const followUsersStore = useFollowUsersStore()
	const accessLogStore = useAccessLogStore()

	const blogList = ref([])
	const blogDetail = ref({})
	const selectType = ref(0)
	const accessCounts = ref({})

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
		viewCount: 0,
		createdAt: null,
		updatedAt: null
	})

	const setSelectType = (type) => {
		selectType.value = type
	}

	const setBlogData = async (doc) => {
		const commentCount = await commentStore.getCommentCount(doc.id)
		const likeCount = await likeStore.getLikeCount(doc.id)
		const isLike = await likeStore.isLike(doc.id)
		const isBookmark = await bookmarkStore.isBookmark(doc.id)
		const viewCount = doc.data().viewCount || 0

		const data = {
			id: doc.id,
			viewCount: viewCount,
			comment_count: commentCount,
			like_count: likeCount,
			is_like: isLike,
			is_bookmark: isBookmark,
			setting: null,
			shareBlog: null,
			...doc.data()
		}
		data.setting = await blogSettingStore.getForUid(data.uid)

		if (data.createdAt?.toDate) {
			data.createdAt = data.createdAt.toDate()
		}
		return data
	}

	const create = async(blog) => {
		const userInfo = authStore.userInfo
		blog.uid = userInfo.uid
		blog.viewCount = 0
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
				viewCount: blog.viewCount,
				updatedAt: new Date(),
			}
		)
	}

	const getDetail = async (blog_id) => {
		const doc = await BaseAPI.getData(
			{db_name: "blog", item_id: blog_id},
		)

		if (doc) {
			blogDetail.value = await setBlogData(doc)

			// リブログがあれば取得
			if (blogDetail.value.share_blog_id) {
				const share_doc = await BaseAPI.getData(
					{db_name: "blog", item_id: blogDetail.value.share_blog_id},
				)
				if (share_doc) {
					blogDetail.value.shareBlog = await setBlogData(share_doc)
				}
			}
		}
	}

	// ブログ詳細表示時にアクセス数をカウント
	const getDetailWithAccessCount = async (blog_id) => {
		await getDetail(blog_id)
		
		// 公開されているブログの場合のみアクセス数をカウント
		if (blogDetail.value.isPublished) {
			blogDetail.value.viewCount ++ 
			await incrementAccessCount(blog_id)
		}
	}

	// ブログのアクセス数をインクリメント
	const incrementAccessCount = async (blog_id) => {
		try {
			const newCount = blogDetail.value.viewCount

			// アクセス数を更新
			await BaseAPI.setData(
				{ db_name: "blog", item_id: blog_id },
				{ viewCount: newCount }
			)
			// アクセスログを記録（オプション）
			await accessLogStore.create(blog_id)
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error.message}`)
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

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setBlogData(doc))
			const result = await Promise.all(promises)
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

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setBlogData(doc))
			const result = await Promise.all(promises)
			blogList.value = result
		}
	}

	// フォロー中ユーザーのブログデータ取得
	const getListForFollow = async () => {
		const userInfo = authStore.userInfo
		
		try {
			// ログイン中のユーザーがフォローしているユーザーリストを取得
			await followUsersStore.getListFollowers(userInfo.uid)
			const followerUserIds = followUsersStore.followersList
			
			// フォローしているユーザーがいない場合は空配列を返す
			if (followerUserIds.length === 0) {
				blogList.value = []
				return
			}
			
			// フォローしているユーザーのブログを取得
			const filters = [
				["isPublished", "==", true],
				["uid", "in", followerUserIds]
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
				const promises = querySnapshot.docs.map(doc => setBlogData(doc))
				const result = await Promise.all(promises)
				blogList.value = result
			}
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	// お気に入りのブログデータ取得
	const getListForBookmark = async () => {
		const blogIds = await bookmarkStore.getBlogIds()
		const detailPromises = blogIds.map(async (blogId) => {
			const doc = await BaseAPI.getData(
				{db_name: "blog", item_id: blogId},
			)
			if (doc) {
				return await setBlogData(doc)
			}
			return null
		})
		const result = await Promise.all(detailPromises)
		blogList.value = result.filter(item => item !== null)
	}

	// おすすめのブログデータ取得
	const getListForRecomend = async () => {
		const filters = [
			["isPublished", "==", true],
			["viewCount", ">", 0]
		]
		const sorters = [
			["viewCount", "desc"],
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
			const promises = querySnapshot.docs.map(doc => setBlogData(doc))
			const result = await Promise.all(promises)
			blogList.value = result
		}
	}

	// カテゴリーIDに一致するブログ数取得
	const getListForCategoryCount = async (category_id) => {
		const userInfo = authStore.userInfo
		const filters = [
			["uid", "==", userInfo.uid],
			["category_id", "==", category_id]
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
		return querySnapshot ? querySnapshot.size : 0
	}

	// ユーザーの全ブログのアクセス数合計を取得
	const getTotalAccessCount = async () => {
		const userInfo = authStore.userInfo

		try {
			const filters = [
				["uid", "==", userInfo.uid],
				["isPublished", "==", true]
			]
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "blog",
				searchConditions: {
					filters: filters,
				}
			})

			let totalCount = 0
			if (querySnapshot) {
				querySnapshot.docs.forEach(doc => {
					const data = doc.data()
					totalCount += data.viewCount || 0
				})
			}
			return totalCount
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	return {
		selectType,
		blogList,
		blogDetail,
		tempBlog,
		setSelectType,
		setBlogData,
		create,
		update,
		getDetail,
		getDetailWithAccessCount,
		incrementAccessCount,
		deleteItem,
		getList,
		getListForAll,
		getListForFollow,
		getListForBookmark,
		getListForRecomend,
		getListForCategoryCount,
		getTotalAccessCount
	}
})
