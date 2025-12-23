import BaseAPI from '@/api/base'
import bcryptjs from 'bcryptjs'
import type { User } from 'firebase/auth'

// 型定義
interface UserInfo {
	uid: string
	[key: string]: any
}

interface UserData {
	email: string
	passwordHash?: string
	provider: string
	createdAt: Date
	updatedAt?: Date
	birthDate?: string
	isOwner?: boolean
	[key: string]: any
}

export const useUsersStore = defineStore('users', () => {
	const create = async (userInfo: UserInfo, email: string, password: string): Promise<void> => {
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

	const update = async (userInfo: UserInfo, _email: string, password: string): Promise<void> => {
		const passwordHash = await bcryptjs.hash(password, 10)
		await BaseAPI.setData(
			{db_name: "users", item_id: userInfo.uid},
			{
				passwordHash
			}
		)
	}

	// パスワードチェック
	const checkSame = async (email: string, password: string): Promise<boolean> => {
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
	const getUserByUid = async (uid: string): Promise<UserData | null> => {
		try {
			const querySnapshot = await BaseAPI.getData({db_name: "users", item_id: uid})
			return querySnapshot?.data() as UserData || null
		} catch (error) {
			return null
		}
	}

	// Google認証ユーザーを作成
	const createGoogleUser = async (user: User): Promise<void> => {
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
	const isOwner = async (uid: string): Promise<boolean> => {
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
	const setOwner = async (uid: string): Promise<boolean> => {
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

	// 生年月日を更新
	const updateBirthDate = async (uid: string, birthDate: string): Promise<boolean> => {
		try {
			await BaseAPI.setData(
				{db_name: "users", item_id: uid},
				{
					birthDate: birthDate,
					updatedAt: new Date()
				}
			)
			return true
		} catch (error) {
			console.error('生年月日更新エラー:', error)
			throw new Error('生年月日の更新に失敗しました')
		}
	}

	// 年齢を計算
	const calculateAge = (birthDate: string): number | null => {
		if (!birthDate) return null
		
		const today = new Date()
		const birth = new Date(birthDate)
		let age = today.getFullYear() - birth.getFullYear()
		const monthDiff = today.getMonth() - birth.getMonth()
		
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--
		}
		
		return age
	}

	// 18歳以上かチェック
	const isAdult = (birthDate: string): boolean => {
		const age = calculateAge(birthDate)
		return age !== null && age >= 18
	}

	return {
		create,
		update,
		checkSame,
		getUserByUid,
		createGoogleUser,
		isOwner,
		setOwner,
		updateBirthDate,
		calculateAge,
		isAdult
	}
})
