import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import { collection, query, where, doc, setDoc, getDocs } from 'firebase/firestore';
import bcryptjs from 'bcryptjs';

export const useUsersStore = defineStore('users', {
	actions: {
		async create(user, email, password) {
			try {
				const userRef = doc(db, "users", user.uid);

				// パスワードをハッシュ化して保存
				const passwordHash = await bcryptjs.hash(password, 10);
				await setDoc(userRef, { email, passwordHash });
			} catch (error) {
				throw new Error('ユーザーデータの登録に失敗しました');
			}
		},
		async update(user, email, password) {
			try {
				const userRef = doc(db, "users", user.uid);

				// パスワードをハッシュ化して保存
				const passwordHash = await bcryptjs.hash(password, 10);
				await setDoc(userRef, { passwordHash: passwordHash }, { merge: true });
			} catch (error) {
				throw new Error('ユーザーデータの更新に失敗しました');
			}
		},
		// パスワードチェック
		async checkSame(email, password) {
			try {
				// 保存済みのパスワード取得
				const usersRef = collection(db, "users");
				const querySnapshot = await getDocs(query(usersRef, where("email", "==", email)));
				const userData = querySnapshot.docs[0].data();
				const previousHash = userData.passwordHash;

				const isSame = await bcryptjs.compare(password, previousHash);
				return isSame;
			} catch (error) {
				throw new Error('パスワードのチェックに失敗しました');
			}
		},
	}
});