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

export const useLikeStore = defineStore('like', {
	actions: {
		async create(blog_id) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				const likesDocRefs = collection(db, "like");
				await addDoc(likesDocRefs, {
					uid: user.uid,
					blog_id: blog_id,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			} catch (error) {
				throw new Error('いいねに失敗しました');
			}
		},
		// 指定のブログにいいねした
		async getListForBlog(blog_id) {
			const result = [];

			try {
				const likesDocRefs = collection(db, "like");
				const querySnapshot = await getDocs(query(
					likesDocRefs,
					where("blog_id", "==", blog_id)
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
		},
		// 指定のユーザーがいいねした
		async getListForUser() {
			const authStore = useAuthStore();
			const user = authStore.user;
			const result = [];

			try {
				const likesDocRefs = collection(db, "like");
				const querySnapshot = await getDocs(query(
					likesDocRefs,
					where("uid", "==", user.uid)
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
		},
		async getLikeCounts(blogIds) {
			const counts = {};
			for (const id of blogIds) {
				counts[id] = await this.getLikeCount(id);
			}
			return counts;
		},
		// 指定のブログにいいねした数
		async getLikeCount(blog_id) {
			const result = ref(null);

			try {
				result.value = await this.getListForBlog(blog_id);
				return result.value.length;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async delete(blog_id) {
			try {
				const likeDocRef = doc(db, "like", blog_id);
				await deleteDoc(likeDocRef);
			} catch (error) {
				throw new Error('いいねの削除に失敗しました');
			}
		}
	}
});
