import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/setting/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { useAuthStore } from '@/stores/authStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'

// 型定義
interface BlogSettingData {
	id?: string
	title: string
	description: string
	name: string
	profileUrl: string | null
	is_follower: boolean
	is_following: boolean
	createdAt: Date | null
	updatedAt: Date | null
	[key: string]: any
}

interface TempSettingData {
	title: string
	description: string
	name: string
	profileUrl: string | null
	is_follower: boolean
	is_following: boolean
	createdAt: Date | null
	updatedAt: Date | null
}

interface UpdateData {
	title: string
	description: string
	name: string
	profileUrl?: string
	[key: string]: any
}

export const useBlogSettingStore = defineStore('blogSetting', () => {
	const tempSetting = ref<TempSettingData>({
		title: "仮タイトル",
		description: "仮説明",
		name: "名無しさん",
		profileUrl: null,
		is_follower: false,
		is_following: false,
		createdAt: null,
		updatedAt: null,
	})

	const blogSetting = ref<BlogSettingData | null>(null)

	const authStore = useAuthStore()
	const followUsersStore = useFollowUsersStore()

	const setBlogSetting = (setting: Partial<TempSettingData>): TempSettingData => {
		return tempSetting.value = { ...tempSetting.value, ...setting }
	}

	const getBlogSetting = (): BlogSettingData | null => {
		return blogSetting.value
	}

	const create = async (): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		if (!userInfo) {
			throw new Error('ユーザー情報が取得できません')
		}

		const settingData: BlogSettingData = {
			...tempSetting.value,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		blogSetting.value = settingData

		await BaseAPI.setData(
			{db_name: "blog_setting", item_id: userInfo.uid},
			settingData
		)
	}

	// プロフィール画像アップロード
	const uploadProfileImage = async (image: any): Promise<string | null> => {
		try {
			// 画像が存在しない場合はnullを返す
			if (!image || !image.value) {
				return null
			}

			const userInfo = authStore.getUserInfo()
			
			// ユーザー情報が存在しない場合はエラー
			if (!userInfo || !userInfo.uid) {
				throw new Error('ユーザー情報が取得できません')
			}

			// ファイル名にタイムスタンプを追加して重複を防ぐ
			const timestamp = Date.now()
			const fileName = `${timestamp}_${image.value.name}`
			const storagePath = `profile_images/${userInfo.uid}/${fileName}`
			const fileRef = storageRef(storage, storagePath)

			// Firebase Storageに画像をアップロード
			await uploadBytes(fileRef, image.value)
			return await getDownloadURL(fileRef)
		} catch (error: any) {
			console.error('プロフィール画像アップロードエラー:', error)
			throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
		}
	}

	const update = async (image: any, data: UpdateData): Promise<void> => {
		try {
			const userInfo = authStore.getUserInfo()
			
			// ユーザー情報が存在しない場合はエラー
			if (!userInfo || !userInfo.uid) {
				throw new Error('ユーザー情報が取得できません')
			}

			// データのコピーを作成して更新日時を設定
			const updateData = { ...data }
			updateData.updatedAt = new Date()

			// プロフィール画像のアップロード
			const imageUrl = await uploadProfileImage(image)
			if (imageUrl) {
				updateData.profileUrl = imageUrl
			}

			// タイトル重複チェック（現在のユーザー以外で同じタイトルがないか確認）
			const isUnique = await isTitleUnique(userInfo.uid, updateData.title)
			if (!isUnique) {
				throw new Error("このブログタイトルは既に使用されています")
			}

			// Firestoreにデータを保存
			await BaseAPI.setData(
				{db_name: "blog_setting", item_id: userInfo.uid},
				updateData
			)
			
			// ローカルの状態を更新
			blogSetting.value = updateData as BlogSettingData
			
		} catch (error: any) {
			console.error('ブログ設定更新エラー:', error)
			throw error
		}
	}

	const getDetail = async (): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は処理を中断
		if (!userInfo || !userInfo.uid) {
			blogSetting.value = null
			return
		}

		const doc = await BaseAPI.getData(
			{
				db_name: "blog_setting",
				item_id: userInfo.uid
			},
		)
		if (doc) {
			blogSetting.value = doc.data() as BlogSettingData
		}
	}

	const getForUids = async (uids: string[]): Promise<Record<string, any>> => {
		const promises = uids.map((id: string) => getForUid(id))
		const results = await Promise.all(promises)
		const userIds: Record<string, any> = {}
		uids.forEach((id: string, index: number) => {
			userIds[id] = results[index]
		})
		return userIds
	}

	const getForUid = async (uid: string): Promise<any> => {
		const doc = await BaseAPI.getData(
			{db_name: "blog_setting", item_id: uid},
		)

		if (!doc) return null

		const setting = doc.data()
		setting.is_follower = await followUsersStore.isFollower(uid)
		setting.is_following = await followUsersStore.isFollowing(uid)
		return setting
	}

	// タイトルの重複チェック
	const isTitleUnique = async (uid: string, title: string): Promise<boolean> => {
		try {
			const filters = [
				["title", "==", title],
			]

			const querySnapshot = await BaseAPI.getDataWithQuery(
				{
					db_name: "blog_setting",
					searchConditions: {
						filters: filters,
					}
				}
			)
			
			// 現在のユーザー以外で同じタイトルを使用しているドキュメントをフィルタ
			const duplicateDocs = querySnapshot.docs.filter(doc => doc.id !== uid)
			
			// 重複がない場合はtrue（ユニーク）、重複がある場合はfalse
			return duplicateDocs.length === 0
		} catch (error: any) {
			console.error('タイトル重複チェックエラー:', error)
			// エラーの場合は安全のためfalseを返す（重複ありとみなす）
			return false
		}
	}

	// ストアをクリアする関数
	const clearStore = (): void => {
		blogSetting.value = null
		tempSetting.value = {
			title: "仮タイトル",
			description: "仮説明",
			name: "名無しさん",
			profileUrl: null,
			is_follower: false,
			is_following: false,
			createdAt: null,
			updatedAt: null,
		}
	}

	return {
		tempSetting,
		blogSetting,
		setBlogSetting,
		getBlogSetting,
		create,
		uploadProfileImage,
		update,
		getDetail,
		getForUids,
		getForUid,
		isTitleUnique,
		clearStore
	}
})
