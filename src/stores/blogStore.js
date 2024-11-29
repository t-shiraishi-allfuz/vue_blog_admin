import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import {
	collection,
	query,
	where,
	orderBy,
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
			let authStore = useAuthStore();
			const user = authStore.user;
			blog.uid = user.uid;
			blog.createdAt = new Date();
			blog.updatedAt = new Date();

			try {
				let blogDocRefs = collection(db, "blog");
				await addDoc(blogDocRefs, blog);
			} catch (error) {
				throw new Error('ブログの投稿に失敗しました');
			}
		},
		async update(blog, blog_id) {
			try {
				let blogDocRef = doc(db, "blog", blog_id);
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
			let authStore = useAuthStore();
			const user = authStore.user;
			let commentStore = useCommentStore();
			let likeStore = useLikeStore();
			const result = [];

			try {
				let blogDocRefs = collection(db, "blog");
				let blogQuery = query(
					blogDocRefs,
					where("uid", "==", user.uid),
					where("isPublished", "==", true),
					orderBy("createdAt", "desc"),
				);
				const querySnapshot = await getDocs(blogQuery);
				const blogList = querySnapshot.docs.map((doc) => {
					const data = { id: doc.id, ...doc.data() };
					if (data.createdAt?.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					return { ...data, rawDoc: doc };
				});
				
				const commentCounts = await commentStore.getCommentCounts(
					blogList.map((blog) => blog.id)
				);
				const likeCounts = await likeStore.getLikeCounts(
					blogList.map((blog) => blog.id)
				);

				// 結果を組み立てる
				for (const blog of blogList) {
					result.push({
						...blog,
						reply_count: 0, // 必要なら更新
						comment_count: commentCounts[blog.id] || 0,
						like_count: likeCounts[blog.id] || 0,
					});
				}
				return result;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		// 全ユーザーのブログデータ取得
		async getListForAll() {
			let commentStore = useCommentStore();
			let likeStore = useLikeStore();
			const result = [];

			try {
				let blogDocRefs = collection(db, "blog");
				let blogQuery = query(
					blogDocRefs,
					where("isPublished", "==", true),
					orderBy("createdAt", "desc"),
				);
				const querySnapshot = await getDocs(blogQuery);
				const blogList = querySnapshot.docs.map((doc) => {
					const data = { id: doc.id, ...doc.data() };
					if (data.createdAt?.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					return { ...data, rawDoc: doc };
				});
				
				const commentCounts = await commentStore.getCommentCounts(
					blogList.map((blog) => blog.id)
				);
				const likeCounts = await likeStore.getLikeCounts(
					blogList.map((blog) => blog.id)
				);

				// 結果を組み立てる
				for (const blog of blogList) {
					result.push({
						...blog,
						reply_count: 0, // 必要なら更新
						comment_count: commentCounts[blog.id] || 0,
						like_count: likeCounts[blog.id] || 0,
					});
				}
				return result;
			} catch (error) {
				console.log(error.message);
				throw new Error('データの取得に失敗しました');
			}
		},
		// フォロー中ユーザーのブログデータ取得
		async getListForFollow() {
			let commentStore = useCommentStore();
			let likeStore = useLikeStore();
			const result = [];

			try {
				let blogDocRefs = collection(db, "blog");
				let blogQuery = query(
					blogDocRefs,
					where("isPublished", "==", true),
					orderBy("createdAt", "desc"),
				);
				const querySnapshot = await getDocs(blogQuery);
				const blogList = querySnapshot.docs.map((doc) => {
					const data = { id: doc.id, ...doc.data() };
					if (data.createdAt?.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					return { ...data, rawDoc: doc };
				});
				
				const commentCounts = await commentStore.getCommentCounts(
					blogList.map((blog) => blog.id)
				);
				const likeCounts = await likeStore.getLikeCounts(
					blogList.map((blog) => blog.id)
				);

				// 結果を組み立てる
				for (const blog of blogList) {
					result.push({
						...blog,
						reply_count: 0, // 必要なら更新
						comment_count: commentCounts[blog.id] || 0,
						like_count: likeCounts[blog.id] || 0,
					});
				}
				return result;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async get(blog_id) {
			let commentStore = useCommentStore();
			let likeStore = useLikeStore();

			try {
				let blogDocRef = doc(db, "blog", blog_id);
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

					if (data.createdAt?.toDate) {
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
			let authStore = useAuthStore();
			const user = authStore.user;

			try {
				let blogDocRefs = collection(db, "blog");
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
				let blogDocRef = doc(db, "blog", blog_id);
				await deleteDoc(blogDocRef);
			} catch (error) {
				throw new Error('ブログの削除に失敗しました');
			}
		}
	}
});
