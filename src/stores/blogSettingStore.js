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

export const useBlogSettingStore = defineStore('blogSetting', {
	state: () => ({
		blogSetting: {
			title: "仮タイトル",
			description: "仮説明",
			category: "一般",
			profileUrl: null,
			updatedAt: null,
		},
		tempSetting: {
			title: "",
			description: "",
			category: "一般",
			profileUrl: null,
		},
	}),
	actions: {
		setBlogSetting(setting) {
			this.blogSetting = { ...setting };
		},
		setTempSetting(setting) {
			this.tempSetting = { ...setting };
		},
		async create() {
			this.setBlogSetting(this.blogSetting);
			this.blogSetting.createdAt = new Date();
			this.blogSetting.updatedAt = new Date();

			try {
				const authStore = useAuthStore();
				const user = authStore.user;
				const settingDocRef = doc(db, "blog_setting", user.uid);
				await setDoc(settingDocRef, this.blogSetting);
			} catch (error) {
				throw error.message;
			}
		},
		async uploadProfileImage(image) {
			if (!image.value) return null;

			try {
				const authStore = useAuthStore();
				const user = authStore.user;
				const storagePath = `profile_images/${user.uid}/${image.value.name}`;
				const fileRef = storageRef(storage, storagePath);

				// Firebase Storageに画像をアップロード
				await uploadBytes(fileRef, image.value);
				return await getDownloadURL(fileRef);
			} catch (error) {
				throw error.message;
			}
		},
		async updateSettingFromFirestore(image) {
			this.setBlogSetting(this.tempSetting);
			this.blogSetting.updatedAt = new Date();

			const imageUrl = await this.uploadProfileImage(image);
			if (imageUrl) this.blogSetting.profileUrl = imageUrl;

			try {
				const authStore = useAuthStore();
				const user = authStore.user;

				// タイトル重複チェック
				const isUnique = await this.isTitleUnique(user, this.tempSetting.title);
				if (!isUnique) {
					throw new Error("このブログタイトルは既に使用されています");
				}
				const settingDocRef = doc(db, "blog_setting", user.uid);
				await setDoc(settingDocRef, this.blogSetting, { merge: true });
			} catch (error) {
				throw error.message;
			}
		},
		async fetchSettingFromFirestore() {
			const authStore = useAuthStore();
			const user = authStore.user;

			if (user) {
				const settingDocRef = doc(db, "blog_setting", user.uid);
				const snapshot = await getDoc(settingDocRef);

				if (snapshot.exists()) {
					const data = snapshot.data();
					this.setBlogSetting(data);
					this.setTempSetting(data);
				}
			}
		},
		// タイトルの重複チェック
		async isTitleUnique(user, title) {
			const blogSettingRef = collection(db, "blog_setting");
			const q = query(
				blogSettingRef,
				where("title", "==", title),
			);
			const snapshot = await getDocs(q);
			const result = snapshot.docs.filter(doc => doc.id !== user.uid);
		
			return result.length > 0 ? false : true;
		}
	}
});
