import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
import { useImagesStore } from '@/stores/imagesStore'

// 型定義
interface ImagesFolderData {
	id: string
	uid: string
	name: string
	image_count: number
	order: number
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
		
		// 既存のフォルダ数を取得してorderを設定
		const maxOrder = folderList.value.length > 0 
			? Math.max(...folderList.value.map(f => f.order || 0))
			: -1
		
		await BaseAPI.addData(
			{db_name: "images_folder"},
			{
				uid: userInfo.uid,
				name: folder.name,
				order: maxOrder + 1,
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
					order: doc.data().order ?? 0,
					...doc.data()
				} as ImagesFolderData
				
				if (data.createdAt && (data.createdAt as any).toDate) {
					data.createdAt = (data.createdAt as any).toDate()
				}
				result.push(data)
			}
			// order の昇順でソート（orderが同じ場合はcreatedAtの昇順）
			result.sort((a, b) => {
				if (a.order !== b.order) {
					return (a.order || 0) - (b.order || 0)
				}
				return a.createdAt.getTime() - b.createdAt.getTime()
			})

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

	// 順序を更新
	const updateOrder = async (folderIds: string[]): Promise<void> => {
		const updatePromises = folderIds.map((id, index) => {
			return BaseAPI.setData(
				{db_name: "images_folder", item_id: id},
				{
					order: index,
					updatedAt: new Date()
				}
			)
		})
		await Promise.all(updatePromises)
		// リストを再取得
		await getList()
	}

	// 順序を移動（上下矢印用）
	const moveOrder = async (folderId: string, direction: 'up' | 'down'): Promise<void> => {
		const currentIndex = folderList.value.findIndex(f => f.id === folderId)
		if (currentIndex === -1) return

		const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
		if (newIndex < 0 || newIndex >= folderList.value.length) return

		// 配列内で要素を入れ替え
		const newList = [...folderList.value]
		const [movedItem] = newList.splice(currentIndex, 1)
		newList.splice(newIndex, 0, movedItem)

		// 新しい順序でIDリストを作成
		const folderIds = newList.map(f => f.id)
		await updateOrder(folderIds)
	}

	return {
		folderList,
		create,
		update,
		getList,
		deleteItem,
		updateOrder,
		moveOrder
	}
})
