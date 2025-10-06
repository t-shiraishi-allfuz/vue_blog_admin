import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useLikeStore } from '@/stores/likeStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'
import { useAccessLogStore } from '@/stores/accessLogStore'

// 型定義
interface TweetData {
	id: string
	uid: string
	content: string
	thumbUrl: string
	isPublished: boolean
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
	like_count: number
	is_like: boolean
	setting: any
}

interface TempTweet {
	uid: string | null
	content: string
	thumbUrl: string
	isPublished: boolean
	viewCount: number
	createdAt: Date | null
	updatedAt: Date | null
}

interface UserInfo {
	uid: string
	[key: string]: any
}

export const useTweetStore = defineStore('tweet', () => {
	const authStore = useAuthStore()
	const likeStore = useLikeStore()
	const blogSettingStore = useBlogSettingStore()
	const accessLogStore = useAccessLogStore()

	const tweetList = ref<TweetData[]>([])
	const tweetDetail = ref<TweetData>({} as TweetData)
	const selectType = ref<number>(0)

	const tempTweet = ref<TempTweet>({
		uid: null,
		content: "",
		thumbUrl: "",
		isPublished: false,
		viewCount: 0,
		createdAt: null,
		updatedAt: null
	})

	const setSelectType = (type: number): void => {
		selectType.value = type
	}

	const setTweetData = async (doc: any): Promise<TweetData> => {
		const likeCount = await likeStore.getLikeCount(doc.id)
		const isLike = await likeStore.isLike(doc.id)
		const viewCount = doc.data().viewCount || 0

		const docData = doc.data()
		// 不要なプロパティを除外
		const { shareBlog, share_blog_id, title, summary, category_id, isAdult, comment_count, is_bookmark, ...cleanDocData } = docData
		
		const data: TweetData = {
			id: doc.id,
			uid: cleanDocData.uid,
			content: cleanDocData.content,
			thumbUrl: cleanDocData.thumbUrl,
			isPublished: cleanDocData.isPublished,
			viewCount: viewCount,
			createdAt: cleanDocData.createdAt,
			updatedAt: cleanDocData.updatedAt,
			like_count: likeCount,
			is_like: isLike,
			setting: null
		}
		try {
			data.setting = await blogSettingStore.getForUid(data.uid)
			// settingが取得できない場合はデフォルト値を設定
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
			// エラーの場合もデフォルト値を設定
			data.setting = {
				name: 'ユーザー名不明',
				profileUrl: '/default-avatar.png',
				is_follower: false,
				is_following: false
			}
		}

		if (data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt) {
			data.createdAt = (data.createdAt as any).toDate()
		}
		if (data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt) {
			data.updatedAt = (data.updatedAt as any).toDate()
		}
		
		// shareBlogプロパティを完全に除外して返す
		const { shareBlog: _, ...cleanData } = data as any
		return cleanData as TweetData
	}

	const create = async (tweet: Partial<TweetData>): Promise<void> => {
		const userInfo = authStore.userInfo as UserInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		tweet.uid = userInfo.uid
		tweet.viewCount = 0
		tweet.createdAt = new Date()
		tweet.updatedAt = new Date()

		await BaseAPI.addData(
			{db_name: "tweet"},
			tweet
		)
	}

	const update = async (tweet: TweetData): Promise<void> => {
		await BaseAPI.setData(
			{db_name: "tweet", item_id: tweet.id},
			{
				content: tweet.content,
				thumbUrl: tweet.thumbUrl,
				isPublished: tweet.isPublished,
				viewCount: tweet.viewCount || 0,
				updatedAt: new Date(),
			}
		)
	}

	const getDetail = async (tweet_id: string): Promise<void> => {
		const doc = await BaseAPI.getData(
			{db_name: "tweet", item_id: tweet_id},
		)

		if (doc) {
			tweetDetail.value = await setTweetData(doc)
		}
	}

	// つぶやき詳細表示時にアクセス数をカウント
	const getDetailWithAccessCount = async (tweet_id: string): Promise<void> => {
		await getDetail(tweet_id)
		
		// 公開されているつぶやきの場合のみアクセス数をカウント
		if (tweetDetail.value.isPublished) {
			tweetDetail.value.viewCount ++ 
			await incrementAccessCount(tweet_id)
		}
	}

	// つぶやきのアクセス数をインクリメント
	const incrementAccessCount = async (tweet_id: string): Promise<void> => {
		try {
			const newCount = tweetDetail.value.viewCount

			// アクセス数を更新
			await BaseAPI.setData(
				{ db_name: "tweet", item_id: tweet_id },
				{ viewCount: newCount }
			)
			// つぶやきのアクセスログを記録
			await accessLogStore.createTweetAccessLog(tweet_id)
		} catch (error) {
			throw new Error(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`)
		}
	}

	const deleteItem = async (tweet_id: string): Promise<void> => {
		await BaseAPI.deleteData(
			{db_name: "tweet", item_id: tweet_id},
		)
	}

	// 自分のつぶやき一覧取得
	const getList = async (): Promise<void> => {
		const userInfo = authStore.userInfo
		if (!userInfo?.uid) {
			throw new Error('ユーザー情報が取得できません')
		}
		const filters = [
			["uid", "==", userInfo.uid]
		]
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "tweet",
				searchConditions: {
					filters: filters,
					sorters: sorters,
				}
			}
		)

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setTweetData(doc))
			const result = await Promise.all(promises)
			tweetList.value = result
		}
	}

	// 全ユーザーのつぶやきデータ取得
	const getListForAll = async (): Promise<void> => {
		const filters = [
			["isPublished", "==", true]
		]
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "tweet",
				searchConditions: {
					filters: filters,
					sorters: sorters,
					limit: 20
				}
			}
		)

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setTweetData(doc))
			const result = await Promise.all(promises)
			tweetList.value = result
		}
	}

	// 特定ユーザーのつぶやき数を取得（公開中のつぶやきのみ）
	const getCountForUser = async (userId: string): Promise<number> => {
		try {
			const param = {
				db_name: 'tweet',
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
			console.error('ユーザーつぶやき数の取得に失敗しました:', error)
			return 0
		}
	}

	// 特定ユーザーのつぶやき一覧を取得（公開中のつぶやきのみ）
	const getListForUser = async (userId: string): Promise<TweetData[]> => {
		try {
			const param = {
				db_name: 'tweet',
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
				const promises = result.docs.map(doc => setTweetData(doc))
				const tweets = await Promise.all(promises)
				return tweets
			}
			
			return []
		} catch (error) {
			console.error('ユーザーつぶやき一覧の取得に失敗しました:', error)
			return []
		}
	}

	// 管理画面用：全ユーザーのつぶやき一覧取得（下書き・公開済み両方）
	const getPublishedListForAdmin = async (): Promise<void> => {
		const sorters = [
			["createdAt", "desc"]
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "tweet",
				searchConditions: {
					filters: [], // フィルターを削除して全てのつぶやきを取得
					sorters: sorters,
				}
			}
		)

		if (querySnapshot) {
			const promises = querySnapshot.docs.map(doc => setTweetData(doc))
			const result = await Promise.all(promises)
			tweetList.value = result
		}
	}

	return {
		selectType,
		tweetList,
		tweetDetail,
		tempTweet,
		setSelectType,
		setTweetData,
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
		getPublishedListForAdmin
	}
})
