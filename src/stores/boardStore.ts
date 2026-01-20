import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'

// 型定義
interface BoardPostData {
	id?: string
	uid: string
	type: 'article' | 'chat'
	title?: string
	content: string
	blogId?: string | null
	blogUrl?: string | null
	createdAt: Date | null
	updatedAt: Date | null
	userName?: string
	userProfileUrl?: string | null
	[key: string]: any
}

interface CreateBoardPostData {
	type: 'article' | 'chat'
	title?: string
	content: string
	blogId?: string | null
	blogUrl?: string | null
}

export const useBoardStore = defineStore('board', () => {
	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()

	const articlePosts = ref<BoardPostData[]>([])
	const chatPosts = ref<BoardPostData[]>([])
	const isLoading = ref<boolean>(false)

	// 記事紹介投稿を作成
	const createArticlePost = async (data: CreateBoardPostData): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		if (!data.title || !data.content) {
			throw new Error('タイトルと内容は必須です')
		}

		const postData: BoardPostData = {
			uid: userInfo.uid,
			type: 'article',
			title: data.title,
			content: data.content,
			blogId: data.blogId || null,
			blogUrl: data.blogUrl || null,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		await BaseAPI.addData(
			{ db_name: 'board_posts' },
			postData
		)

		// リストを再取得
		await getArticlePosts()
	}

	// 雑談投稿を作成
	const createChatPost = async (content: string): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		if (!content || content.trim() === '') {
			throw new Error('内容を入力してください')
		}

		const postData: BoardPostData = {
			uid: userInfo.uid,
			type: 'chat',
			content: content.trim(),
			createdAt: new Date(),
			updatedAt: new Date()
		}

		await BaseAPI.addData(
			{ db_name: 'board_posts' },
			postData
		)

		// リストを再取得
		await getChatPosts()
	}

	// 記事紹介投稿を取得
	const getArticlePosts = async (): Promise<void> => {
		try {
			isLoading.value = true
			
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: 'board_posts',
				searchConditions: {
					filters: [['type', '==', 'article']],
					sorters: [['createdAt', 'desc']],
					limit: 100
				}
			})

			if (!querySnapshot) {
				articlePosts.value = []
				return
			}

			const posts: BoardPostData[] = []
			for (const doc of querySnapshot.docs) {
				const data = doc.data()
				const post: BoardPostData = {
					id: doc.id,
					uid: data.uid,
					type: 'article',
					title: data.title || '',
					content: data.content || '',
					blogId: data.blogId || null,
					blogUrl: data.blogUrl || null,
					createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
					updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : null)
				}

				// ユーザー情報を取得
				try {
					const userSetting = await blogSettingStore.getForUid(post.uid)
					if (userSetting) {
						post.userName = userSetting.name || userSetting.title || '名無し'
						post.userProfileUrl = userSetting.profileUrl || null
					} else {
						// ユーザー設定が取得できない場合のデフォルト値
						post.userName = '名無し'
						post.userProfileUrl = null
					}
				} catch (error) {
					console.error(`ユーザー情報取得エラー (uid: ${post.uid}):`, error)
					// エラー時もデフォルト値を設定
					post.userName = '名無し'
					post.userProfileUrl = null
				}

				posts.push(post)
			}

			articlePosts.value = posts
		} catch (error: any) {
			console.error('記事紹介投稿の取得エラー:', error)
			throw new Error(`記事紹介投稿の取得に失敗しました: ${error.message}`)
		} finally {
			isLoading.value = false
		}
	}

	// 雑談投稿を取得
	const getChatPosts = async (): Promise<void> => {
		try {
			isLoading.value = true
			
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: 'board_posts',
				searchConditions: {
					filters: [['type', '==', 'chat']],
					sorters: [['createdAt', 'desc']],
					limit: 100
				}
			})

			if (!querySnapshot) {
				chatPosts.value = []
				return
			}

			const posts: BoardPostData[] = []
			for (const doc of querySnapshot.docs) {
				const data = doc.data()
				const post: BoardPostData = {
					id: doc.id,
					uid: data.uid,
					type: 'chat',
					content: data.content || '',
					createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
					updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : null)
				}

				// ユーザー情報を取得
				try {
					const userSetting = await blogSettingStore.getForUid(post.uid)
					if (userSetting) {
						post.userName = userSetting.name || userSetting.title || '名無し'
						post.userProfileUrl = userSetting.profileUrl || null
					} else {
						// ユーザー設定が取得できない場合のデフォルト値
						post.userName = '名無し'
						post.userProfileUrl = null
					}
				} catch (error) {
					console.error(`ユーザー情報取得エラー (uid: ${post.uid}):`, error)
					// エラー時もデフォルト値を設定
					post.userName = '名無し'
					post.userProfileUrl = null
				}

				posts.push(post)
			}

			chatPosts.value = posts
		} catch (error: any) {
			console.error('雑談投稿の取得エラー:', error)
			throw new Error(`雑談投稿の取得に失敗しました: ${error.message}`)
		} finally {
			isLoading.value = false
		}
	}

	// 投稿を削除
	const deletePost = async (postId: string, type: 'article' | 'chat'): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		// 投稿を取得して所有者を確認
		const doc = await BaseAPI.getData({
			db_name: 'board_posts',
			item_id: postId
		})

		if (!doc || !doc.exists()) {
			throw new Error('投稿が見つかりません')
		}

		const postData = doc.data()
		if (postData.uid !== userInfo.uid) {
			throw new Error('この投稿を削除する権限がありません')
		}

		await BaseAPI.deleteData({
			db_name: 'board_posts',
			item_id: postId
		})

		// リストを再取得
		if (type === 'article') {
			await getArticlePosts()
		} else {
			await getChatPosts()
		}
	}

	// ストアをクリア
	const clearStore = (): void => {
		articlePosts.value = []
		chatPosts.value = []
		isLoading.value = false
	}

	return {
		articlePosts,
		chatPosts,
		isLoading,
		createArticlePost,
		createChatPost,
		getArticlePosts,
		getChatPosts,
		deletePost,
		clearStore
	}
})

