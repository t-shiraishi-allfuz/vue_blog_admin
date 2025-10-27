import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useImagesStore } from '@/stores/imagesStore'

// 型定義
interface ImagesFolderData {
	id: string
	uid: string
	name: string
	image_count: number
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

interface CreateFolderData {
	name: string
}

interface UpdateFolderData {
	id: string
	name: string
}

// 画像のフォルダ管理
export const useImagesFolderStore = defineStore('images_folder', () => {
	const authStore = useAuthStore()
	const imagesStore = useImagesStore()

	const folderList = ref<ImagesFolderData[]>([])

	const create = async (folder: CreateFolderData): Promise<void> => {
		const userInfo = authStore.userInfo
		if (!userInfo) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		await BaseAPI.addData(
			{db_name: "images_folder"},
			{
				uid: userInfo.uid,
				name: folder.name,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		)
	}

	const update = async (folder: UpdateFolderData): Promise<void> => {
		await BaseAPI.setData(
			{db_name: "images_folder", item_id: folder.id},
			{
				name: folder.name,
				updatedAt: new Date()
			}
		)
	}

	const getList = async (): Promise<void> => {
		const userInfo = authStore.userInfo
		if (!userInfo) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "images_folder",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const result: ImagesFolderData[] = []
			for (const doc of querySnapshot.docs) {
				const imageCount = await imagesStore.getImageCount(doc.id)

				// 対象のフォルダに格納されている画像数を取得
				const data: ImagesFolderData = {
					id: doc.id,
					image_count: imageCount,
					...doc.data()
				} as ImagesFolderData
				
				if (data.createdAt && (data.createdAt as any).toDate) {
					data.createdAt = (data.createdAt as any).toDate()
				}
				result.push(data)
			}
			// createdAt の昇順でソート
			result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

			folderList.value = result
		}
	}

	const deleteItem = async (docId: string): Promise<void> => {
		const userInfo = authStore.userInfo
		if (!userInfo) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
			["folder_id", "==", docId]
		]

		// フォルダに紐づく画像のデータを更新
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "images",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const updatePromises = querySnapshot.docs.map(async (doc) => {
				const imageDocRef = doc.ref
				await BaseAPI.setData(
					{db_name: "images", item_id: imageDocRef.id},
					{ folder_id: null }
				)
			})
			await Promise.all(updatePromises)
		}

		await BaseAPI.deleteData(
			{db_name: "images_folder", item_id: docId},
		)
	}

	return {
		folderList,
		create,
		update,
		getList,
		deleteItem
	}
})
