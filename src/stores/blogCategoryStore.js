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
	setDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useBlogStore } from '@/stores/blogStore';

// ブログカテゴリー管理
export const useBlogCategoryStore = defineStore('blog_category', {
	state: () => ({
		categoryList: [],
	}),
	actions: {
		async create(category) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				const blogCategoryDocRef = collection(db, "blog_category");
				await addDoc(blogCategoryDocRef, {
					uid: user.uid,
					pre_category_id: category.pre_category_id,
					name: category.name,
					createdAt: new Date(),
					updatedAt: new Date()
				});
				// 再取得
				await this.getList();
			} catch (error) {
				throw new Error('カテゴリーの作成に失敗しました');
			}
		},
		async update(category) {
			try {
				// 取得したURLをstoreに保存
				const docRef = doc(db, "blog_category", category.id);
				await setDoc(docRef, {
					pre_category_id: category.pre_category_id,
					name: category.name,
					updatedAt: new Date()
				}, { merge: true });
				// 再取得
				await this.getList();
			} catch (error) {
				throw new Error('カテゴリーの更新に失敗しました');
			}
		},
		// 親カテゴリーのみ取得
		async getList() {
			const authStore = useAuthStore();
			const user = authStore.user;

			const blogStore = useBlogStore();
			this.categoryList = [];

			try {
				const blogCategoryDocRef = collection(db, "blog_category");
				const querySnapshot = await getDocs(query(
					blogCategoryDocRef,
					where("uid", "==", user.uid),
				));
				const allCategories = querySnapshot.docs.map(doc => {
					const data = doc.data();

					if (data.createdAt && data.createdAt.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					return {
						id: doc.id,
						blog_count: 0,
						pre_category_id: data.pre_category_id,
						...data
					};
				});

				// ブログカウントを取得
				for (const category of allCategories) {
					category.blog_count = await blogStore.getListForCategoryCount(category.id);
				}
				// 親カテゴリー順に並べ替え、子カテゴリーを末尾に追加
				const categoryMap = new Map();
				// ID でマッピング
				allCategories.forEach(category => {
					categoryMap.set(category.id, category);
				});
				// 子カテゴリーの blog_count を親カテゴリーに加算
				allCategories.forEach(category => {
					if (category.pre_category_id) {
						const parentCategory = categoryMap.get(category.pre_category_id);
						if (parentCategory) {
							parentCategory.blog_count += category.blog_count;
						}
					}
				});
				// 親カテゴリーを優先して並べ替え、子カテゴリーを親の直後に追加
				const sortedCategories = [];
				allCategories
					.filter(category => !category.pre_category_id)
					.sort((a, b) => a.createdAt - b.createdAt)
					.forEach(parentCategory => {
						sortedCategories.push(parentCategory);
						allCategories
							.filter(category => category.pre_category_id === parentCategory.id)
							.sort((a, b) => a.createdAt - b.createdAt)
							.forEach(childCategory => {
								sortedCategories.push(childCategory);
							});
					});
				this.categoryList = sortedCategories;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async get(category_id) {
			const result = ref(null);

			try {
				const docRef = doc(db, "blog_category", category_id);
				const snapshot = await getDoc(docRef);
				if (snapshot.exists()) {
					result.value = snapshot.data();
				}
				return result.value;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async delete(category) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				// 親カテゴリーを削除する場合は、子カテゴリーの紐付きも削除する
				if (category.pre_category_id == null) {
					const blogCategoryDocRef = collection(db, "blog_category");
					const querySnapshot = await getDocs(query(
						blogCategoryDocRef,
						where("uid", "==", user.uid),
						where("pre_category_id", "==", category.id)
					));
					const updatePromises = querySnapshot.docs.map(async (doc) => {
						const childDocRef = doc.ref;
						await setDoc(childDocRef, { pre_category_id: null }, { merge: true });
					});
					await Promise.all(updatePromises);
				}

				const docRef = doc(db, "blog_category", category.id);
				await deleteDoc(docRef);

				// 再取得
				await this.getList();
			} catch (error) {
				throw new Error('カテゴリーの削除に失敗しました');
			}
		}
	}
});
