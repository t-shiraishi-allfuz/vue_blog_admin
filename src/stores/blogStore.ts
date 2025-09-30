import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useCommentStore } from '@/stores/commentStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'
import { useAccessLogStore } from '@/stores/accessLogStore'

// 型定義
interface BlogData {
	id: string
	uid: string
	title: string
	summary: string
	content: string
	category_id: string | null
	isAdult: boolean
	isPublished: boolean
	thumbUrl: string | null
	share_blog_id: string | null
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
	comment_count: number
	like_count: number
	is_like: boolean
	is_bookmark: boolean
	setting: any
	shareBlog: BlogData | null
}

interface TempBlog {
	uid: string | null
	title: string
	summary: string
	content: string
	category_id: string | null
	isAdult: boolean
	isPublished: boolean
	thumbUrl: string | null
	share_blog_id: string | null
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
}

interface UserInfo {
	uid: string
	[key: string]: any
}

export const useBlogStore = defineStore('blog', () => {
	const authStore = useAuthStore()
	const commentStore = useCommentStore()
	const likeStore = useLikeStore()
	const bookmarkStore = useBookmarkStore()
	const blogSettingStore = useBlogSettingStore()
	const followUsersStore = useFollowUsersStore()
	const accessLogStore = useAccessLogStore()

	const blogList = ref<BlogData[]>([])
	const blogDetail = ref<BlogData>({} as BlogData)
	const selectType = ref<number>(0)
	const accessCounts = ref<Record<string, number>>({})

	const tempBlog = ref<TempBlog>({
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

	const setSelectType = (type: number): void => {
		selectType.value = type
	}

	const setBlogData = async (doc: any): Promise<BlogData> => {
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

	const create = async (blog: Partial<BlogData>): Promise<void> => {
		const userInfo = authStore.userInfo as UserInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		blog.uid = userInfo.uid
		blog.viewCount = 0
		blog.createdAt = new Date()
		blog.updatedAt = new Date()

		await BaseAPI.addData(
			{db_name: "blog"},
			blog
		)
	}

	const update = async (blog: BlogData): Promise<void> => {
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

	const getDetail = async (blog_id: string): Promise<void> => {
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
	const getDetailWithAccessCount = async (blog_id: string): Promise<void> => {
		await getDetail(blog_id)
		
		// 公開されているブログの場合のみアクセス数をカウント
		if (blogDetail.value.isPublished) {
			blogDetail.value.viewCount ++ 
			await incrementAccessCount(blog_id)
		}
	}

	// ブログのアクセス数をインクリメント
	const incrementAccessCount = async (blog_id: string): Promise<void> => {
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

	const deleteItem = async (blog_id: string): Promise<void> => {
		await BaseAPI.deleteData(
			{db_name: "blog", item_id: blog_id},
		)
	}

	// 自分のブログ一覧取得
	const getList = async (): Promise<void> => {
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
	const getListForAll = async (): Promise<void> => {
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
	const getListForFollow = async (): Promise<void> => {
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
	const getListForBookmark = async (): Promise<void> => {
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
	const getListForRecomend = async (): Promise<void> => {
		const userInfo = authStore.userInfo
		
		try {
			// 公開されているブログを取得（閲覧制限なし、自分のブログ以外）
			const filters = [
				["isPublished", "==", true],
				["isAdult", "==", false] // 閲覧制限がないブログのみ
			]
			
			// 自分のブログを除外するフィルター
			if (userInfo && userInfo.uid) {
				filters.push(["uid", "!=", userInfo.uid])
			}
			
			const sorters = [
				["createdAt", "desc"] // 作成日時の降順で取得
			]

			const querySnapshot = await BaseAPI.getDataWithQuery(
				{
					db_name: "blog",
					searchConditions: {
						filters: filters,
						sorters: sorters,
						limit: 50 // 多めに取得してクライアント側でソート
					}
				}
			)

			if (querySnapshot) {
				const promises = querySnapshot.docs.map(doc => setBlogData(doc))
				const result = await Promise.all(promises)
				
				// クライアント側でソート（いいね数降順、同数の場合はコメント数降順）
				const sortedResult = result.sort((a, b) => {
					// いいね数で比較
					if (a.like_count !== b.like_count) {
						return b.like_count - a.like_count
					}
					// いいね数が同じ場合はコメント数で比較
					return b.comment_count - a.comment_count
				})
				
				// 上位10件のみ返す
				blogList.value = sortedResult.slice(0, 10)
			}
		} catch (error) {
			console.error('おすすめブログ取得エラー:', error)
			blogList.value = []
		}
	}

	// カテゴリーIDに一致するブログ数取得
	const getListForCategoryCount = async (category_id: string): Promise<number> => {
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
	const getTotalAccessCount = async (): Promise<number> => {
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


	// 特定ユーザーの記事数を取得（公開中の記事のみ）
	const getCountForUser = async (userId: string): Promise<number> => {
		try {
			const param = {
				db_name: 'blog',
				searchConditions: {
					filters: [
						['uid', '==', userId],
						['isPublished', '==', true]
					]
				}
			}
			const result = await BaseAPI.getDataWithQuery(param)
			return result.size
		} catch (error) {
			console.error('ユーザー記事数の取得に失敗しました:', error)
			return 0
		}
	}

	// 特定ユーザーの記事一覧を取得（公開中の記事のみ）
	const getListForUser = async (userId: string): Promise<BlogData[]> => {
		try {
			const param = {
				db_name: 'blog',
				searchConditions: {
					filters: [
						['uid', '==', userId],
						['isPublished', '==', true]
					],
					sorters: [['createdAt', 'desc']],
					limit: 20
				}
			}
			const result = await BaseAPI.getDataWithQuery(param)
			
			if (result) {
				const promises = result.docs.map(doc => setBlogData(doc))
				const blogs = await Promise.all(promises)
				return blogs
			}
			
			return []
		} catch (error) {
			console.error('ユーザー記事一覧の取得に失敗しました:', error)
			return []
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
		getTotalAccessCount,
		getCountForUser,
		getListForUser
	}
})
