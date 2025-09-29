import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import bcryptjs from 'bcryptjs'

export const useUsersStore = defineStore('users', () => {
	const create = async (userInfo, email, password) => {
		const passwordHash = await bcryptjs.hash(password, 10)
		await BaseAPI.setData(
			{db_name: "users", item_id: userInfo.uid},
			{
				email,
				passwordHash,
				provider: 'email',
				createdAt: new Date()
			}
		)
	}

	const update = async (userInfo, email, password) => {
		const passwordHash = await bcryptjs.hash(password, 10)
		await BaseAPI.setData(
			{db_name: "users", item_id: userInfo.uid},
			{
				passwordHash
			}
		)
	}

	// パスワードチェック
	const checkSame = async (email, password) => {
		const filters = [
			["email", "==", email],
		]
		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "users",
				searchConditions: {
					filters: filters,
				}
			}
		)

		if (querySnapshot) {
			const userData = querySnapshot.docs[0].data()
			const previousHash = userData.passwordHash
			return await bcryptjs.compare(password, previousHash)
		} else {
			return false
		}
	}

	// UIDでユーザーを取得
	const getUserByUid = async (uid) => {
		try {
			const userData = await BaseAPI.getData({db_name: "users", item_id: uid})
			return userData
		} catch (error) {
			return null
		}
	}

	// Google認証ユーザーを作成
	const createGoogleUser = async (user) => {
		await BaseAPI.setData(
			{db_name: "users", item_id: user.uid},
			{
				email: user.email,
				provider: 'google',
				createdAt: new Date()
			}
		)
	}

	return {
		create,
		update,
		checkSame,
		getUserByUid,
		createGoogleUser
	}
})
