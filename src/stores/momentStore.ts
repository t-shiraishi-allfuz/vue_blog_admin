import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useTweetStore } from '@/stores/tweetStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'

// 型定義
interface MomentData {
	id: string
	uid: string
	title: string
	description: string
	thumbUrl: string
	tweetIds: string[]
	tweets: any[] // TweetDataの配列
	isAdult: boolean
	isPublished: boolean
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
	setting: any
	like_count: number
	is_like: boolean
	is_bookmark: boolean
	password: string | null
}

interface TempMoment {
	uid: string | null
	title: string
	description: string
	thumbUrl: string
	tweetIds: string[]
	isAdult: boolean
	isPublished: boolean
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
	password: string | null
}

interface UserInfo {
	uid: string
	[key: string]: any
}

export const useMomentStore = defineStore('moment', () => {
	const authStore = useAuthStore()
	const tweetStore = useTweetStore()
	const likeStore = useLikeStore()
	const bookmarkStore = useBookmarkStore()

	const momentList = ref<MomentData[]>([])
	const momentDetail = ref<MomentData>({} as MomentData)

	const tempMoment = ref<TempMoment>({
		uid: null,
		title: "",
		description: "",
		thumbUrl: "",
		tweetIds: [],
		isAdult: false,
		isPublished: false,
		viewCount: 0,
		createdAt: null,
		updatedAt: null,
		password: null
	})

	const setMomentData = async (doc: any): Promise<MomentData> => {
		const docData = doc.data()
		
		// いいね・ブックマーク情報を取得
		const likeCount = await likeStore.getMomentLikeCount(doc.id)
		const isLike = await likeStore.isMomentLike(doc.id)
		const isBookmark = await bookmarkStore.isMomentBookmark(doc.id)
		
		const data: MomentData = {
			id: doc.id,
			uid: docData.uid,
			title: docData.title,
			description: docData.description,
			thumbUrl: docData.thumbUrl || '',
			tweetIds: docData.tweetIds || [],
			tweets: [],
			isAdult: docData.isAdult || false,
			isPublished: docData.isPublished,
			viewCount: docData.viewCount || 0,
			createdAt: docData.createdAt,
			updatedAt: docData.updatedAt,
			setting: null,
			like_count: likeCount,
			is_like: isLike,
			is_bookmark: !!isBookmark,
			password: docData.password || null
		}

		// つぶやきデータを取得
		if (data.tweetIds && data.tweetIds.length > 0) {
			try {
				const tweetPromises = data.tweetIds.map(async (tweetId: string) => {
					try {
						await tweetStore.getDetail(tweetId)
						return tweetStore.tweetDetail
					} catch (error) {
						console.error(`つぶやき ${tweetId} の取得に失敗:`, error)
						return null
					}
				})
				
				const tweets = await Promise.all(tweetPromises)
				data.tweets = tweets.filter(tweet => tweet !== null)
			} catch (error) {
				console.error('つぶやきデータの取得に失敗しました:', error)
				data.tweets = []
			}
		}

		// ユーザー設定を取得
		try {
			const { useBlogSettingStore } = await import('@/stores/blogSettingStore')
			const blogSettingStore = useBlogSettingStore()
			data.setting = await blogSettingStore.getForUid(data.uid)
			
			if (!data.setting) {
				data.setting = {
					name: 'ユーザー名不明',
					profileUrl: '/default-avatar.png',
					is_follower: false,
					is_following: false
				}
			}
		} catch (error) {
			console.error('ユーザー設定の取得に失敗しました:', error)
			data.setting = {
				name: 'ユーザー名不明',
				profileUrl: '/default-avatar.png',
				is_follower: false,
				is_following: false
			}
		}

		// 日付の変換
		if (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt) {
			data.createdAt = (data.createdAt as any).toDate()
		}
		if (data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt) {
			data.updatedAt = (data.updatedAt as any).toDate()
		}

		return data
	}

	const create = async (moment: Partial<MomentData>): Promise<void> => {
		const userInfo = authStore.userInfo as UserInfo
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		moment.uid = userInfo.uid
		moment.viewCount = 0
		moment.createdAt = new Date()
		moment.updatedAt = new Date()

		await BaseAPI.addData(
			{db_name: "moment"},
			moment
		)
	}

	const update = async (moment: MomentData): Promise<void> => {
		await BaseAPI.setData(
			{db_name: "moment", item_id: moment.id},
			{
				title: moment.title,
				description: moment.description,
				thumbUrl: moment.thumbUrl,
				tweetIds: moment.tweetIds,
				isAdult: moment.isAdult,
				isPublished: moment.isPublished,
				viewCount: moment.viewCount || 0,
				password: moment.password,
				updatedAt: new Date(),
			}
		)
	}

	const getDetail = async (moment_id: string): Promise<void> => {
		const doc = await BaseAPI.getData(
			{db_name: "moment", item_id: moment_id},
		)

		if (doc) {
			momentDetail.value = await setMomentData(doc)
		}
	}

	// モーメント詳細表示時にアクセス数をカウント
	const getDetailWithAccessCount = async (moment_id: string): Promise<void> => {
		await getDetail(moment_id)
		
		// 公開されているモーメントの場合のみアクセス数をカウント
		if (momentDetail.value.isPublished) {
			momentDetail.value.viewCount++
			await incrementAccessCount(moment_id)
		}
	}

	// モーメントのアクセス数をインクリメント
	const incrementAccessCount = async (moment_id: string): Promise<void> => {
		try {
			const newCount = momentDetail.value.viewCount

			await BaseAPI.setData(
				{ db_name: "moment", item_id: moment_id },
				{ viewCount: newCount }
			)
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
		}
	}

	const deleteItem = async (moment_id: string): Promise<void> => {
		await BaseAPI.deleteData(
			{db_name: "moment", item_id: moment_id},
		)
	}

	// 自分のモーメント一覧取得
	const getList = async (): Promise<void> => {
		const userInfo = authStore.userInfo
		if (!userInfo?.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		const filters = [
			["uid", "==", userInfo.uid]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "moment",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setMomentData(doc))
			const result = await Promise.all(promises)
			// クライアント側でソート
			momentList.value = result.sort((a, b) => {
				const dateA = new Date(a.createdAt || 0).getTime()
				const dateB = new Date(b.createdAt || 0).getTime()
				return dateB - dateA // 降順
			})
		}
	}

	// 全ユーザーのモーメントデータ取得（公開中のみ）
	const getListForAll = async (): Promise<void> => {
		const filters = [
			["isPublished", "==", true]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "moment",
				searchConditions: {
					filters: filters,
					limit: 20
				}
			}
		)

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setMomentData(doc))
			const result = await Promise.all(promises)
			// クライアント側でソート
			momentList.value = result.sort((a, b) => {
				const dateA = new Date(a.createdAt || 0).getTime()
				const dateB = new Date(b.createdAt || 0).getTime()
				return dateB - dateA // 降順
			})
		}
	}

	// 管理画面用：全ユーザーのモーメント一覧取得（下書き・公開済み両方）
	const getPublishedListForAdmin = async (): Promise<void> => {
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "moment",
				searchConditions: {
					filters: [],
				}
			}
		)

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setMomentData(doc))
			const result = await Promise.all(promises)
			// クライアント側でソート
			momentList.value = result.sort((a, b) => {
				const dateA = new Date(a.createdAt || 0).getTime()
				const dateB = new Date(b.createdAt || 0).getTime()
				return dateB - dateA // 降順
			})
		}
	}

	// 特定ユーザーのモーメント数を取得（公開中のモーメントのみ）
	const getCountForUser = async (userId: string): Promise<number> => {
		try {
			const param = {
				db_name: 'moment',
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
			console.error('ユーザーモーメント数の取得に失敗しました:', error)
			return 0
		}
	}

	// 特定ユーザーのモーメント一覧を取得（公開中のモーメントのみ）
	const getListForUser = async (userId: string): Promise<MomentData[]> => {
		try {
			const param = {
				db_name: 'moment',
				searchConditions: {
					filters: [
						['uid', '==', userId],
						['isPublished', '==', true]
					],
					limit: 20
				}
			}
			const result = await BaseAPI.getDataWithQuery(param)
			
			if (result) {
				const promises = result.docs.map(doc => setMomentData(doc))
				const moments = await Promise.all(promises)
				// クライアント側でソート
				return moments.sort((a, b) => {
					const dateA = new Date(a.createdAt || 0).getTime()
					const dateB = new Date(b.createdAt || 0).getTime()
					return dateB - dateA // 降順
				})
			}
			
			return []
		} catch (error) {
			console.error('ユーザーモーメント一覧の取得に失敗しました:', error)
			return []
		}
	}

	// モーメントにいいねを追加/削除
	const toggleLike = async (moment: MomentData): Promise<void> => {
		try {
			if (moment.is_like) {
				await likeStore.deleteMomentLike(moment.id)
				moment.is_like = false
				moment.like_count--
			} else {
				await likeStore.addMomentLike(moment.id, moment.title, moment.uid)
				moment.is_like = true
				moment.like_count++
			}
		} catch (error) {
			console.error('モーメントいいね操作エラー:', error)
			throw new Error('いいねの操作に失敗しました')
		}
	}

	// モーメントをブックマークに追加/削除
	const toggleBookmark = async (moment: MomentData): Promise<void> => {
		try {
			if (moment.is_bookmark) {
				await bookmarkStore.deleteMomentBookmark(moment.id)
				moment.is_bookmark = false
			} else {
				await bookmarkStore.addMomentBookmark(moment.id)
				moment.is_bookmark = true
			}
		} catch (error) {
			console.error('モーメントブックマーク操作エラー:', error)
			throw new Error('ブックマークの操作に失敗しました')
		}
	}

	// モーメント詳細を初期化（新規作成用）
	const initializeMomentDetail = (): void => {
		momentDetail.value = {
			id: '',
			uid: authStore.userInfo?.uid || '',
			title: '',
			description: '',
			thumbUrl: '',
			tweetIds: [],
			tweets: [],
			isAdult: false,
			isPublished: false,
			viewCount: 0,
			createdAt: null,
			updatedAt: null,
			setting: null,
			like_count: 0,
			is_like: false,
			is_bookmark: false,
			password: null
		}
	}

	// パスワード認証
	const verifyPassword = async (momentId: string, password: string): Promise<boolean> => {
		try {
			const doc = await BaseAPI.getData(
				{db_name: "moment", item_id: momentId},
			)
			
			if (doc) {
				const momentData = doc.data()
				// パスワードが設定されていない場合は認証成功
				if (!momentData.password) return true
				// パスワードが一致する場合は認証成功
				return momentData.password === password
			}
			
			return false
		} catch (error) {
			console.error('パスワード認証エラー:', error)
			return false
		}
	}

	return {
		momentList,
		momentDetail,
		tempMoment,
		setMomentData,
		create,
		update,
		getDetail,
		getDetailWithAccessCount,
		incrementAccessCount,
		deleteItem,
		getList,
		getListForAll,
		getCountForUser,
		getListForUser,
		getPublishedListForAdmin,
		toggleLike,
		toggleBookmark,
		initializeMomentDetail,
		verifyPassword
	}
})
