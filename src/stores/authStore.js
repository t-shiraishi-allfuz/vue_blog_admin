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

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: null,
		loading: true,
	}),
	actions: {
		// ユーザー登録
		async register(email, password) {
			try {
				await setPersistence(auth, browserLocalPersistence);
				const userCredential = await createUserWithEmailAndPassword(auth, email, password);
				this.user = userCredential.user;

				// パスワードをハッシュ化して保存
				const usersStore = useUsersStore();
				const blogSettingStore = useBlogSettingStore();

				// ユーザーデータを作成
				await usersStore.create(this.user, email, password);
				// デフォルトのブログ設定を作成
				await blogSettingStore.create();
			} catch (error) {
				console.log(error.code);
				if (this.user) {
					await this.logout();
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
		},

		// ログイン
		async login(email, password) {
			try {
				await setPersistence(auth, browserLocalPersistence);
				await signInWithEmailAndPassword(auth, email, password);
			} catch (error) {
				throw new Error('ログインに失敗しました');
			}
		},

		// ログアウト
		async logout() {
			try {
				await signOut(auth);
				this.user = null;
			} catch (error) {
				throw new Error('ログアウトに失敗しました');
			}
		},

		// パスワードリセットメール送信
		async resetPassword(email) {
			try {
				const actionCodeSettings = {
					url: process.env.VUE_APP_ROOT +'/reset_password_confirm',
					handleCodeInApp: true,
				}
				await sendPasswordResetEmail(auth, email, actionCodeSettings);
			} catch (error) {
				throw new Error('メールの送信に失敗しました');
			}
		},

		// パスワードリセット
		async resetPasswordConfirm(oobCode, password) {
			try {
				// 再設定コード確認
				const email = await verifyPasswordResetCode(auth, oobCode);

				// パスワードチェック
				const usersStore = useUsersStore();
				const isSamePassword = await usersStore.checkSame(email, password);
				if (isSamePassword) {
					throw new Error("新しいパスワードは前回と異なる必要があります");
				}

				// 新しいパスワード設定
				await confirmPasswordReset(auth, oobCode, password);

				// パスワードを更新
				await usersStore.update(this.user, email, password);
			} catch (error) {
				throw new Error('パスワードの再設定に失敗しました');
			}
		},

		// 認証状態の監視
		async initializeAuth() {
			return new Promise((resolve) => {
				onAuthStateChanged(auth, (currentUser) => {
					this.user = currentUser;
					this.loading = false;
					resolve();
				});
			});
		}
	}
});
