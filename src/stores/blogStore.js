import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import {
	collection,
	query,
	where,
	getDocs,
	addDoc,
	setDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export const useBlogStore = defineStore('blog', {
	actions: {
		async create(blog) {
			const authStore = useAuthStore();
			const user = authStore.user;
			blog.uid = user.uid;
			blog.createdAt = new Date();
			blog.updatedAt = new Date();
			console.log(blog);

			try {
				const blogDocRefs = collection(db, "blog");
				await addDoc(blogDocRefs, blog);
			} catch (error) {
				throw new Error('ブログの投稿に失敗しました');
			}
		},
		async update(blog) {
			blog.updatedAt = new Date();
			console.log(blog);

			try {
				const blogDocRef = doc(db, "blog", blog.id);
				await setDoc(blogDocRef, blog, { merge: true });
			} catch (error) {
				throw new Error('ブログの更新に失敗しました');
			}
		},
		async getList() {
			const authStore = useAuthStore();
			const user = authStore.user;
			const result = [];

			try {
				const blogDocRefs = collection(db, "blog");
				const querySnapshot = await getDocs(query(blogDocRefs, where("uid", "==", user.uid)));
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
		async delete(blog_id) {
			try {
				const blogDocRef = doc(db, "blog", blog_id);
				await deleteDoc(blogDocRef);
			} catch (error) {
				throw new Error('ブログの削除に失敗しました');
			}
		}
	}
});
