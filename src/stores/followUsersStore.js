import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import {
	collection,
	addDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

// フォロー管理
export const useFollowUsersStore = defineStore('follow_users', () => {
	const authStore = useAuthStore()

	const create = async (follow_uid) => {
		const userInfo = authStore.userInfo;

		try {
			const docsRef = collection(db, "follow_users");

			await addDoc(docsRef, {
				uid: userInfo.uid,
				follow_uid: follow_uid,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		} catch (error) {
			throw new Error('フォローユーザーの登録に失敗しました');
		}
	}

	const deleteFollow = async (doc_id) => {
		try {
			const docRef = doc(db, "follow_users", doc_id);
			await deleteDoc(docRef);
		} catch (error) {
			throw new Error('フォローユーザーの削除に失敗しました');
		}
	}

	return {
		create,
		deleteFollow
	}
})
