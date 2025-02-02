import { ref } from 'vue';
import { defineStore } from 'pinia';
import { auth } from '@/setting/firebase';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	setPersistence,
	browserLocalPersistence,
	sendPasswordResetEmail,
	verifyPasswordResetCode,
	confirmPasswordReset
} from 'firebase/auth';
import { useUsersStore } from '@/stores/usersStore';
import { useBlogSettingStore } from '@/stores/blogSettingStore';

export const useAuthStore = defineStore('auth', () => {
	const usersStore = useUsersStore();
	const blogSettingStore = useBlogSettingStore();

	const userInfo = ref(null);
	const isLogin = ref(false);

		// ユーザー登録
	const create = async (email, password) => {
		try {
			await setPersistence(auth, browserLocalPersistence);
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			userInfo.value = userCredential.user;

			// ユーザーデータをキャッシュ
			localStorage.setItem("user_info", JSON.stringify(userInfo.value));

			// ユーザーデータを作成
			await usersStore.create(userInfo.value, email, password);
			// デフォルトのブログ設定を作成
			await blogSettingStore.create();
		} catch (error) {
			if (userInfo.value) {
				await logout();
			}

			switch (error.code) {
				case 'auth/email-already-in-use':
					throw new Error('登録済みのメールアドレスです');
				case 'auth/invalid-email':
					throw new Error('無効なメールアドレスです');
				case 'auth/weak-password':
					throw new Error('パスワードが短すぎます。8文字以上のパスワードを設定してください');
				default:
					throw new Error('ユーザー登録に失敗しました。');
			}
		}
	}

	// ログイン
	const login = async (email, password) => {
		try {
			await setPersistence(auth, browserLocalPersistence);
			await signInWithEmailAndPassword(auth, email, password);

			setUserInfo();
		} catch (error) {
			throw new Error('ログインに失敗しました');
		}
	}

	// ログアウト
	const logout = async () => {
		try {
			await signOut(auth);

			localStorage.removeItem('user_info');
			userInfo.value = null;
			isLogin.value = false
		} catch (error) {
			throw new Error('ログアウトに失敗しました');
		}
	}

	const setUserInfo = () => {
		let data = localStorage.getItem('user_info');
		if (data != null) {
			userInfo.value = JSON.parse(data);
		} else {
			userInfo.value = null
		}
	}

	const getUserInfo = () => {
		return userInfo.value
    }

	// パスワードリセットメール送信
	const resetPassword = async (email) => {
		try {
			const actionCodeSettings = {
				url: process.env.VUE_APP_ROOT +'/reset_password_confirm',
				handleCodeInApp: true,
			}
			await sendPasswordResetEmail(auth, email, actionCodeSettings);
		} catch (error) {
			throw new Error('メールの送信に失敗しました');
		}
	}

	// パスワードリセット
	const resetPasswordConfirm = async (oobCode, password) => {
		try {
			// 再設定コード確認
			const email = await verifyPasswordResetCode(auth, oobCode);

			// パスワードチェック
			const isSamePassword = await usersStore.checkSame(email, password);
			if (isSamePassword) {
				throw new Error("新しいパスワードは前回と異なる必要があります");
			}

			// 新しいパスワード設定
			await confirmPasswordReset(auth, oobCode, password);

			// パスワードを更新
			await usersStore.update(userInfo, email, password);
		} catch (error) {
			throw new Error('パスワードの再設定に失敗しました');
		}
	}

	// 認証状態の監視
	const initializeAuth = () => {
		return new Promise((resolve) => {
			onAuthStateChanged(auth, (currentUser) => {
				userInfo.value = currentUser;
				isLogin.value = true;
				resolve();
			});
		});
	}

	return {
		userInfo,
		isLogin,
		create,
		login,
		logout,
		setUserInfo,
		getUserInfo,
		resetPassword,
		resetPasswordConfirm,
		initializeAuth
	}
})
