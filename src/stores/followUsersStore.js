import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

// フォロー管理
export const useFollowUsersStore = defineStore('follow_users', () => {
	const authStore = useAuthStore()

	const create = async (follow_uid) => {
		const userInfo = authStore.userInfo

		await BaseAPI.addData(
			{db_name: "follow_users"},
			{
				uid: userInfo.uid,
				follow_uid: follow_uid,
				createdAt: new Date(),
				updatedAt: new Date(),
			}
		)
	}

	const deleteItem = async (doc_id) => {
		await BaseAPI.deleteData(
			{db_name: "follow_users", item_id: doc_id},
		)
	}

	return {
		create,
		deleteItem
	}
})
