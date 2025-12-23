import { openAIConfig } from '@/setting/openai'
import { useAiSettingStore, type Message } from '@/stores/aiSettingStore'

export type { Message }

export function useChat() {
	const aiSettingStore = useAiSettingStore()
	const systemPrompt = ref<string>(openAIConfig.systemMessage)
	const messages = ref<Message[]>([
		{ role: 'system', content: systemPrompt.value }
	])
	const isLoading = ref(false)
	const error = ref<string | null>(null)

	// 初期化時にFirebaseから設定と会話履歴を読み込む
	const initialize = async () => {
		try {
			await aiSettingStore.getSetting()
			const savedMessage = aiSettingStore.getSystemMessage()
			systemPrompt.value = savedMessage
			
			// 会話履歴を読み込む
			const savedMessages = aiSettingStore.getMessages()
			if (savedMessages && savedMessages.length > 0) {
				messages.value = savedMessages
			} else {
				resetConversation(savedMessage)
			}
		} catch (error) {
			console.error('AI設定の初期化エラー:', error)
		}
	}

	const resetConversation = async (prompt?: string) => {
		const sourcePrompt = prompt ?? systemPrompt.value
		const nextPrompt = (sourcePrompt || openAIConfig.systemMessage).trim() || openAIConfig.systemMessage
		messages.value = [{ role: 'system', content: nextPrompt }]
		
		// Firebaseに保存
		try {
			await aiSettingStore.clearMessages()
		} catch (error) {
			console.error('会話履歴のクリアエラー:', error)
		}
	}

	const setSystemMessage = async (image: any, content: string, characterName?: string) => {
		const nextPrompt = content?.trim() || openAIConfig.systemMessage
		systemPrompt.value = nextPrompt
		
		// 既存の会話履歴を保持しつつ、システムメッセージだけを更新
		if (messages.value.length > 0 && messages.value[0].role === 'system') {
			messages.value[0].content = nextPrompt
		} else {
			// システムメッセージがない場合は先頭に追加
			messages.value.unshift({ role: 'system', content: nextPrompt })
		}
		
		// Firebaseに保存（システムメッセージと会話履歴の両方を保存）
		try {
			await aiSettingStore.saveSetting(image, nextPrompt, characterName)
			// 更新されたmessagesを保存（saveSettingの後に呼び出して最新のmessagesを保存）
			await aiSettingStore.saveMessages(messages.value)
		} catch (error) {
			console.error('AI設定の保存エラー:', error)
			// 保存に失敗しても続行
		}
	}

	const ensureSystemMessage = () => {
		const hasSystem = messages.value.length > 0 && messages.value[0].role === 'system'
		if (!hasSystem) {
			resetConversation()
		}
	}

	const sendMessage = async (content: string) => {
		if (!content.trim()) return

		isLoading.value = true
		error.value = null

		ensureSystemMessage()

		// ユーザーメッセージを追加
		const userMessage: Message = { role: 'user', content }
		messages.value.push(userMessage)
		
		// ユーザーメッセージを追加した時点でFirebaseに保存
		try {
			await aiSettingStore.saveMessages(messages.value)
		} catch (error) {
			console.error('会話履歴の保存エラー:', error)
			// 保存に失敗しても続行
		}

		try {
			const response = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Authorization': `Bearer ${openAIConfig.apiKey}`
				},
				body: JSON.stringify({
					model: openAIConfig.model,
					messages: messages.value,
					temperature: openAIConfig.temperature,
					max_tokens: openAIConfig.max_tokens
				})
			})

			const data = await response.json()

			if (!response.ok) {
				const apiError = (data as { error?: { message?: string } })?.error?.message
				throw new Error(apiError || 'APIリクエストに失敗しました')
			}

			const assistantMessage: Message = (data as { choices: { message: Message }[] }).choices[0].message

			// AIの回答を履歴に追加
			messages.value.push(assistantMessage)
			
			// Firebaseに会話履歴を保存
			try {
				await aiSettingStore.saveMessages(messages.value)
			} catch (error) {
				console.error('会話履歴の保存エラー:', error)
				// 保存に失敗しても続行
			}
		} catch (err) {
			error.value = err instanceof Error ? err.message : '予期せぬエラーが発生しました'
			console.error(err)
		} finally {
			isLoading.value = false
		}
	}

	return {
		messages,
		isLoading,
		error,
		systemPrompt,
		sendMessage,
		resetConversation,
		setSystemMessage,
		initialize
	}
}

