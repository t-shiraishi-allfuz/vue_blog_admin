import { defineStore } from 'pinia'
import { auth } from '@/setting/firebase'
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signInWithCredential,
	signOut,
	onAuthStateChanged,
	setPersistence,
	browserLocalPersistence,
	sendPasswordResetEmail,
	verifyPasswordResetCode,
	confirmPasswordReset,
	GoogleAuthProvider
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { useUsersStore } from '@/stores/usersStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'

// 型定義
interface GoogleResponse {
	credential: string
	[key: string]: any
}

// interface ActionCodeSettings {
// 	url: string
// 	handleCodeInApp: boolean
// }

export const useAuthStore = defineStore('auth', () => {
	const usersStore = useUsersStore()
	const blogSettingStore = useBlogSettingStore()

	const userInfo = ref<User | null>(null)
	const isLogin = ref<boolean>(false)
	const isNewUser = ref<boolean>(false)

		// ユーザー登録
	const create = async (email: string, password: string): Promise<void> => {
		try {
			await setPersistence(auth, browserLocalPersistence)
			const userCredential = await createUserWithEmailAndPassword(auth, email, password)
			userInfo.value = userCredential.user

			// ユーザーデータをキャッシュ
			localStorage.setItem("user_info", JSON.stringify(userInfo.value))

			// ユーザーデータを作成
			await usersStore.create(userInfo.value, email, password)
			// デフォルトのブログ設定を作成
			await blogSettingStore.create()
		} catch (error: any) {
			if (userInfo.value) {
				await logout()
			}

			switch (error.code) {
				case 'auth/email-already-in-use':
					throw new Error('登録済みのメールアドレスです')
				case 'auth/invalid-email':
					throw new Error('無効なメールアドレスです')
				case 'auth/weak-password':
					throw new Error('パスワードが短すぎます。8文字以上のパスワードを設定してください')
				default:
					throw new Error('ユーザー登録に失敗しました。')
			}
		}
	}

	// ログイン
	const login = async (email: string, password: string): Promise<void> => {
		try {
			await setPersistence(auth, browserLocalPersistence)
			await signInWithEmailAndPassword(auth, email, password)

			setUserInfo()
		} catch (error) {
			throw new Error('ログインに失敗しました')
		}
	}

	// Google認証でログイン（vue3-google-login用）
	const loginWithGoogle = async (googleResponse: GoogleResponse): Promise<void> => {
		try {
			// 認証の永続化を設定
			await setPersistence(auth, browserLocalPersistence)
			
			// Google認証レスポンスからFirebase認証情報を作成
			const credential = GoogleAuthProvider.credential(googleResponse.credential)
			
			// Firebase認証でサインイン
			const result = await signInWithCredential(auth, credential)
			const user = result.user

			// ユーザーデータをキャッシュ
			localStorage.setItem("user_info", JSON.stringify(user))

			// 既存ユーザーかチェック
			const existingUser = await usersStore.getUserByUid(user.uid)
			
			if (!existingUser) {
				// 新規ユーザーの場合、ユーザーデータを作成
				isNewUser.value = true
				await usersStore.createGoogleUser(user)
				// デフォルトのブログ設定を作成
				await blogSettingStore.create()
			} else {
				isNewUser.value = false
			}

			setUserInfo()
		} catch (error: any) {
			console.error('Google認証エラー詳細:', error)
			console.error('エラーコード:', error.code)
			console.error('エラーメッセージ:', error.message)
			throw new Error(`Google認証に失敗しました: ${error.message}`)
		}
	}

	// ログアウト
	const logout = async (): Promise<void> => {
		try {
			await signOut(auth)

			localStorage.removeItem('user_info')
			userInfo.value = null
			isLogin.value = false
			isNewUser.value = false
		} catch (error) {
			throw new Error('ログアウトに失敗しました')
		}
	}

	const setUserInfo = (): void => {
		let data = localStorage.getItem('user_info')
		if (data != null) {
			userInfo.value = JSON.parse(data)
			isLogin.value = true
		} else {
			userInfo.value = null
			isLogin.value = false
		}
	}

	const getUserInfo = (): User | null => {
		return userInfo.value
    }

	// パスワードリセットメール送信
	const resetPassword = async (email: string): Promise<void> => {
		try {
			const actionCodeSettings = {
				url: process.env.VUE_APP_ROOT +'/reset_password_confirm',
				handleCodeInApp: true,
			}
			await sendPasswordResetEmail(auth, email, actionCodeSettings)
		} catch (error) {
			throw new Error('メールの送信に失敗しました')
		}
	}

	// パスワードリセット
	const resetPasswordConfirm = async (oobCode: string, password: string): Promise<void> => {
		try {
			// 再設定コード確認
			const email = await verifyPasswordResetCode(auth, oobCode)

			// パスワードチェック
			const isSamePassword = await usersStore.checkSame(email, password)
			if (isSamePassword) {
				throw new Error("新しいパスワードは前回と異なる必要があります")
			}

			// 新しいパスワード設定
			await confirmPasswordReset(auth, oobCode, password)

			// パスワードを更新
			await usersStore.update(userInfo.value as any, email, password)
		} catch (error) {
			throw new Error('パスワードの再設定に失敗しました')
		}
	}

	// 認証状態の監視
	const initializeAuth = (): Promise<void> => {
		return new Promise((resolve) => {
			onAuthStateChanged(auth, (currentUser) => {
				userInfo.value = currentUser
				isLogin.value = !!currentUser
				resolve()
			})
		})
	}

	return {
		userInfo,
		isLogin,
		isNewUser,
		create,
		login,
		loginWithGoogle,
		logout,
		setUserInfo,
		getUserInfo,
		resetPassword,
		resetPasswordConfirm,
		initializeAuth
	}
})
