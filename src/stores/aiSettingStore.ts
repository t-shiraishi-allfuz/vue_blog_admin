import BaseAPI from '@/api/base'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { openAIConfig } from '@/setting/openai'
import { storage } from '@/setting/firebase'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'

// 型定義
export interface Message {
	role: 'system' | 'user' | 'assistant'
	content: string
}

interface AiSettingData {
	systemMessage: string
	characterName?: string | null
	iconUrl?: string | null
	messages?: Message[]
	createdAt: Date | null
	updatedAt: Date | null
}

export const useAiSettingStore = defineStore('aiSetting', () => {
	const aiSetting = ref<AiSettingData | null>(null)
	const authStore = useAuthStore()

	// AI設定を取得
	const getSetting = async (): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		// ユーザー情報がnullの場合は処理を中断
		if (!userInfo || !userInfo.uid) {
			aiSetting.value = null
			return
		}

		try {
			const doc = await BaseAPI.getData({
				db_name: 'ai_setting',
				item_id: userInfo.uid
			})
			
			if (doc && doc.exists()) {
				const data = doc.data() as AiSettingData
				aiSetting.value = {
					systemMessage: data.systemMessage || openAIConfig.systemMessage,
					characterName: data.characterName || null,
					iconUrl: data.iconUrl || null,
					messages: data.messages || [],
					createdAt: data.createdAt || null,
					updatedAt: data.updatedAt || null
				}
			} else {
				// ドキュメントが存在しない場合はデフォルト値を使用
				aiSetting.value = {
					systemMessage: openAIConfig.systemMessage,
					characterName: null,
					iconUrl: null,
					messages: [],
					createdAt: null,
					updatedAt: null
				}
			}
		} catch (error) {
			console.error('AI設定の取得エラー:', error)
			// エラー時はデフォルト値を使用
			aiSetting.value = {
				systemMessage: openAIConfig.systemMessage,
				characterName: null,
				iconUrl: null,
				messages: [],
				createdAt: null,
				updatedAt: null
			}
		}
	}

	// AI設定を保存（会話履歴は保持）
	const saveSetting = async (image: any, systemMessage: string, characterName?: string): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		try {
			// プロフィール画像のアップロード
			let imageUrl: string | null = null
			if (image && image.length > 0 && image[0]) {
				// File[]から{ value: File }形式に変換
				const imageRef = { value: image[0] }
				imageUrl = await uploadIcon(imageRef)
			}

			const now = new Date()
			const settingData: AiSettingData = {
				systemMessage: systemMessage.trim() || openAIConfig.systemMessage,
				characterName: characterName?.trim() || aiSetting.value?.characterName || null,
				iconUrl: imageUrl || aiSetting.value?.iconUrl || null,
				messages: aiSetting.value?.messages || [],
				updatedAt: now,
				createdAt: aiSetting.value?.createdAt || now
			}

			await BaseAPI.setData(
				{ db_name: 'ai_setting', item_id: userInfo.uid },
				settingData
			)

			// ローカルの状態を更新
			aiSetting.value = settingData
		} catch (error: any) {
			console.error('AI設定の保存エラー:', error)
			throw new Error(`AI設定の保存に失敗しました: ${error.message}`)
		}
	}

	// 現在のシステムメッセージを取得
	const getSystemMessage = (): string => {
		return aiSetting.value?.systemMessage || openAIConfig.systemMessage
	}

	// キャラクター名を取得
	const getCharacterName = (): string | null => {
		return aiSetting.value?.characterName || null
	}

	// 会話履歴を取得
	const getMessages = (): Message[] => {
		return aiSetting.value?.messages || []
	}

	// 会話履歴を保存
	const saveMessages = async (messages: Message[]): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		try {
			const now = new Date()
			const settingData: AiSettingData = {
				systemMessage: aiSetting.value?.systemMessage || openAIConfig.systemMessage,
				characterName: aiSetting.value?.characterName || null,
				iconUrl: aiSetting.value?.iconUrl || null,
				messages: messages,
				updatedAt: now,
				createdAt: aiSetting.value?.createdAt || now
			}

			await BaseAPI.setData(
				{ db_name: 'ai_setting', item_id: userInfo.uid },
				settingData
			)

			// ローカルの状態を更新
			aiSetting.value = settingData
		} catch (error: any) {
			console.error('会話履歴の保存エラー:', error)
			throw new Error(`会話履歴の保存に失敗しました: ${error.message}`)
		}
	}

	// 会話履歴をクリア
	const clearMessages = async (): Promise<void> => {
		const userInfo = authStore.getUserInfo()
		
		if (!userInfo || !userInfo.uid) {
			throw new Error('ユーザー情報が取得できません')
		}

		try {
			const now = new Date()
			const systemMessage = aiSetting.value?.systemMessage || openAIConfig.systemMessage
			const settingData: AiSettingData = {
				systemMessage: systemMessage,
				characterName: aiSetting.value?.characterName || null,
				iconUrl: aiSetting.value?.iconUrl || null,
				messages: [],
				updatedAt: now,
				createdAt: aiSetting.value?.createdAt || now
			}

			await BaseAPI.setData(
				{ db_name: 'ai_setting', item_id: userInfo.uid },
				settingData
			)

			// ローカルの状態を更新
			aiSetting.value = settingData
		} catch (error: any) {
			console.error('会話履歴のクリアエラー:', error)
			throw new Error(`会話履歴のクリアに失敗しました: ${error.message}`)
		}
	}

	// AIアイコンを取得
	const getIconUrl = (): string | null => {
		return aiSetting.value?.iconUrl || null
	}

	// AIアイコンをアップロード
	const uploadIcon = async (image: any): Promise<string | null> => {
		try {
			// 画像が存在しない場合はnullを返す
			if (!image || !image.value) {
				return null
			}

			const userInfo = authStore.getUserInfo()
			
			// ユーザー情報が存在しない場合はエラー
			if (!userInfo || !userInfo.uid) {
				throw new Error('ユーザー情報が取得できません')
			}

			// ファイル名にタイムスタンプを追加して重複を防ぐ
			const timestamp = Date.now()
			const fileName = `${timestamp}_${image.value.name}`
			const storagePath = `ai_images/${userInfo.uid}/${fileName}`
			const fileRef = storageRef(storage, storagePath)

			// Firebase Storageに画像をアップロード
			await uploadBytes(fileRef, image.value)
			return await getDownloadURL(fileRef)
		} catch (error: any) {
			console.error('AIアイコンアップロードエラー:', error)
			throw new Error(`アイコンのアップロードに失敗しました: ${error.message}`)
		}
	}

	// ストアをクリア
	const clearStore = (): void => {
		aiSetting.value = null
	}

	return {
		aiSetting,
		getSetting,
		saveSetting,
		getSystemMessage,
		getCharacterName,
		getMessages,
		saveMessages,
		clearMessages,
		getIconUrl,
		uploadIcon,
		clearStore
	}
})

