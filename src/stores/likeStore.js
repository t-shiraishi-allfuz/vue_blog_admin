import { ref } from 'vue';
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
import { useBlogSettingStore } from '@/stores/blogSettingStore';

export const useLikeStore = defineStore('like', () => {
	const authStore = useAuthStore();
	const blogSettingStore = useBlogSettingStore();

	const create = async (blog_id) => {
		const userInfo = authStore.userInfo;

		try {
			const likesDocRefs = collection(db, "like");
			await addDoc(likesDocRefs, {
				uid: userInfo.uid,
				blog_id: blog_id,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		} catch (error) {
			throw new Error('いいねに失敗しました');
		}
	}

	// 指定のブログにいいねした
	const getListForBlog = async (blog_id) => {
		const result = [];

		try {
			const likesDocRefs = collection(db, "like");
			const querySnapshot = await getDocs(query(
				likesDocRefs,
				where("blog_id", "==", blog_id)
			));
			const likeList = querySnapshot.docs.map((doc) => {
				const data = { id: doc.id, ...doc.data() };
				if (data.createdAt && data.createdAt.toDate) {
					data.createdAt = data.createdAt.toDate();
				}
				return { ...data };
			})

			const settingList = await blogSettingStore.getForUids(
				likeList.map((like) => like.uid)
			)

			for (const like of likeList) {
				result.push({
					...like,
					user: settingList[like.uid] || null
				})
			}
			return result;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	// 指定のユーザーがいいねした
	const getListForUser = async () => {
		const userInfo = authStore.userInfo;
		const result = [];

		try {
			const likesDocRefs = collection(db, "like");
			const querySnapshot = await getDocs(query(
				likesDocRefs,
				where("uid", "==", userInfo.uid)
			));
			querySnapshot.forEach(doc => {
				const data = { id: doc.id, ...doc.data() };
				if (data.createdAt && data.createdAt.toDate) {
					data.createdAt = data.createdAt.toDate();
				}
				result.push(data);
			})
			return result;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	const getLikeCounts = async (blogIds) => {
		const counts = {};
		for (const id of blogIds) {
			counts[id] = await getLikeCount(id);
		}
		return counts;
	}

	// 指定のブログにいいねした数
	const getLikeCount = async (blog_id) => {
		const result = ref(null);

		try {
			result.value = await getListForBlog(blog_id);
			return result.value.length;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	// 指定のブログにいいねしてるかどうか（一括）
	const isLikes = async (blogIds) => {
		const results = {};

		for (const id of blogIds) {
			results[id] = await isLike(id);
		}
		return results;
	}

	// 指定のブログにいいねしてるかどうか
	const isLike = async (blog_id) => {
		const userInfo = authStore.getUserInfo();

		try {
			const likesDocRefs = collection(db, "like");
			const querySnapshot = await getDocs(query(
				likesDocRefs,
				where("blog_id", "==", blog_id),
				where("uid", "==", userInfo.uid)
			));
			const result = querySnapshot.docs;
			return result.length > 0 ? true : false;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	const deleteLike = async (blog_id) => {
		const userInfo = authStore.getUserInfo();

		try {
			const likesDocRefs = collection(db, "like");
			const querySnapshot = await getDocs(query(
				likesDocRefs,
				where("blog_id", "==", blog_id),
				where("uid", "==", userInfo.uid)
			));
			const deletePromises = querySnapshot.docs.map((docSnapshot) =>
				deleteDoc(doc(likesDocRefs, docSnapshot.id))
			);
			await Promise.all(deletePromises);
		} catch (error) {
			throw new Error('いいねの削除に失敗しました');
		}
	}

	return {
		create,
		getListForBlog,
		getListForUser,
		getLikeCounts,
		getLikeCount,
		isLikes,
		isLike,
		deleteLike
	}
})
