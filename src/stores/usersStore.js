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
			const querySnapshot = await BaseAPI.getData({db_name: "users", item_id: uid})
			return querySnapshot?.data()
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

	// オーナーユーザーかどうかを判定
	const isOwner = async (uid) => {
		try {
			const querySnapshot = await BaseAPI.getData({db_name: "users", item_id: uid})
			if (querySnapshot) {
				const userData = querySnapshot.data()
				return userData && userData.isOwner === true
			} else {
				return false
			}
		} catch (error) {
			console.error('オーナー権限確認エラー:', error)
			return false
		}
	}

	// ユーザーをオーナーに設定
	const setOwner = async (uid) => {
		try {
			await BaseAPI.setData(
				{db_name: "users", item_id: uid},
				{
					isOwner: true,
					updatedAt: new Date()
				}
			)
			return true
		} catch (error) {
			console.error('オーナー設定エラー:', error)
			throw new Error('オーナー権限の設定に失敗しました')
		}
	}

	return {
		create,
		update,
		checkSame,
		getUserByUid,
		createGoogleUser,
		isOwner,
		setOwner
	}
})
