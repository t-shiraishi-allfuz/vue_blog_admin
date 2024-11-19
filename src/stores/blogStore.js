import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
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
		}
	}
});
