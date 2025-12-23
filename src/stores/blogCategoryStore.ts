import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
import { useBlogStore } from '@/stores/blogStore'

// 型定義
interface BlogCategoryData {
	id: string
	uid: string
	pre_category_id: string | null
	name: string
	blog_count: number
	createdAt: Date
	updatedAt: Date
	[key: string]: any
}

interface CreateCategoryData {
	pre_category_id?: string | null
	name: string
}

interface UpdateCategoryData {
	id: string
	pre_category_id?: string | null
	name: string
}

// ブログカテゴリー管理
export const useBlogCategoryStore = defineStore('blog_category', () => {
	const categoryList = ref<BlogCategoryData[]>([])

	const authStore = useAuthStore()
	const blogStore = useBlogStore()

	const mapDocToCategory = (doc: any): BlogCategoryData => {
		const data = doc.data()
		if (data.createdAt && data.createdAt.toDate) {
			data.createdAt = data.createdAt.toDate()
		}
		if (data.updatedAt && data.updatedAt.toDate) {
			data.updatedAt = data.updatedAt.toDate()
		}
		return {
			id: doc.id,
			blog_count: 0, // getListで後から設定
			...data
		}
	}

	const create = async (category: CreateCategoryData): Promise<void> => {
		const userInfo = authStore.userInfo;
		if (!userInfo) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const payload = {
			uid: userInfo.uid,
			pre_category_id: category.pre_category_id || null,
			name: category.name,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		try {
			await BaseAPI.addData(
				{db_name: "blog_category"},
				payload
			)
		} catch (error: any) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	const update = async (category: UpdateCategoryData): Promise<void> => {
		const payload = {
			pre_category_id: category.pre_category_id || null,
			name: category.name,
			updatedAt: new Date()
		}

		try {
			await BaseAPI.setData(
				{db_name: "blog_category", item_id: category.id},
				payload
			)
		} catch (error: any) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	const getDetail = async (category_id: string): Promise<BlogCategoryData | null> => {
		try {
			const doc = await BaseAPI.getData(
				{db_name: "blog_category", item_id: category_id},
			)
			return doc ? mapDocToCategory(doc) : null
		} catch (error: any) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	const deleteItem = async (category: BlogCategoryData): Promise<void> => {
		try {
			// 親カテゴリーを削除する場合は、子カテゴリーの紐付きも削除する
			if (category.pre_category_id == null) {
				const userInfo = authStore.userInfo
				if (!userInfo) {
					throw new Error('ユーザー情報が取得できません')
				}
				
				const filters = [
					["uid", "==", userInfo.uid],
					["pre_category_id", "==", category.id]
				]
				const querySnapshot = await BaseAPI.getDataWithQuery(
					{
						db_name: "blog_category",
						searchConditions: {
							filters: filters,
						}
					}
				)
				const updatePromises = querySnapshot.docs.map((doc) => {
					return BaseAPI.setData(
						{db_name: "blog_category", item_id: doc.id},
						{pre_category_id: null, updatedAt: new Date()}
					)
				})
				await Promise.all(updatePromises)

				await BaseAPI.deleteData(
					{db_name: "blog_category", item_id: category.id},
				)
			}
		} catch (error: any) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	const getList = async (): Promise<void> => {
		const userInfo = authStore.userInfo;
		if (!userInfo) {
			throw new Error('ユーザー情報が取得できません')
		}
		
		const filters = [
			["uid", "==", userInfo.uid],
		]

		try {
			const querySnapshot = await BaseAPI.getDataWithQuery(
				{
					db_name: "blog_category",
					searchConditions: {
						filters: filters,
					}
				}
			)

			if (!querySnapshot) {
				categoryList.value = []
				return
			}

			const rawCategories = querySnapshot.docs.map(mapDocToCategory)

			// ブログカウントを取得
			const countPromises = rawCategories.map(async (category) => {
				const count = await blogStore.getListForCategoryCount(category.id)
				return { ...category, blog_count: count }
			})
			const allCategories = await Promise.all(countPromises)

			// 親カテゴリー順に並べ替え、子カテゴリーを末尾に追加
			const categoryMap = new Map<string, BlogCategoryData>()
			// ID でマッピング
			allCategories.forEach(category => {
				categoryMap.set(category.id, category)
			})
			// 子カテゴリーの blog_count を親カテゴリーに加算
			allCategories.forEach(category => {
				if (category.pre_category_id) {
					const parentCategory = categoryMap.get(category.pre_category_id)
					if (parentCategory) {
						parentCategory.blog_count += category.blog_count
					}
				}
			})

			// 親カテゴリーを優先して並べ替え、子カテゴリーを親の直後に追加
			const sortedCategories: BlogCategoryData[] = []
			allCategories
				.filter(category => !category.pre_category_id)
				.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
				.forEach(parentCategory => {
					sortedCategories.push(parentCategory)
					allCategories
						.filter(category => category.pre_category_id === parentCategory.id)
						.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
						.forEach(childCategory => {
							sortedCategories.push(childCategory)
						})
				})
			categoryList.value = sortedCategories
		} catch (error: any) {
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	return {
		categoryList,
		create,
		update,
		getList,
		getDetail,
		deleteItem
	}
})
