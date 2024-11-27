import { ref } from 'vue';
import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import {
	collection,
	query,
	where,
	getDoc,
	getDocs,
	addDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export const useCommentStore = defineStore('comment', {
	actions: {
		async create(comment, blog_id) {
			const authStore = useAuthStore();
			const user = authStore.user;
			comment.uid = user.uid;
			comment.blog_id = blog_id;
			comment.createdAt = new Date();
			comment.updatedAt = new Date();

			try {
				const commentDocRefs = collection(db, "comment");
				await addDoc(commentDocRefs, comment);
			} catch (error) {
				throw new Error('コメントの投稿に失敗しました');
			}
		},
		async getList(blog_id) {
			const result = [];

			try {
				const commentDocRefs = collection(db, "comment");
				const querySnapshot = await getDocs(query(commentDocRefs, where("blog_id", "==", blog_id)));
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
		async get(comment_id) {
			const result = ref(null);

			try {
				const commentDocRef = doc(db, "comment", comment_id);
				const snapshot = await getDoc(commentDocRef);
				if (snapshot.exists()) {
					result.value = snapshot.data();
				}
				return result.value;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async getCommentCount(blog_id) {
			const result = ref(null);

			try {
				result.value = await this.getList(blog_id);
				return result.value.length;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async delete(comment_id) {
			try {
				const commentDocRef = doc(db, "comment", comment_id);
				await deleteDoc(commentDocRef);
			} catch (error) {
				throw new Error('コメントの削除に失敗しました');
			}
		}
	}
});