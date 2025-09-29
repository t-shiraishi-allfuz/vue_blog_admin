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
	const imageList = ref([])

	const create = async (file, folder_id) => {
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
	}

	const update = async (file, folder_id) => {
		await BaseAPI.setData(
			{db_name: "images", item_id: file.id},
			{
				folder_id: folder_id != null ? folder_id : null,
				uploadedAt: new Date()
			}
		)
	}

	const getList = async (folder_id) => {
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

		imageList.value = querySnapshot.docs.map((doc) => {
			const data = { id: doc.id, ...doc.data() }
			return data
		})
	}

	// フォルダに格納されている画像数取得
	const getImageCount = async (folder_id) => {
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

	const deleteItem = async (file) => {
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
		clearStore
	}
})
