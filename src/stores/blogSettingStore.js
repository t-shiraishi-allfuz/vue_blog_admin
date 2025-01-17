import { ref } from 'vue';
import { defineStore } from 'pinia';
import { storage, db } from '@/setting/firebase';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import {
	getDoc,
	setDoc,
	doc,
	collection,
	query,
	where,
	getDocs
} from 'firebase/firestore';
import { useAuthStore } from '@/stores/authStore';

export const useBlogSettingStore = defineStore('blogSetting', () => {
	const tempSetting = ref({
		title: "仮タイトル",
		description: "仮説明",
		name: "名無しさん",
		profileUrl: null,
		createdAt: null,
		updatedAt: null,
	})

	const blogSetting = ref(null);

	const authStore = useAuthStore()

	const setBlogSetting = (setting) => {
		return tempSetting.value = { ...setting };
	}

	const getBlogSetting = () => {
		return blogSetting.value;
	}

	const create = async () => {
		const userInfo = authStore.getUserInfo();

		blogSetting.value = tempSetting.value;
		blogSetting.value.createdAt = new Date();
		blogSetting.value.updatedAt = new Date();

		try {
			const settingDocRef = doc(db, "blog_setting", userInfo.uid);
			await setDoc(settingDocRef, blogSetting.value);
		} catch (error) {
			throw error.message;
		}
	}

	// プロフィール画像アップロード
	const uploadProfileImage = async (image) => {
		if (!image.value) return null;

		const userInfo = authStore.getUserInfo();

		try {
			const storagePath = `profile_images/${userInfo.uid}/${image.value.name}`;
			const fileRef = storageRef(storage, storagePath);

			// Firebase Storageに画像をアップロード
			await uploadBytes(fileRef, image.value);
			return await getDownloadURL(fileRef);
		} catch (error) {
			throw error.message;
		}
	}

	const update = async (image, data) => {
		const userInfo = authStore.getUserInfo();

		data.updatedAt = new Date();

		const imageUrl = await uploadProfileImage(image);
		if (imageUrl) data.profileUrl = imageUrl;

		try {
			// タイトル重複チェック
			const isUnique = await isTitleUnique(userInfo.uid, data.title);
			if (!isUnique) {
				throw new Error("このブログタイトルは既に使用されています");
			}
			const settingDocRef = doc(db, "blog_setting", userInfo.uid);
			await setDoc(settingDocRef, data, { merge: true });
			blogSetting.value = data;
		} catch (error) {
			console.log(error);
			throw error.message;
		}
	}

	const get = async () => {
		const userInfo = authStore.getUserInfo();

		if (userInfo) {
			const settingDocRef = doc(db, "blog_setting", userInfo.uid);
			const snapshot = await getDoc(settingDocRef);

			if (snapshot.exists()) {
				blogSetting.value = snapshot.data();
			}
		}
	}

	const getForUids = async (uids) => {
		const results = {};
		for (const uid of uids) {
			results[uid] = await getForUid(uid);
		}
		return results;
	}

	const getForUid = async (uid) => {
		const settingDocRef = doc(db, "blog_setting", uid);
		const snapshot = await getDoc(settingDocRef);

		if (snapshot.exists()) {
			return snapshot.data();
		}
	}

	// タイトルの重複チェック
	const isTitleUnique = async (uid, title) => {
		const blogSettingRef = collection(db, "blog_setting");
		const q = query(
			blogSettingRef,
			where("title", "==", title),
		);
		const snapshot = await getDocs(q);
		const result = snapshot.docs.filter(doc => doc.id !== uid);
	
		return result.length > 0 ? false : true;
	}

	return {
		tempSetting,
		blogSetting,
		setBlogSetting,
		getBlogSetting,
		create,
		uploadProfileImage,
		update,
		get,
		getForUids,
		getForUid,
		isTitleUnique
	}
})
