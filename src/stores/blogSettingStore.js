import BaseAPI from '@/api/base'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { storage } from '@/setting/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { useAuthStore } from '@/stores/authStore'
import { useFollowUsersStore } from '@/stores/followUsersStore'

export const useBlogSettingStore = defineStore('blogSetting', () => {
	const tempSetting = ref({
		title: "仮タイトル",
		description: "仮説明",
		name: "名無しさん",
		profileUrl: null,
		is_follower: false,
		is_following: false,
		createdAt: null,
		updatedAt: null,
	})

	const blogSetting = ref(null)

	const authStore = useAuthStore()
	const followUsersStore = useFollowUsersStore()

	const setBlogSetting = (setting) => {
		return tempSetting.value = { ...setting }
	}

	const getBlogSetting = () => {
		return blogSetting.value
	}

	const create = async () => {
		const userInfo = authStore.getUserInfo()

		blogSetting.value = tempSetting.value
		blogSetting.value.createdAt = new Date()
		blogSetting.value.updatedAt = new Date()

		await BaseAPI.setData(
			{db_name: "blog_setting", item_id: userInfo.uid},
			blogSetting
		)
	}

	// プロフィール画像アップロード
	const uploadProfileImage = async (image) => {
		if (!image.value) return null

		const userInfo = authStore.getUserInfo()

		try {
			const storagePath = `profile_images/${userInfo.uid}/${image.value.name}`
			const fileRef = storageRef(storage, storagePath)

			// Firebase Storageに画像をアップロード
			await uploadBytes(fileRef, image.value)
			return await getDownloadURL(fileRef)
		} catch (error) {
			throw error.message
		}
	}

	const update = async (image, data) => {
		const userInfo = authStore.getUserInfo()
		data.updatedAt = new Date()

		const imageUrl = await uploadProfileImage(image)
		if (imageUrl) data.profileUrl = imageUrl

		// タイトル重複チェック
		const isUnique = await isTitleUnique(userInfo.uid, data.title)
		if (!isUnique) {
			throw new Error("このブログタイトルは既に使用されています")
		}

		await BaseAPI.setData(
			{db_name: "blog_setting", item_id: userInfo.uid},
			data
		)
		blogSetting.value = data
	}

	const getDetail = async () => {
		const userInfo = authStore.getUserInfo()

		const doc = await BaseAPI.getData(
			{
				db_name: "blog_setting",
				item_id: userInfo.uid
			},
		)
		if (doc) {
			blogSetting.value = doc.data()
		}
	}

	const getForUids = async (uids) => {
		const promises = uids.map(id => getForUid(id))
		const results = await Promise.all(promises)
		const userIds = {}
		uids.forEach((id, index) => {
			userIds[id] = results[index]
		})
		return userIds
	}

	const getForUid = async (uid) => {
		const doc = await BaseAPI.getData(
			{db_name: "blog_setting", item_id: uid},
		)

		if (!doc) return null

		const setting = doc.data()
		setting.is_follower = await followUsersStore.isFollower(uid)
		setting.is_following = await followUsersStore.isFollowing(uid)
		return setting
	}

	// タイトルの重複チェック
	const isTitleUnique = async (uid, title) => {
		const filters = [
			["title", "==", title],
		]

		const querySnapshot = await BaseAPI.getDataWithQuery(
			{
				db_name: "blog_setting",
				searchConditions: {
					filters: filters,
				}
			}
		)
		const result = querySnapshot.docs.filter(doc => doc.id !== uid)
		return result.length > 0 ? false : true
	}

	return {
		tempSetting,
		blogSetting,
		setBlogSetting,
		getBlogSetting,
		create,
		uploadProfileImage,
		update,
		getDetail,
		getForUids,
		getForUid,
		isTitleUnique
	}
})
