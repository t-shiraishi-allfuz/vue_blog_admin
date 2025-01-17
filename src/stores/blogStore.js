import { ref } from 'vue';
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
import { useBookmarkStore } from '@/stores/bookmarkStore';

export const useBlogStore = defineStore('blog', () => {
	const authStore = useAuthStore()
	const commentStore = useCommentStore()
	const likeStore = useLikeStore()
	const bookmarkStore = useBookmarkStore()

	const selectType = ref(0);

	const tempBlog = ref({
		uid: null,
		title: "",
		summary: "",
		content: "",
		category_id: null,
		isAdult: false,
		isPublished: false,
		thumbUrl: null,
		share_blog_id: null,
		createdAt: null,
		updatedAt: null
	})

	const setSelectType = (type) => {
		selectType.value = type;
	}

	const create = async(blog) => {
		const userInfo = authStore.userInfo;
		blog.uid = userInfo.uid;
		blog.createdAt = new Date();
		blog.updatedAt = new Date();

		try {
			const blogDocRefs = collection(db, "blog");
			await addDoc(blogDocRefs, blog);
		} catch (error) {
			throw new Error('ブログの投稿に失敗しました');
		}
	}

	const update = async (blog) => {
		try {
			const blogDocRef = doc(db, "blog", blog.id);
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
	}

	const get = async (blog_id) => {
		try {
			const blogDocRef = doc(db, "blog", blog_id);
			const snapshot = await getDoc(blogDocRef);
			if (snapshot.exists()) {
				const doc = snapshot;
				const commentCount = await commentStore.getCommentCount(doc.id);
				const likeCount = await likeStore.getLikeCount(doc.id);
				const isLike = await likeStore.isLike(doc.id);
				const isBookmark = await bookmarkStore.isBookmark(doc.id);
				const data = {
					id: doc.id,
					comment_count: commentCount,
					like_count: likeCount,
					is_like: isLike,
					is_bookmark: isBookmark,
					shareBlog: null,
					...doc.data()
				};	

				if (data.createdAt?.toDate) {
					data.createdAt = data.createdAt.toDate();
				}
				return data;
			}
			return null;
		} catch (error) {
			console.log(error.message);
			throw new Error('データの取得に失敗しました');
		}
	}

	const deleteBlog = async (blog_id) => {
		try {
			const blogDocRef = doc(db, "blog", blog_id);
			await deleteDoc(blogDocRef);
		} catch (error) {
			console.log(error.message);
			throw new Error('ブログの削除に失敗しました');
		}
	}

	// 自分のブログ一覧取得
	const getList = async () => {
		const userInfo = authStore.userInfo;
		const result = [];

		try {
			const blogDocRefs = collection(db, "blog");
			const blogQuery = query(
				blogDocRefs,
				where("uid", "==", userInfo.uid),
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
			)

			const likeCounts = await likeStore.getLikeCounts(
				blogList.map((blog) => blog.id)
			)

			const isLikes = await likeStore.isLikes(
				blogList.map((blog) => blog.id)
			)

			const isBookmarks = await bookmarkStore.isBookmarks(
				blogList.map((blog) => blog.id)
			)

			// 結果を組み立てる
			for (const blog of blogList) {
				result.push({
					...blog,
					comment_count: commentCounts[blog.id] || 0,
					like_count: likeCounts[blog.id] || 0,
					is_like: isLikes[blog.id] || false,
					is_bookmark: isBookmarks[blog.id] || false
				});
			}
			return result;
		} catch (error) {
			console.log(error.message);
			throw new Error('データの取得に失敗しました');
		}
	}
	// 全ユーザーのブログデータ取得
	const getListForAll = async () => {
		const result = [];

		try {
			const blogDocRefs = collection(db, "blog");
			const blogQuery = query(
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
			const isLikes = await likeStore.isLikes(
				blogList.map((blog) => blog.id)
			)
			const isBookmarks = await bookmarkStore.isBookmarks(
				blogList.map((blog) => blog.id)
			)
			// 結果を組み立てる
			for (const blog of blogList) {
				result.push({
					...blog,
					comment_count: commentCounts[blog.id] || 0,
					like_count: likeCounts[blog.id] || 0,
					is_like: isLikes[blog.id] || false,
					is_bookmark: isBookmarks[blog.id] || false
				});
			}
			return result;
		} catch (error) {
			console.log(error.message);
			throw new Error('データの取得に失敗しました');
		}
	}
	// フォロー中ユーザーのブログデータ取得
	const getListForFollow = async () => {
		const result = [];

		try {
			const blogDocRefs = collection(db, "blog");
			const blogQuery = query(
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
	}
	// お気に入りのブログデータ取得
	const getListForBookmark = async () => {
		const result = [];

		try {
			const blogIds = await bookmarkStore.getBlogIds();
			for (const blogId of blogIds) {
				result.push(await get(blogId));
			}
			return result;
		} catch (error) {
			console.log(error.message);
			throw new Error('データの取得に失敗しました');
		}
	}
	// カテゴリーIDに一致するブログ数取得
	const getListForCategoryCount = async (category_id) => {
		const userInfo = authStore.userInfo;

		try {
			const blogDocRefs = collection(db, "blog");
			const querySnapshot = await getDocs(query(
				blogDocRefs,
				where("uid", "==", userInfo.uid),
				where("category_id", "==", category_id)
			));
			return querySnapshot.size;
		} catch (error) {
			console.log(error.message);
			throw new Error('データの取得に失敗しました');
		}
	}

	return {
		selectType,
		tempBlog,
		setSelectType,
		create,
		update,
		get,
		deleteBlog,
		getList,
		getListForAll,
		getListForFollow,
		getListForBookmark,
		getListForCategoryCount
	}
})
