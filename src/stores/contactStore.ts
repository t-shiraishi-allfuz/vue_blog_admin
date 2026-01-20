import BaseAPI from '@/api/base'
import { useAuthStore } from '@/stores/authStore'
import { useBlogSettingStore } from '@/stores/blogSettingStore'

// 型定義
interface ContactData {
	id: string
	uid: string | null
	email: string
	subject: string
	message: string
	createdAt: Date | null
	updatedAt: Date | null
	status: 'pending' | 'read' | 'replied'
	replyMessage?: string | null
	replyAt?: Date | null
	replyBy?: string | null
	setting?: any
}

interface CreateContactData {
	email: string
	subject: string
	message: string
}

interface UserInfo {
	uid: string
	[key: string]: any
}

export const useContactStore = defineStore('contact', () => {
	const authStore = useAuthStore()
	const blogSettingStore = useBlogSettingStore()

	const contactList = ref<ContactData[]>([])
	const contactDetail = ref<ContactData>({} as ContactData)

	const mapDocToContact = (doc: any): ContactData => {
		const data = doc.data()
		if (data.createdAt && data.createdAt.toDate) {
			data.createdAt = data.createdAt.toDate()
		}
		if (data.updatedAt && data.updatedAt.toDate) {
			data.updatedAt = data.updatedAt.toDate()
		}
		if (data.replyAt && data.replyAt.toDate) {
			data.replyAt = data.replyAt.toDate()
		}
		return {
			id: doc.id,
			...data
		} as ContactData
	}

	// お問い合わせを作成
	const create = async (contact: CreateContactData): Promise<void> => {
		const userInfo = authStore.userInfo as UserInfo | null
		
		const payload: any = {
			uid: userInfo?.uid ?? null,
			email: contact.email ?? '',
			subject: contact.subject ?? '',
			message: contact.message ?? '',
			status: 'pending' as const,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		await BaseAPI.addData(
			{db_name: "contact"},
			payload
		)
	}

	// お問い合わせ一覧を取得（管理者用：全て）
	const getList = async (): Promise<void> => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "contact",
				searchConditions: {
					sorters: [["createdAt", "desc"]],
					limit: 1000
				}
			})

			if (querySnapshot && querySnapshot.docs) {
				const promises = querySnapshot.docs.map(async (doc) => {
					const contact = mapDocToContact(doc)
					
					// ユーザー情報を取得（ログインしている場合）
					if (contact.uid) {
						try {
							contact.setting = await blogSettingStore.getForUid(contact.uid)
						} catch (error) {
							console.error('ユーザー情報の取得に失敗しました:', error)
							contact.setting = null
						}
					}
					
					return contact
				})
				
				contactList.value = await Promise.all(promises)
			} else {
				contactList.value = []
			}
		} catch (error: any) {
			console.error('お問い合わせ一覧の取得に失敗しました:', error)
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	// お問い合わせ一覧を取得（一般ユーザー用：自分のもののみ）
	const getListForUser = async (uid: string): Promise<void> => {
		try {
			const querySnapshot = await BaseAPI.getDataWithQuery({
				db_name: "contact",
				searchConditions: {
					filters: [["uid", "==", uid]],
					sorters: [["createdAt", "desc"]],
					limit: 1000
				}
			})

			if (querySnapshot && querySnapshot.docs) {
				const promises = querySnapshot.docs.map(async (doc) => {
					const contact = mapDocToContact(doc)
					
					// ユーザー情報を取得
					if (contact.uid) {
						try {
							contact.setting = await blogSettingStore.getForUid(contact.uid)
						} catch (error) {
							console.error('ユーザー情報の取得に失敗しました:', error)
							contact.setting = null
						}
					}
					
					return contact
				})
				
				contactList.value = await Promise.all(promises)
			} else {
				contactList.value = []
			}
		} catch (error: any) {
			console.error('お問い合わせ一覧の取得に失敗しました:', error)
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	// お問い合わせ詳細を取得
	const getDetail = async (contactId: string): Promise<void> => {
		try {
			const doc = await BaseAPI.getData({
				db_name: "contact",
				item_id: contactId
			})

			if (doc) {
				contactDetail.value = mapDocToContact(doc)
				
				// ユーザー情報を取得（ログインしている場合）
				if (contactDetail.value.uid) {
					try {
						contactDetail.value.setting = await blogSettingStore.getForUid(contactDetail.value.uid)
					} catch (error) {
						console.error('ユーザー情報の取得に失敗しました:', error)
						contactDetail.value.setting = null
					}
				}
			}
		} catch (error: any) {
			console.error('お問い合わせ詳細の取得に失敗しました:', error)
			throw new Error(`エラーが発生しました: ${error.message}`)
		}
	}

	// お問い合わせのステータスを更新
	const updateStatus = async (contactId: string, status: 'pending' | 'read' | 'replied'): Promise<void> => {
		await BaseAPI.setData(
			{db_name: "contact", item_id: contactId},
			{
				status: status,
				updatedAt: new Date()
			}
		)
	}

	// お問い合わせに返信を送信
	const sendReply = async (contactId: string, message: string): Promise<void> => {
		const userInfo = authStore.userInfo as UserInfo | null
		
		await BaseAPI.setData(
			{db_name: "contact", item_id: contactId},
			{
				replyMessage: message,
				replyAt: new Date(),
				replyBy: userInfo?.uid || null,
				status: 'replied' as const,
				updatedAt: new Date()
			}
		)
	}

	// お問い合わせを削除
	const deleteItem = async (contact: ContactData): Promise<void> => {
		await BaseAPI.deleteData(
			{db_name: "contact", item_id: contact.id}
		)
	}

	// ストアをクリア
	const clearStore = (): void => {
		contactList.value = []
		contactDetail.value = {} as ContactData
	}

	return {
		contactList,
		contactDetail,
		create,
		getList,
		getListForUser,
		getDetail,
		updateStatus,
		sendReply,
		deleteItem,
		clearStore
	}
})

