import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/setting/firebase'
import {
	getDownloadURL,
	ref as storageRef,
	uploadBytes,
	deleteObject
} from 'firebase/storage'
import { useAuthStore } from '@/stores/authStore'

export const useImagesStore = defineStore('images', () => {
	const authStore = useAuthStore()
	const imageList = ref<any[]>([])

	const create = async (file: File, folder_id: string | null) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		// 画像をstorageに保存
		const storagePath = `images/${userInfo.uid}/${file.name}`
		const fileRef = storageRef(storage, storagePath)
		await uploadBytes(fileRef, file)
		const url = await getDownloadURL(fileRef)

		await BaseAPI.addData(
			{db_name: "images"},
			{
				uid: userInfo.uid,
				name: file.name,
				url: url,
				folder_id: folder_id != null ? folder_id : null,
				uploadedAt: new Date()
			}
		)
		
		// URLを返す
		return { url }
	}

	const update = async (file: any, folder_id: string | null) => {
		await BaseAPI.setData(
			{db_name: "images", item_id: file.id},
			{
				folder_id: folder_id != null ? folder_id : null,
				uploadedAt: new Date()
			}
		)
	}

	const getList = async (folder_id: string | null): Promise<any[]> => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合は空配列を返す
		if (!userInfo || !userInfo.uid) {
			imageList.value = []
			return []
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
		]
		if (folder_id != null) {
			filters.push(["folder_id", "==", folder_id])
		}

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "images",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (!querySnapshot) return []

		const images = querySnapshot.docs.map((doc) => {
			const data = { id: doc.id, ...doc.data() }
			return data
		})

		// 各画像の使用状況をチェック（最適化版）
		const imagesWithUsage = await checkImagesUsageBatch(images)
		
		imageList.value = imagesWithUsage
		return imageList.value
	}

	// 複数画像の使用状況をバッチでチェックする関数（最適化版）
	const checkImagesUsageBatch = async (images: any[]) => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid || images.length === 0) {
			return images.map(image => ({
				...image,
				isUsedAsThumbnail: false,
				usedInBlogs: [],
				usedInMoments: []
			}))
		}

		try {
			// すべての画像URLを取得
			const imageUrls = images.map(img => img.url)
			
			// FirestoreのIN演算子は最大30個までなので、チャンクに分割
			const chunkSize = 30
			const urlChunks = []
			for (let i = 0; i < imageUrls.length; i += chunkSize) {
				urlChunks.push(imageUrls.slice(i, i + chunkSize))
			}

			// 各チャンクに対してクエリを実行
			const blogUsageMap = new Map<string, string[]>()
			const momentUsageMap = new Map<string, string[]>()

			// ブログでの使用状況をチャンクごとにチェック
			for (const urlChunk of urlChunks) {
				const blogFilters = [
					["uid", "==", userInfo.uid],
					["thumbUrl", "in", urlChunk]
				]
				const blogSnapshot = await BaseAPI.getDataWithQuery({
					db_name: "blogs",
					searchConditions: {
						filters: blogFilters,
					}
				})

				if (blogSnapshot) {
					blogSnapshot.docs.forEach(doc => {
						const thumbUrl = doc.data().thumbUrl
						if (!blogUsageMap.has(thumbUrl)) {
							blogUsageMap.set(thumbUrl, [])
						}
						blogUsageMap.get(thumbUrl)!.push(doc.id)
					})
				}
			}

			// つぶやき（moments）での使用状況をチャンクごとにチェック
			for (const urlChunk of urlChunks) {
				const momentFilters = [
					["uid", "==", userInfo.uid],
					["thumbUrl", "in", urlChunk]
				]
				const momentSnapshot = await BaseAPI.getDataWithQuery({
					db_name: "moments",
					searchConditions: {
						filters: momentFilters,
					}
				})

				if (momentSnapshot) {
					momentSnapshot.docs.forEach(doc => {
						const thumbUrl = doc.data().thumbUrl
						if (!momentUsageMap.has(thumbUrl)) {
							momentUsageMap.set(thumbUrl, [])
						}
						momentUsageMap.get(thumbUrl)!.push(doc.id)
					})
				}
			}

			// 各画像に使用状況を追加
			return images.map(image => {
				const usedInBlogs = blogUsageMap.get(image.url) || []
				const usedInMoments = momentUsageMap.get(image.url) || []
				const isUsedAsThumbnail = usedInBlogs.length > 0 || usedInMoments.length > 0
				
				return {
					...image,
					isUsedAsThumbnail,
					usedInBlogs,
					usedInMoments
				}
			})
		} catch (error) {
			console.error('画像使用状況のバッチチェックに失敗しました:', error)
			return images.map(image => ({
				...image,
				isUsedAsThumbnail: false,
				usedInBlogs: [],
				usedInMoments: []
			}))
		}
	}

	// 画像の使用状況をチェックする関数
	const checkImageUsage = async (imageUrl: string) => {
		const userInfo = authStore.userInfo
		
		if (!userInfo || !userInfo.uid) {
			return {
				isUsedAsThumbnail: false,
				usedInBlogs: [],
				usedInMoments: []
			}
		}

		try {
			// ブログでの使用状況をチェック
			const blogFilters = [
				["uid", "==", userInfo.uid],
				["thumbUrl", "==", imageUrl]
			]
			const blogSnapshot = await BaseAPI.getDataWithQuery({
				db_name: "blogs",
				searchConditions: {
					filters: blogFilters,
				}
			})

			// つぶやき（moments）での使用状況をチェック
			const momentFilters = [
				["uid", "==", userInfo.uid],
				["thumbUrl", "==", imageUrl]
			]
			const momentSnapshot = await BaseAPI.getDataWithQuery({
				db_name: "moments",
				searchConditions: {
					filters: momentFilters,
				}
			})

			const usedInBlogs = blogSnapshot ? blogSnapshot.docs.map(doc => doc.id) : []
			const usedInMoments = momentSnapshot ? momentSnapshot.docs.map(doc => doc.id) : []
			const isUsedAsThumbnail = usedInBlogs.length > 0 || usedInMoments.length > 0

			return {
				isUsedAsThumbnail,
				usedInBlogs,
				usedInMoments
			}
		} catch (error) {
			console.error('画像使用状況のチェックに失敗しました:', error)
			return {
				isUsedAsThumbnail: false,
				usedInBlogs: [],
				usedInMoments: []
			}
		}
	}

	// フォルダに格納されている画像数取得
	const getImageCount = async (folder_id: string | null) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合は0を返す
		if (!userInfo || !userInfo.uid) {
			return 0
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
			["folder_id", "==", folder_id]
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "images",
				searchConditions: {
					filters: filters,
				}
			}
		)
		return querySnapshot ? querySnapshot.size : 0
	}

	const deleteItem = async (file: any) => {
		const userInfo = authStore.userInfo
		
		// ユーザー情報がnullの場合はエラーを投げる
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		try {
			// 画像をstorageから削除
			const storagePath = `images/${userInfo.uid}/${file.name}`
			const fileRef = storageRef(storage, storagePath)
			await deleteObject(fileRef)
		} catch (error) {
			throw new Error('画像の削除に失敗しました')
		}

		await BaseAPI.deleteData(
			{db_name: "images", item_id: file.id},
		)
	}

	// ストアをクリアする関数（ログアウト時用）
	const clearStore = () => {
		imageList.value = []
	}

	return {
		imageList,
		create,
		update,
		getList,
		getImageCount,
		deleteItem,
		clearStore,
		checkImageUsage,
		checkImagesUsageBatch
	}
})
