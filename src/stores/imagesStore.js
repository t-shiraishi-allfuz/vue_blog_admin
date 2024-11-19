//import { ref } from 'vue';
import { defineStore } from 'pinia';
import { storage, db } from '@/setting/firebase';
import { getDownloadURL, ref as storageRef, uploadBytes, deleteObject } from 'firebase/storage';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export const useImagesStore = defineStore('images', {
	actions: {
		async create(file) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				// 画像をstorageに保存
				const storagePath = `images/${user.uid}/${file.name}`;
				const fileRef = storageRef(storage, storagePath);
				await uploadBytes(fileRef, file);
				const url = await getDownloadURL(fileRef);

				// 取得したURLをstoreに保存
				const imagesDocRef = collection(db, "images");
				await addDoc(imagesDocRef, {
					uid: user.uid,
					name: file.name,
					url: url,
					uploadedAt: new Date()
				});
				return url;
			} catch (error) {
				throw new Error('画像のアップロードに失敗しました');
			}
		},
		async getList() {
			const authStore = useAuthStore();
			const user = authStore.user;
			const result = [];

			try {
				const imagesDocRef = collection(db, "images");
				const querySnapshot = await getDocs(query(imagesDocRef, where("uid", "==", user.uid)));
				querySnapshot.forEach(doc => {
					result.push({
						id: doc.id,
						name: doc.data().name,
						url: doc.data().url
					});
				})
				return result;
			} catch (error) {
				throw new Error('データの取得に失敗しました');
			}
		},
		async delete(file) {
			const authStore = useAuthStore();
			const user = authStore.user;

			try {
				// 画像をstorageから削除
				const storagePath = `images/${user.uid}/${file.name}`;
				const fileRef = storageRef(storage, storagePath);
				await deleteObject(fileRef);

				// storeからも削除
				const docRef = doc(db, "images", file.id);
				await deleteDoc(docRef);
			} catch (error) {
				throw new Error('画像の削除に失敗しました');
			}
		}
	}
});
