import BaseAPI from '@/api/base'
import { useBlogSettingStore } from '@/stores/blogSettingStore'

// 型定義
interface SearchResult {
	type: 'blog' | 'tweet' | 'moment' | 'user'
	id: string
	title?: string
	content?: string
	uid: string
	userName?: string
	userTitle?: string
	profileUrl?: string | null
	thumbUrl?: string | null
	createdAt?: Date | null
	[key: string]: any
}

export const useSearchStore = defineStore('search', () => {
	const blogSettingStore = useBlogSettingStore()
	
	const searchResults = ref<SearchResult[]>([])
	const isLoading = ref<boolean>(false)
	const searchQuery = ref<string>('')

	// 検索実行
	const search = async (query: string): Promise<void> => {
		if (!query.trim()) {
			searchResults.value = []
			return
		}

		isLoading.value = true
		searchQuery.value = query.trim()
		searchResults.value = []

		try {
			// 並列で検索を実行
			const [blogs, tweets, moments, users] = await Promise.all([
				searchBlogs(query),
				searchTweets(query),
				searchMoments(query),
				searchUsers(query)
			])

			// 結果を統合
			searchResults.value = [
				...blogs,
				...tweets,
				...moments,
				...users
			].sort((a, b) => {
				// 作成日時の降順でソート
				const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
				const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
				return dateB - dateA
			})
		} catch (error) {
			console.error('検索エラー:', error)
			searchResults.value = []
		} finally {
			isLoading.value = false
		}
	}

	// ブログ検索
	const searchBlogs = async (query: string): Promise<SearchResult[]> => {
		try {
			// 公開中のブログを取得
			const result = await BaseAPI.getDataWithQuery({
				db_name: 'blog',
				searchConditions: {
					filters: [['isPublished', '==', true]],
					sorters: [['createdAt', 'desc']],
					limit: 100
				}
			})

			if (!result) return []

			const blogs: SearchResult[] = []
			for (const doc of result.docs) {
				const data = doc.data()
				const title = data.title || ''
				const summary = data.summary || ''
				const content = data.content || ''
				
				// ユーザー情報を取得
				const userSetting = await blogSettingStore.getForUid(data.uid)
				const userName = userSetting?.name || ''
				const userDescription = userSetting?.description || ''
				
				// タイトル、概要、内容、アカウント名、アカウント紹介文に検索クエリが含まれているかチェック
				if (title.includes(query) || summary.includes(query) || content.includes(query) || 
				    userName.includes(query) || userDescription.includes(query)) {
					blogs.push({
						type: 'blog',
						id: doc.id,
						title: title,
						content: summary || content.substring(0, 100),
						uid: data.uid,
						userName: userName || '名無し',
						userTitle: userSetting?.title || '',
						profileUrl: userSetting?.profileUrl || null,
						thumbUrl: data.thumbUrl || null,
						createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
					})
				}
			}

			return blogs
		} catch (error) {
			console.error('ブログ検索エラー:', error)
			return []
		}
	}

	// つぶやき検索
	const searchTweets = async (query: string): Promise<SearchResult[]> => {
		try {
			// 公開中のつぶやきを取得
			const result = await BaseAPI.getDataWithQuery({
				db_name: 'tweet',
				searchConditions: {
					filters: [['isPublished', '==', true]],
					sorters: [['createdAt', 'desc']],
					limit: 100
				}
			})

			if (!result) return []

			const tweets: SearchResult[] = []
			for (const doc of result.docs) {
				const data = doc.data()
				const content = data.content || ''
				
				// ユーザー情報を取得
				const userSetting = await blogSettingStore.getForUid(data.uid)
				const userName = userSetting?.name || ''
				const userDescription = userSetting?.description || ''
				
				// 内容、アカウント名、アカウント紹介文に検索クエリが含まれているかチェック
				if (content.includes(query) || userName.includes(query) || userDescription.includes(query)) {
					tweets.push({
						type: 'tweet',
						id: doc.id,
						content: content.substring(0, 100),
						uid: data.uid,
						userName: userName || '名無し',
						userTitle: userSetting?.title || '',
						profileUrl: userSetting?.profileUrl || null,
						thumbUrl: data.thumbUrl || null,
						createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
					})
				}
			}

			return tweets
		} catch (error) {
			console.error('つぶやき検索エラー:', error)
			return []
		}
	}

	// モーメント検索
	const searchMoments = async (query: string): Promise<SearchResult[]> => {
		try {
			// 公開中のモーメントを取得
			const result = await BaseAPI.getDataWithQuery({
				db_name: 'moment',
				searchConditions: {
					filters: [['isPublished', '==', true]],
					sorters: [['createdAt', 'desc']],
					limit: 100
				}
			})

			if (!result) return []

			const moments: SearchResult[] = []
			for (const doc of result.docs) {
				const data = doc.data()
				const title = data.title || ''
				const description = data.description || ''
				
				// ユーザー情報を取得
				const userSetting = await blogSettingStore.getForUid(data.uid)
				const userName = userSetting?.name || ''
				const userDescription = userSetting?.description || ''
				
				// タイトル、説明、アカウント名、アカウント紹介文に検索クエリが含まれているかチェック
				if (title.includes(query) || description.includes(query) || 
				    userName.includes(query) || userDescription.includes(query)) {
					moments.push({
						type: 'moment',
						id: doc.id,
						title: title,
						content: description.substring(0, 100),
						uid: data.uid,
						userName: userName || '名無し',
						userTitle: userSetting?.title || '',
						profileUrl: userSetting?.profileUrl || null,
						thumbUrl: data.thumbUrl || null,
						createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
					})
				}
			}

			return moments
		} catch (error) {
			console.error('モーメント検索エラー:', error)
			return []
		}
	}

	// ユーザー検索（クリエイター名で検索）
	const searchUsers = async (query: string): Promise<SearchResult[]> => {
		try {
			// ブログ設定を全件取得（名前やタイトルで検索）
			const result = await BaseAPI.getDataWithQuery({
				db_name: 'blog_setting',
				searchConditions: {
					filters: [],
					limit: 100
				}
			})

			if (!result) return []

			const users: SearchResult[] = []
			for (const doc of result.docs) {
				const data = doc.data()
				const name = data.name || ''
				const title = data.title || ''
				
				// 名前やタイトルに検索クエリが含まれているかチェック
				if (name.includes(query) || title.includes(query)) {
					users.push({
						type: 'user',
						id: doc.id,
						title: title,
						userName: name,
						userTitle: title,
						profileUrl: data.profileUrl || null,
						uid: doc.id,
						createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
					})
				}
			}

			return users
		} catch (error) {
			console.error('ユーザー検索エラー:', error)
			return []
		}
	}

	// ブログ・つぶやき・モーメントのみを検索（BlogList用）
	const searchForBlogList = async (query: string): Promise<{
		blogIds: string[]
		tweetIds: string[]
		momentIds: string[]
	}> => {
		if (!query.trim()) {
			return { blogIds: [], tweetIds: [], momentIds: [] }
		}

		try {
			const [blogs, tweets, moments] = await Promise.all([
				searchBlogs(query),
				searchTweets(query),
				searchMoments(query)
			])

			return {
				blogIds: blogs.map(b => b.id),
				tweetIds: tweets.map(t => t.id),
				momentIds: moments.map(m => m.id)
			}
		} catch (error) {
			console.error('BlogList検索エラー:', error)
			return { blogIds: [], tweetIds: [], momentIds: [] }
		}
	}

	// ストアをクリア
	const clearStore = (): void => {
		searchResults.value = []
		searchQuery.value = ''
	}

	return {
		searchResults,
		isLoading,
		searchQuery,
		search,
		searchForBlogList,
		clearStore
	}
})

