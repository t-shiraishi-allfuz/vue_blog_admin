import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import {
	collection,
	query,
	where,
	getDocs,
	addDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export const useBookmarkStore = defineStore('bookmark', () => {
	const authStore = useAuthStore();

	const create = async (blog_id) => {
		const userInfo = authStore.userInfo;

		try {
			const likesDocRefs = collection(db, "bookmark");
			await addDoc(likesDocRefs, {
				uid: userInfo.uid,
				blog_id: blog_id,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		} catch (error) {
			throw new Error('ブックマークに失敗しました');
		}
	}

	// ブックマークしているブログIDのリスト取得
	const getBlogIds = async () => {
		const userInfo = authStore.getUserInfo();
		const results = [];
		
		try {
			const bookmarkDocRefs = collection(db, "bookmark");
			const querySnapshot = await getDocs(query(
				bookmarkDocRefs,
				where("uid", "==", userInfo.uid)
			));
			for (const doc of querySnapshot.docs) {
				const data = doc.data();
				results.push(data.blog_id);
			}
			return results;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	// 指定のブログをブックマークしてるかどうか（一括）
	const isBookmarks = async (blogIds) => {
		const results = {};

		for (const id of blogIds) {
			results[id] = await isBookmark(id);
		}
		return results;
	}

	// 指定のブログをブックマークしてるかどうか
	const isBookmark = async (blog_id) => {
		const userInfo = authStore.getUserInfo();

		try {
			const bookmarkDocRefs = collection(db, "bookmark");
			const querySnapshot = await getDocs(query(
				bookmarkDocRefs,
				where("blog_id", "==", blog_id),
				where("uid", "==", userInfo.uid)
			));
			const result = querySnapshot.docs;
			return result.length > 0 ? true : false;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	const deleteBookmark = async (blog_id) => {
		const userInfo = authStore.getUserInfo();

		try {
			const bookmarkDocRefs = collection(db, "bookmark");
			const querySnapshot = await getDocs(query(
				bookmarkDocRefs,
				where("blog_id", "==", blog_id),
				where("uid", "==", userInfo.uid)
			));
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				deleteDoc(doc(bookmarkDocRefs, docSnapshot.id))
			);
			await Promise.all(deletePromises);
		} catch (error) {
			throw new Error('ブックマークの解除に失敗しました');
		}
	}

	return {
		create,
		getBlogIds,
		isBookmarks,
		isBookmark,
		deleteBookmark
	}
})