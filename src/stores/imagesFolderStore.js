//import { ref } from 'vue';
import { defineStore } from 'pinia';
import { db } from '@/setting/firebase';
import { collection, query, where, getDocs, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';
import { useImagesStore } from '@/stores/imagesStore';

// 画像のフォルダ管理
export const useImagesFolderStore = defineStore('images_folder', {
	state: () => ({
		folderList: [],
	}),
	actions: {
		async create(folder) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				// 取得したURLをstoreに保存
				const imagesFolderDocRef = collection(db, "images_folder");
				await addDoc(imagesFolderDocRef, {
					uid: user.uid,
					name: folder.name,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			} catch (error) {
				throw new Error('画像フォルダの作成に失敗しました');
			}
		},
		async update(folder) {
			try {
				// 取得したURLをstoreに保存
				const docRef = doc(db, "images_folder", folder.id);
				await setDoc(docRef, {
					name: folder.name,
					updatedAt: new Date()
				}, { merge: true });
			} catch (error) {
				throw new Error('画像フォルダの更新に失敗しました');
			}
		},
		async getList() {
			const authStore = useAuthStore();
			const user = authStore.user;

			const imagesStore = useImagesStore();
			const list = [];

			try {
				const imagesDocRef = collection(db, "images_folder");
				const querySnapshot = await getDocs(query(imagesDocRef, where("uid", "==", user.uid)));
				for (const doc of querySnapshot.docs) {
					const imageCount = await imagesStore.getImageCount(doc.id);

					// 対象のフォルダに格納されている画像数を取得
					const data = {
						id: doc.id,
						image_count: imageCount,
						...doc.data()
					};
					if (data.createdAt && data.createdAt.toDate) {
						data.createdAt = data.createdAt.toDate();
					}
					list.push(data);
				}
				// createdAt の昇順でソート
				list.sort((a, b) => a.createdAt - b.createdAt);

				return this.folderList = list;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async delete(id) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				// フォルダに紐づく画像のデータを更新
				const imagesDocRef = collection(db, "images");
				const querySnapshot = await getDocs(query(
					imagesDocRef,
					where("uid", "==", user.uid),
					where("folder_id", "==", id)
				));
				const updatePromises = querySnapshot.docs.map(async (doc) => {
					const imageDocRef = doc.ref;
					await setDoc(imageDocRef, { folder_id: null }, { merge: true });
				});
				await Promise.all(updatePromises);

				// storeからも削除
				const docRef = doc(db, "images_folder", id);
				await deleteDoc(docRef);
			} catch (error) {
				throw new Error('画像フォルダの削除に失敗しました');
			}
		}
	}
});
