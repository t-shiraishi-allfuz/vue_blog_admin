import { ref } from 'vue';
import { defineStore } from 'pinia';
import { storage, db } from '@/setting/firebase';
import {
	getDownloadURL,
	ref as storageRef,
	uploadBytes,
	deleteObject
} from 'firebase/storage';
import {
	collection,
	query,
	where,
	getDocs,
	setDoc,
	addDoc,
	deleteDoc,
	doc
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export const useImagesStore = defineStore('images', () => {
	const authStore = useAuthStore();
	const imageList = ref([])

	const create = async (file, folder_id) => {
		const userInfo = authStore.userInfo;

		try {
			// 画像をstorageに保存
			const storagePath = `images/${userInfo.uid}/${file.name}`;
			const fileRef = storageRef(storage, storagePath);
			await uploadBytes(fileRef, file);
			const url = await getDownloadURL(fileRef);

			// 取得したURLをstoreに保存
			const imagesDocRef = collection(db, "images");
			await addDoc(imagesDocRef, {
				uid: userInfo.uid,
				name: file.name,
				url: url,
				folder_id: folder_id != null ? folder_id : null,
				uploadedAt: new Date()
			});
		} catch (error) {
			throw new Error('画像のアップロードに失敗しました');
		}
	}

	const update = async (file, folder_id) => {
		try {
			// 取得したURLをstoreに保存
			const imageDocRef = doc(db, "images", file.id);
			await setDoc(imageDocRef, {
				folder_id: folder_id != null ? folder_id : null,
				uploadedAt: new Date()
			}, { merge: true });
		} catch (error) {
			throw new Error('画像データの更新に失敗しました');
		}
	}

	const getList = async (folder_id) => {
		const userInfo = authStore.userInfo
		const list = [];

		let querySnapshot;

		try {
			const imagesDocRef = collection(db, "images");
			if (folder_id != null) {
				querySnapshot = await getDocs(query(
					imagesDocRef,
					where("uid", "==", userInfo.uid),
					where("folder_id", "==", folder_id)
				));
			} else {
				querySnapshot = await getDocs(query(
					imagesDocRef,
					where("uid", "==", userInfo.uid)
				));
			}
			querySnapshot.forEach(doc => {
				const data = { id: doc.id, ...doc.data() };
				list.push(data);
			});
			return imageList.value = list;
		} catch (error) {
			console.log(error.message);
			throw new Error('データの取得に失敗しました');
		}
	}

	// フォルダに格納されている画像数取得
	const getImageCount = async (folder_id) => {
		const userInfo = authStore.userInfo

		try {
			const imagesDocRef = collection(db, "images");
			const querySnapshot = await getDocs(query(
				imagesDocRef,
				where("uid", "==", userInfo.uid),
				where("folder_id", "==", folder_id)
			));
			return querySnapshot.size;
		} catch (error) {
			throw new Error('データの取得に失敗しました');
		}
	}

	const deleteImage = async (file) => {
		const userInfo = authStore.userInfo

		try {
			// 画像をstorageから削除
			const storagePath = `images/${userInfo.uid}/${file.name}`;
			const fileRef = storageRef(storage, storagePath);
			await deleteObject(fileRef);

			// storeからも削除
			const docRef = doc(db, "images", file.id);
			await deleteDoc(docRef);
		} catch (error) {
			throw new Error('画像の削除に失敗しました');
		}
	}

	return {
		imageList,
		create,
		update,
		getList,
		getImageCount,
		deleteImage
	}
})
