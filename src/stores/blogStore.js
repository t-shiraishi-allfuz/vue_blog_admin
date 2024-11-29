import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import {
	collection,
	query,
	where,
	getDoc,
	getDocs,
	addDoc,
	setDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useCommentStore } from '@/stores/commentStore';
import { useLikeStore } from '@/stores/likeStore';

export const useBlogStore = defineStore('blog', {
	actions: {
		async create(blog) {
			const authStore = useAuthStore();
			const user = authStore.user;
			blog.uid = user.uid;
			blog.createdAt = new Date();
			blog.updatedAt = new Date();

			try {
				const blogDocRefs = collection(db, "blog");
				await addDoc(blogDocRefs, blog);
			} catch (error) {
				throw new Error('ブログの投稿に失敗しました');
			}
		},
		async update(blog, blog_id) {
			try {
				const blogDocRef = doc(db, "blog", blog_id);
				await setDoc(blogDocRef, {
					title: blog.title,
					content: blog.content,
					summary: blog.summary,
					thumbUrl: blog.thumbUrl,
					category_id: blog.category_id,
					isPublished: blog.isPublished,
					updatedAt: new Date(),
				}, { merge: true });
			} catch (error) {
				throw new Error('ブログの更新に失敗しました');
			}
		},
		// 自分のブログ一覧取得
		async getList() {
			const authStore = useAuthStore();
			const commentStore = useCommentStore();
			const likeStore = useLikeStore();
			const user = authStore.user;
			const result = [];

			try {
				const blogDocRefs = collection(db, "blog");
				const querySnapshot = await getDocs(query(blogDocRefs, where("uid", "==", user.uid)));
				for (const doc of querySnapshot.docs) {
					const commentCount = await commentStore.getCommentCount(doc.id);
					const likeCount = await likeStore.getLikeCount(doc.id);
					const data = {
						id: doc.id,
						reply_count: 0,
						comment_count: commentCount,
						like_count: likeCount,
						...doc.data()
					};
					if (data.createdAt && data.createdAt.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					result.push(data);
				}
				return result;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		// 全ユーザーのブログデータ取得
		async getListForAll() {
			const commentStore = useCommentStore();
			const likeStore = useLikeStore();
			const result = [];

			try {
				const blogDocRefs = collection(db, "blog");
				const querySnapshot = await getDocs(query(
					blogDocRefs,
					where("isPublished", "==", true)
				));
				for (const doc of querySnapshot.docs) {
					const commentCount = await commentStore.getCommentCount(doc.id);
					const likeCount = await likeStore.getLikeCount(doc.id);
					const data = {
						id: doc.id,
						reply_count: 0,
						comment_count: commentCount,
						like_count: likeCount,
						...doc.data()
					};
					if (data.createdAt && data.createdAt.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					result.push(data);
				}
				return result;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		// フォロー中ユーザーのブログデータ取得
		async getListForFollow() {
			const commentStore = useCommentStore();
			const likeStore = useLikeStore();
			const result = [];

			try {
				const blogDocRefs = collection(db, "blog");
				const querySnapshot = await getDocs(query(
					blogDocRefs,
					where("isPublished", "==", true)
				));
				for (const doc of querySnapshot.docs) {
					const commentCount = await commentStore.getCommentCount(doc.id);
					const likeCount = await likeStore.getLikeCount(doc.id);
					const data = {
						id: doc.id,
						reply_count: 0,
						comment_count: commentCount,
						like_count: likeCount,
						...doc.data()
					};
					if (data.createdAt && data.createdAt.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					result.push(data);
				}
				return result;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async get(blog_id) {
			const commentStore = useCommentStore();
			const likeStore = useLikeStore();

			try {
				const blogDocRef = doc(db, "blog", blog_id);
				const snapshot = await getDoc(blogDocRef);
				if (snapshot.exists()) {
					const doc = snapshot;
					const commentCount = await commentStore.getCommentCount(doc.id);
					const likeCount = await likeStore.getLikeCount(doc.id);
					const data = {
						id: doc.id,
						reply_count: 0,
						comment_count: commentCount,
						like_count: likeCount,
						...doc.data()
					};	

					if (data.createdAt && data.createdAt.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					return data;
				}
				return null;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		// カテゴリーIDに一致するブログ数取得
		async getListForCategoryCount(category_id) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				const blogDocRefs = collection(db, "blog");
				const querySnapshot = await getDocs(query(
					blogDocRefs,
					where("uid", "==", user.uid),
					where("category_id", "==", category_id)
				));
				return querySnapshot.size;
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
